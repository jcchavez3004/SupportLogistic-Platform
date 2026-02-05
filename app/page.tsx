import Image from 'next/image'
import Link from 'next/link'
import {
  Camera,
  Truck,
  Radar,
  Briefcase,
  Headset,
  ShieldCheck,
} from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
        <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center">
            <span className="relative h-40 w-40 overflow-hidden">
              <Image
                src="/logo.png"
                alt="Support Logistic"
                fill
                sizes="160px"
                className="object-contain"
                priority
              />
            </span>
          </Link>

          <Link
            href="/login"
            className="inline-flex items-center rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            Acceso Clientes
          </Link>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-7xl px-4 pt-16 pb-12 sm:px-6 sm:pt-24 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-medium text-slate-700 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Plataforma integral para operaciones logísticas
            </p>

            <h1 className="mt-8 text-balance text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Logística Inteligente para tu Empresa
            </h1>
            <p className="mt-6 text-pretty text-base leading-7 text-slate-600 sm:text-lg">
              Gestiona envíos, conductores y evidencias en tiempo real con
              nuestra plataforma integral
            </p>
          </div>
        </section>

        {/* Portales de Acceso */}
        <section
          id="portales"
          className="bg-slate-50 pt-10 pb-16"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm font-medium text-slate-500 mb-8">
              ¿Cómo deseas ingresar?
            </p>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {/* Card 1: Clientes */}
              <Link
                href="/login"
                className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-500 text-white transition-transform duration-300 group-hover:scale-110">
                  <Briefcase className="h-7 w-7" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-slate-900">
                  Portal Clientes
                </h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">
                  Solicita envíos y rastrea tus pedidos en tiempo real.
                </p>
                <div className="mt-6">
                  <span className="inline-flex w-full items-center justify-center rounded-full bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors group-hover:bg-emerald-600">
                    Ingreso Clientes
                  </span>
                </div>
              </Link>

              {/* Card 2: Operaciones */}
              <Link
                href="/login"
                className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600 text-white transition-transform duration-300 group-hover:scale-110">
                  <Headset className="h-7 w-7" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-slate-900">
                  Operaciones
                </h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">
                  Gestión logística y asignación de flota.
                </p>
                <div className="mt-6">
                  <span className="inline-flex w-full items-center justify-center rounded-full bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors group-hover:bg-blue-700">
                    Ingreso Staff
                  </span>
                </div>
              </Link>

              {/* Card 3: Conductores */}
              <Link
                href="/login"
                className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-amber-500 text-white transition-transform duration-300 group-hover:scale-110">
                  <Truck className="h-7 w-7" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-slate-900">
                  Portal Conductores
                </h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">
                  Consulta tus rutas asignadas y registra entregas.
                </p>
                <div className="mt-6">
                  <span className="inline-flex w-full items-center justify-center rounded-full bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors group-hover:bg-amber-600">
                    Soy Conductor
                  </span>
                </div>
              </Link>

              {/* Card 4: Administración */}
              <Link
                href="/login"
                className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-800 text-white transition-transform duration-300 group-hover:scale-110">
                  <ShieldCheck className="h-7 w-7" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-slate-900">
                  Administración
                </h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">
                  Panel de control general y configuración.
                </p>
                <div className="mt-6">
                  <span className="inline-flex w-full items-center justify-center rounded-full bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white transition-colors group-hover:bg-slate-900">
                    Acceso Admin
                  </span>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section
          id="features"
          className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"
        >
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Todo lo que necesitas para operar mejor
            </h2>
            <p className="mt-4 text-sm text-slate-600 sm:text-base">
              Control, trazabilidad y evidencia en un solo lugar.
            </p>
          </div>

          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600 text-white">
                <Radar className="h-7 w-7" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-slate-900">
                Rastreo en Tiempo Real
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Control total de tus operaciones con visibilidad y estados
                actualizables desde el panel administrativo.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-amber-500 text-white">
                <Truck className="h-7 w-7" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-slate-900">
                Gestión de Flota
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Asignación inteligente de conductores y seguimiento del flujo
                del envío: de solicitado a entregado.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600 text-white">
                <Camera className="h-7 w-7" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-slate-900">
                Evidencia Digital
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Fotos y confirmación de entregas al instante con almacenamiento
                seguro y acceso rápido desde la tabla de servicios.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-10 text-sm text-slate-600 sm:flex-row sm:px-6 lg:px-8">
          <p>© 2026 Support Logistic</p>
          <div className="flex items-center gap-6">
            <a href="#" className="transition-colors hover:text-blue-600">
              LinkedIn
            </a>
            <a href="#" className="transition-colors hover:text-blue-600">
              Instagram
            </a>
            <a href="#" className="transition-colors hover:text-blue-600">
              X
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
