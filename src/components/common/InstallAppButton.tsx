'use client'

import { useEffect, useState } from 'react'
import { Download, Smartphone, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallAppButton() {
    const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
    const [isInstalled, setIsInstalled] = useState(false)
    const [showBanner, setShowBanner] = useState(false)

    useEffect(() => {
        // Check if already installed as PWA
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true)
            return
        }

        const handler = (e: Event) => {
            e.preventDefault()
            setInstallEvent(e as BeforeInstallPromptEvent)
            // Show the install banner after a short delay
            setTimeout(() => setShowBanner(true), 3000)
        }

        window.addEventListener('beforeinstallprompt', handler)
        window.addEventListener('appinstalled', () => {
            setIsInstalled(true)
            setInstallEvent(null)
            setShowBanner(false)
        })

        return () => {
            window.removeEventListener('beforeinstallprompt', handler)
        }
    }, [])

    const handleInstall = async () => {
        if (!installEvent) return
        await installEvent.prompt()
        const { outcome } = await installEvent.userChoice
        if (outcome === 'accepted') {
            setIsInstalled(true)
            setInstallEvent(null)
            setShowBanner(false)
        }
    }

    if (isInstalled) return null

    return (
        <>
            {/* Inline Button (shown in Hero) */}
            <div className="flex-1 max-w-xs space-y-3">
                <Button
                    id="install-app-btn"
                    size="lg"
                    onClick={handleInstall}
                    className="h-16 w-full text-lg rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-xl shadow-indigo-500/25 hover:shadow-2xl hover:shadow-indigo-500/40 hover:-translate-y-1 transition-all duration-300 border-0"
                >
                    <Download className="mr-2 h-5 w-5" />
                    Descargar App
                </Button>
                <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                    Gratis · iOS & Android
                </p>
            </div>

            {/* Floating Install Banner */}
            {showBanner && installEvent && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-3rem)] max-w-sm animate-in slide-in-from-bottom-4 fade-in duration-500">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4 flex items-center gap-4">
                        <div className="h-12 w-12 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg">
                            <Smartphone className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">TechLife Service</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Instala la app para acceso rápido</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <Button
                                size="sm"
                                onClick={handleInstall}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs px-3 h-8"
                            >
                                Instalar
                            </Button>
                            <button
                                onClick={() => setShowBanner(false)}
                                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
