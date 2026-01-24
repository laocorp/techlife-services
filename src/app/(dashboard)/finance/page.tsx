import { getDailyIncomeAction } from '@/lib/actions/finance'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, CreditCard, Banknote, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default async function FinancePage() {
    const today = new Date()
    const { total, breakdown } = await getDailyIncomeAction(today)

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Finanzas y Caja</h1>
            <p className="text-slate-500 mb-8">
                Resumen de movimientos del día: <span className="font-semibold text-slate-900">{format(today, 'PPPP', { locale: es })}</span>
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
                        <div className="text-xs text-slate-500 mt-1">Disponible físico</div>
                    </CardContent>
                </Card>

                {/* Card/Transfer Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Bancos / Digital</CardTitle>
                        <CreditCard className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ${((breakdown.card || 0) + (breakdown.transfer || 0)).toFixed(2)}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">Tarjeta + Transferencia</div>
                    </CardContent>
                </Card>
            </div>

            {/* Todo: Add History Table or Charts here later */}
            <div className="bg-slate-50 border rounded-lg p-8 text-center text-slate-500">
                <Calendar className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                <p>Próximamente: Historial completo de ingresos y filtros por fecha.</p>
            </div>
        </div>
    )
}
