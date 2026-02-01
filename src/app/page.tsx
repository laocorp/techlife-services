import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Wrench, ArrowRight, ShieldCheck, BarChart3, Users, Smartphone, CheckCircle, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Navbar */}
      <header className="px-6 h-20 flex items-center justify-between border-b bg-white/95 backdrop-blur-md fixed w-full z-50 transition-all">
        <div className="flex items-center gap-3 font-bold text-2xl text-slate-900 tracking-tight">
          <Image
            src="/logo_icon.png"
            alt="TechLife Service Logo"
            width={40}
            height={40}
            className="object-contain" // Use contain to respect aspect ratio
          />
          TechLife<span className="text-indigo-600">Service</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors hidden sm:block">
            Iniciar Sesión
          </Link>
          <Link href="/register?type=workshop">
            <Button className="bg-slate-900 hover:bg-slate-800 text-white rounded-full px-6 shadow-md hover:shadow-lg transition-all">
              Comenzar Gratis
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 mt-20">
        <section className="relative pt-20 pb-32 px-6 overflow-hidden bg-slate-50">
          {/* Background Decor */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute -top-[10%] -right-[10%] w-[50%] h-[50%] bg-indigo-200/20 rounded-full blur-3xl"></div>
            <div className="absolute top-[20%] -left-[10%] w-[40%] h-[40%] bg-purple-200/20 rounded-full blur-3xl"></div>
          </div>

          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative z-10">
            {/* Left Content */}
            <div className="space-y-8 animate-in slide-in-from-left duration-700 fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-indigo-100 text-indigo-700 text-sm font-semibold shadow-sm">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
                </span>
                La Plataforma #1 para Talleres Modernos
              </div>

              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
                Eleva tu Taller al <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
                  Siguiente Nivel
                </span>
              </h1>

              <p className="text-xl text-slate-600 max-w-lg leading-relaxed">
                Control total de tu negocio: Órdenes, inventario, clientes y finanzas.
                <span className="font-semibold text-slate-900"> Todo en un solo lugar.</span>
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <div className="flex-1 max-w-xs space-y-3">
                  <Link href="/register?type=workshop">
                    <Button size="lg" className="h-16 w-full text-lg rounded-2xl bg-slate-900 text-white hover:bg-slate-800 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                      Soy Dueño de Taller
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <p className="text-center text-xs text-slate-500">Prueba gratis 14 días. Sin tarjeta.</p>
                </div>

                <div className="flex-1 max-w-xs space-y-3">
                  <Link href="/register?type=client">
                    <Button size="lg" variant="outline" className="h-16 w-full text-lg rounded-2xl border-2 border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/50 text-slate-700 hover:text-indigo-700 transition-all duration-300">
                      Soy Cliente
                      <Smartphone className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <p className="text-center text-xs text-slate-500">Consulta el estado de tu equipo.</p>
                </div>
              </div>

              <div className="flex items-center gap-8 pt-8 border-t border-slate-200/60">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-400">
                      U{i}
                    </div>
                  ))}
                </div>
                <div className="text-sm">
                  <div className="flex items-center gap-1 text-yellow-500">
                    {[1, 2, 3, 4, 5].map(i => <Zap key={i} className="w-4 h-4 fill-current" />)}
                  </div>
                  <p className="text-slate-500 mt-1">Más de <span className="font-bold text-slate-900">500+ talleres</span> confían en nosotros.</p>
                </div>
              </div>
            </div>

            {/* Right Image */}
            <div className="relative group perspective-1000 hidden lg:block">
              {/* 3D Glass Effect Container */}
              <div className="relative z-10 transform rotate-y-12 rotate-x-6 hover:rotate-0 transition-transform duration-700 ease-out">
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 rounded-2xl blur-xl transform translate-y-8 translate-x-8"></div>

                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 overflow-hidden p-3 aspect-[4/3]">
                  {/* Mock UI */}
                  <div className="w-full h-full bg-slate-50 rounded-xl border border-slate-200 flex flex-col overflow-hidden">
                    <div className="h-14 border-b bg-white flex items-center justify-between px-6">
                      <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-400/80"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-400/80"></div>
                        <div className="w-3 h-3 rounded-full bg-green-400/80"></div>
                      </div>
                      <div className="h-2 w-24 bg-slate-100 rounded-full"></div>
                    </div>
                    <div className="flex-1 p-6 grid grid-cols-12 gap-6">
                      <div className="col-span-3 space-y-4">
                        <div className="h-10 bg-indigo-50 rounded-lg w-full"></div>
                        <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                        <div className="h-4 bg-slate-100 rounded w-full"></div>
                        <div className="h-4 bg-slate-100 rounded w-4/5"></div>
                      </div>
                      <div className="col-span-9 grid grid-cols-2 gap-4">
                        <div className="col-span-2 h-32 bg-white rounded-xl border shadow-sm p-4 flex gap-4">
                          <div className="w-16 h-16 bg-indigo-100 rounded-lg shrink-0"></div>
                          <div className="space-y-2 flex-1">
                            <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                            <div className="h-3 bg-slate-100 rounded w-full"></div>
                            <div className="h-3 bg-slate-100 rounded w-2/3"></div>
                          </div>
                        </div>
                        <div className="h-24 bg-white rounded-xl border shadow-sm"></div>
                        <div className="h-24 bg-white rounded-xl border shadow-sm"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Badges */}
              <div className="absolute -top-6 -right-6 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 animate-bounce-slow z-20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg text-green-600">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Estado</p>
                    <p className="text-sm font-bold text-slate-900">Operativo</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Preview */}
        <section className="py-24 bg-white border-t border-slate-100">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Todo lo que necesitas para crecer</h2>
              <p className="text-slate-500 text-lg">TechLife Service sustituye hojas de cálculo y papel por un sistema inteligente que automatiza tu día a día.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: ShieldCheck, color: "text-blue-500", bg: "bg-blue-50", title: "Seguridad Total", desc: "Tus datos respaldados en la nube con encriptación de nivel bancario." },
                { icon: Users, color: "text-indigo-500", bg: "bg-indigo-50", title: "Multi-Usuario", desc: "Crea cuentas para técnicos y recepcionistas con permisos específicos." },
                { icon: BarChart3, color: "text-purple-500", bg: "bg-purple-50", title: "Analítica Real", desc: "Toma decisiones basadas en datos reales de ingresos y rendimiento." }
              ].map((feature, i) => (
                <div key={i} className="p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-100 hover:shadow-lg transition-all group">
                  <div className={`w-12 h-12 ${feature.bg} ${feature.color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                  <p className="text-slate-500 leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t py-12 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 font-bold text-xl text-slate-800">
            <div className="bg-slate-900 p-1.5 rounded-lg text-white">
              <Wrench className="h-4 w-4" />
            </div>
            TechLife
          </div>
          <p className="text-slate-500 text-sm">© {new Date().getFullYear()} TechLife Service Inc. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
