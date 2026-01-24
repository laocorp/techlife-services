'use client'

import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useDebouncedCallback } from 'use-debounce'

export default function WorkshopProductControls({ categories = [] }: { categories: any[] }) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const handleSearch = useDebouncedCallback((term: string) => {
        const params = new URLSearchParams(searchParams)
        if (term) {
            params.set('q', term)
        } else {
            params.delete('q')
        }
        router.replace(`?${params.toString()}`, { scroll: false })
    }, 300)

    const handleCategory = (cat: string) => {
        const params = new URLSearchParams(searchParams)
        if (cat && cat !== 'Todos') {
            params.set('category', cat)
        } else {
            params.delete('category')
        }
        router.replace(`?${params.toString()}`, { scroll: false })
    }

    return (
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                    placeholder="Buscar producto..."
                    className="pl-9 bg-white"
                    onChange={(e) => handleSearch(e.target.value)}
                    defaultValue={searchParams.get('q')?.toString()}
                />
            </div>
            <div className="w-full sm:w-[200px]">
                <Select
                    defaultValue={searchParams.get('category') || 'Todos'}
                    onValueChange={handleCategory}
                >
                    <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Categoría" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Todos">Todas</SelectItem>
                        {categories.map((cat) => (
                            <SelectItem key={cat.id || cat} value={cat.name || cat}>
                                {cat.name || cat}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    )
}
