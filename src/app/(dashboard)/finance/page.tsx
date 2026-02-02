import { getDailyIncomeAction } from '@/lib/actions/finance'
import { getRevenueChartDataAction } from '@/lib/actions/bi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, CreditCard, Banknote, Calendar, BarChart3, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import RevenueChart from '@/components/features/bi/RevenueChart'

export default async function FinancePage() {
    const today = new Date()
    const { total, breakdown } = await getDailyIncomeAction(today)
    const chartData = await getRevenueChartDataAction()

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-foreground mb-2">Finanzas y Caja</h1>
            <p className="text-muted-foreground mb-8">
                Resumen de movimientos del día: <span className="font-semibold text-foreground">{format(today, 'PPPP', { locale: es })}</span>
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Total Card */}
                <Card className="bg-slate-900 text-white border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ingresos Totales (Hoy)</CardTitle>
                        <DollarSign className="h-4 w-4 text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">${total.toFixed(2)}</div>
                        <p className="text-xs text-slate-400 mt-1">
                            Cierre de caja estimado
                        </p>
                    </CardContent>
                </Card>

                {/* Cash Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Efectivo en Caja</CardTitle>
                        <Banknote className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${(breakdown.cash || 0).toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground mt-1">Disponible físico</div>
                    </CardContent>
                </Card>

                {/* Card/Transfer Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Bancos / Digital</CardTitle>
                        <div className="flex gap-2">
                            <Link href="/finance/reports">
                                <Button variant="outline">
                                    <BarChart3 className="mr-2 h-4 w-4" />
                                    Reportes Detallados
                                </Button>
                            </Link>
                            <Link href="/finance/settings">
                                <Button variant="ghost" size="icon">
                                    <Settings className="h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ${((breakdown.card || 0) + (breakdown.transfer || 0) + (breakdown.pos_web || 0)).toFixed(2)}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">Tarjeta + Transferencia + Web/POS</div>
                    </CardContent>
                </Card>
            </div>

            {/* Revenue Chart */}
            <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
                <h2 className="text-lg font-bold text-foreground mb-4">Tendencia de Ingresos</h2>
                <RevenueChart data={chartData} />
            </div>
        </div>
    )
}
