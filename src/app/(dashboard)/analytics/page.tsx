import {
    getTopServicesAction,
    getTechnicianPerformanceAction,
    getStatusDistributionAction
} from '@/lib/actions/bi'
import TopServicesChart from '@/components/features/bi/TopServicesChart'
import TechnicianChart from '@/components/features/bi/TechnicianChart'
import StatusDistributionChart from '@/components/features/bi/StatusDistributionChart'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AnalyticsPage() {
    // Fetch all data in parallel
    const [topServices, techPerformance, statusDist] = await Promise.all([
        getTopServicesAction(),
        getTechnicianPerformanceAction(),
        getStatusDistributionAction()
    ])

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex items-center gap-4">
                <Link href="/finance">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Analítica Avanzada</h1>
                    <p className="text-slate-500">Métricas clave de rendimiento y productividad.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Top Services/Products */}
                <Card>
                    <CardHeader>
                        <CardTitle>Top Productos Vendidos</CardTitle>
                        <CardDescription>
                            Productos con mayor rotación en ventas POS/Web.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <TopServicesChart data={topServices} />
                    </CardContent>
                </Card>

                {/* Technician Performance */}
                <Card>
                    <CardHeader>
                        <CardTitle>Rendimiento de Técnicos</CardTitle>
                        <CardDescription>
                            Total de órdenes finalizadas por técnico.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <TechnicianChart data={techPerformance} />
                    </CardContent>
                </Card>

                {/* Order Status Distribution */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Estado Actual de Órdenes</CardTitle>
                        <CardDescription>
                            Distribución de reparaciones activas.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                        <StatusDistributionChart data={statusDist} />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
