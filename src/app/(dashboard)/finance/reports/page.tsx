import { getIncomeHistoryAction } from '@/lib/actions/finance'
import IncomeHistoryChart from '@/components/features/finance/IncomeHistoryChart'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

// Assuming DatePickerWithRange exists or I'll implement a simple one. 
// Actually, standard shadcn component is usually named differently or custom built.
// Let's use simple inputs for now or check if DatePicker exists.
// I'll stick to a simple form with native date inputs for MVP reliability.

import { Input } from '@/components/ui/input'
import { Search, DollarSign, TrendingUp, CreditCard } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ start?: string, end?: string }> }) {
    const { start, end } = await searchParams

    // Default: Last 30 days
    const endDate = end ? new Date(end) : new Date()
    const startDate = start ? new Date(start) : new Date()
    if (!start) startDate.setDate(startDate.getDate() - 30)

    const history = await getIncomeHistoryAction(startDate, endDate)

    const totalServices = history.reduce((acc, curr) => acc + curr.services, 0)
    const totalSales = history.reduce((acc, curr) => acc + curr.sales, 0)
    const grandTotal = totalServices + totalSales

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Reportes Financieros</h1>
                    <p className="text-slate-500">Historial detallado de ingresos por servicios y ventas.</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/finance">
                        <Button variant="outline">Volver a Caja</Button>
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <form className="flex flex-wrap gap-4 items-end">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-500">Fecha Inicio</label>
                            <Input
                                type="date"
                                name="start"
                                defaultValue={startDate.toISOString().split('T')[0]}
                                required
                                className="w-[180px]"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-500">Fecha Fin</label>
                            <Input
                                type="date"
                                name="end"
                                defaultValue={endDate.toISOString().split('T')[0]}
                                required
                                className="w-[180px]"
                            />
                        </div>
                        <Button type="submit">
                            <Search className="mr-2 h-4 w-4" />
                            Filtrar
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
                        <DollarSign className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${grandTotal.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">En el periodo seleccionado</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Servicios (Taller)</CardTitle>
                        <TrendingUp className="h-4 w-4 text-indigo-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${totalServices.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">Reparaciones y mantenimientos</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ventas (POS/Web)</CardTitle>
                        <CreditCard className="h-4 w-4 text-teal-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${totalSales.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">Productos y venta directa</p>
                    </CardContent>
                </Card>
            </div>

            {/* Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Evolución de Ingresos</CardTitle>
                    <CardDescription>
                        Visualización diaria de ingresos acumulados.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <IncomeHistoryChart data={history} />
                </CardContent>
            </Card>

            {/* Detailed Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Detalle Diario</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="relative overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3">Fecha</th>
                                    <th className="px-6 py-3 text-right">Servicios</th>
                                    <th className="px-6 py-3 text-right">Ventas</th>
                                    <th className="px-6 py-3 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {history.map((day) => (
                                    <tr key={day.date} className="bg-white hover:bg-slate-50">
                                        <td className="px-6 py-4 font-medium text-slate-900">
                                            {new Date(day.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right text-slate-600">
                                            ${day.services.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-right text-slate-600">
                                            ${day.sales.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-slate-900">
                                            ${day.total.toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                                {history.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                                            No hay registros para este periodo.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
