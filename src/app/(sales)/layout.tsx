
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ShoppingCart, LogOut, User, Store } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { SalesCartProvider } from '@/context/SalesCartContext'

export default async function SalesLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Verify Role
    const { data: profile } = await supabase
        .from('profiles')
        .select('*, branch:branches(name)')
        .eq('id', user.id)
        .single()

    const allowedRoles = ['sales_store', 'sales_field']
    if (!profile || !allowedRoles.includes(profile.role)) {
        // If owner tries to access, maybe allow? For now strict separation.
        if (profile?.role === 'owner' || profile?.role === 'manager') {
            // Admins can see it (for testing/supervision)
        } else {
            return redirect('/dashboard')
        }
    }



    return (
        <SalesCartProvider>
            <div className="min-h-screen bg-background flex flex-col">
                {/* Header */}
                <header className="border-b bg-card sticky top-0 z-50">
                    <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                        <Link href="/sales/catalog" className="flex items-center gap-2 font-bold text-xl text-primary">
                            <Store className="w-6 h-6" />
                            <span>Portal Ventas</span>
                        </Link>

                        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
                            <Link href="/sales/catalog" className="hover:text-primary transition-colors">Catálogo</Link>
                            <Link href="/sales/orders" className="hover:text-primary transition-colors">Mis Ventas</Link>
                        </nav>

                        <div className="flex items-center gap-4">
                            {/* Cart Indicator */}
                            <Link href="/sales/cart">
                                <Button variant="ghost" size="icon" className="relative">
                                    <ShoppingCart className="w-5 h-5" />
                                    {/* Using a client component wrapper for badge would be better, but for now simple link */}
                                </Button>
                            </Link>

                            {/* User Menu */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={profile.avatar_url || ''} />
                                            <AvatarFallback>{profile.full_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56" align="end" forceMount>
                                    <DropdownMenuLabel className="font-normal">
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-medium leading-none">{profile.full_name}</p>
                                            <p className="text-xs leading-none text-muted-foreground">{profile.sales_code}</p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem>
                                        <Link href="/sales/profile" className="flex items-center w-full">
                                            <User className="mr-2 h-4 w-4" />
                                            <span>Mi Perfil</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-red-600 focus:text-red-600 cursor-pointer" asChild>
                                        <a href="/auth/signout" className="flex items-center w-full">
                                            <LogOut className="mr-2 h-4 w-4" />
                                            <span>Cerrar Sesión</span>
                                        </a>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 container mx-auto px-4 py-8">
                    {children}
                </main>
            </div>
        </SalesCartProvider>
    )
}
