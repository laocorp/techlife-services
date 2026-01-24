import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Wrench, ArrowRight, ShieldCheck, BarChart3, Users } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Navbar */}
      <header className="px-6 h-16 flex items-center justify-between border-b bg-white/80 backdrop-blur-md fixed w-full z-50">
        <div className="flex items-center gap-2 font-bold text-xl text-slate-900">
          <div className="bg-indigo-600 p-1.5 rounded-lg text-white">
            <Wrench className="h-5 w-5" />
          </div>
          TechLife Service
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost">Iniciar Sesión</Button>
          </Link>
          <Link href="/login?view=register">
            <Button className="bg-indigo-600 hover:bg-indigo-700">Comenzar Gratis</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 pt-24 pb-12 px-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center min-h-[600px]">
          <div className="space-y-8 animate-in slide-in-from-left duration-700">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-sm font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              Nuevo: Portal de Clientes y Pagos
            </div>

            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Gestiona tu Taller <br />
              <span className="text-indigo-600">Sin Complicaciones</span>
            </h1>

            <p className="text-xl text-slate-500 max-w-lg leading-relaxed">
              La plataforma todo-en-uno para talleres de reparación.
              Controla órdenes, inventario, clientes y finanzas desde un solo lugar.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/login?role=workshop">
                <Button size="lg" className="h-14 px-8 text-lg bg-slate-900 hover:bg-slate-800 w-full sm:w-auto">
                  Acceso Taller
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/login?role=customer">
                <Button size="lg" variant="outline" className="h-14 px-8 text-lg w-full sm:w-auto">
                  Soy Cliente
                </Button>
              </Link>
            </div>

            <div className="flex items-center gap-8 text-sm text-slate-500 pt-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-green-500" />
                Datos Seguros
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                Multi-Usuario
              </div>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-500" />
                Reportes en Vivo
              </div>
            </div>
          </div>

          {/* Hero Image / Dashboard Preview */}
          <div className="relative group animate-in slide-in-from-right duration-700 delay-100 hidden lg:block">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <div className="relative bg-white rounded-2xl shadow-2xl border overflow-hidden p-2">
              {/* Mockup Dashboard UI */}
              <div className="bg-slate-50 rounded-xl border border-slate-100 overflow-hidden aspect-[4/3] flex flex-col">
                <div className="h-12 border-b bg-white flex items-center px-4 gap-4">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                  <div className="h-2 w-32 bg-slate-100 rounded-full"></div>
                </div>
                <div className="flex-1 p-6 grid grid-cols-3 gap-4">
                  <div className="col-span-2 space-y-4">
                    <div className="h-24 bg-white rounded-lg border shadow-sm p-4">
                      <div className="h-2 w-12 bg-indigo-100 rounded mb-2"></div>
                      <div className="h-8 w-24 bg-slate-100 rounded"></div>
                    </div>
                    <div className="h-48 bg-white rounded-lg border shadow-sm"></div>
                  </div>
                  <div className="col-span-1 space-y-4">
                    <div className="h-full bg-white rounded-lg border shadow-sm"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-12 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6 text-center text-slate-500">
          <p>© {new Date().getFullYear()} TechLife Service. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
