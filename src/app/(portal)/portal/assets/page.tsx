import { getPortalAssetsAction } from '@/lib/actions/portal'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Monitor, Cpu, Hash, Smartphone } from 'lucide-react'

export default async function PortalAssetsPage() {
    const assets = await getPortalAssetsAction()

    const getDeviceIcon = (type: string) => {
        const t = (type || '').toLowerCase()
        if (t.includes('laptop') || t.includes('pc')) return <Monitor className="h-8 w-8 text-indigo-500" />
        if (t.includes('phone') || t.includes('celular')) return <Smartphone className="h-8 w-8 text-pink-500" />
        return <Cpu className="h-8 w-8 text-slate-500" />
    }

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Mis Equipos</h1>
                <p className="text-slate-500">Equipos registrados en el taller bajo tu nombre.</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {assets.length === 0 ? (
                    <div className="col-span-full text-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                        <Monitor className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">No tienes equipos registrados.</p>
                    </div>
                ) : (
                    assets.map((asset) => (
                        <Card key={asset.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="pt-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-3 bg-slate-50 rounded-xl">
                                        {getDeviceIcon(asset.details?.type)}
                                    </div>
                                    <Badge variant="outline" className="font-mono text-xs">
                                        {asset.identifier}
                                    </Badge>
                                </div>

                                <h3 className="font-bold text-lg text-slate-900 mb-1">
                                    {asset.details?.brand} {asset.details?.model}
                                </h3>

                                <div className="text-sm text-slate-500 space-y-1">
                                    {asset.details?.serial && (
                                        <div className="flex items-center gap-1.5">
                                            <Hash className="h-3 w-3" />
                                            <span className="font-mono text-xs">S/N: {asset.details.serial}</span>
                                        </div>
                                    )}
                                    {asset.details?.color && (
                                        <p>Color: {asset.details.color}</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
