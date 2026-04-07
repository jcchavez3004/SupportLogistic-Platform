import { ArrowDownCircle, ArrowUpCircle, RefreshCw, Undo2 } from 'lucide-react'

const config: Record<string, { label: string; color: string; bg: string; icon: typeof ArrowDownCircle }> = {
  ingreso:          { label: 'Ingreso',       color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: ArrowDownCircle },
  salida:           { label: 'Salida',        color: 'text-red-700',     bg: 'bg-red-50 border-red-200',         icon: ArrowUpCircle },
  ajuste_positivo:  { label: 'Ajuste (+)',    color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200',       icon: RefreshCw },
  ajuste_negativo:  { label: 'Ajuste (−)',    color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200',     icon: RefreshCw },
  devolucion:       { label: 'Devolución',    color: 'text-purple-700',  bg: 'bg-purple-50 border-purple-200',   icon: Undo2 },
}

export function MovementBadge({ type }: { type: string }) {
  const c = config[type] ?? { label: type, color: 'text-gray-700', bg: 'bg-gray-50 border-gray-200', icon: RefreshCw }
  const Icon = c.icon
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${c.bg} ${c.color}`}>
      <Icon className="h-3.5 w-3.5" />
      {c.label}
    </span>
  )
}
