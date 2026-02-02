export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 py-10">
            <div className="w-full max-w-md space-y-8 bg-white dark:bg-slate-900 p-8 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 sm:rounded-lg">
                {children}
            </div>
        </div>
    )
}
