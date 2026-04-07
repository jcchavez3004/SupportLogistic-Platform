import { clsx } from 'clsx'

interface StockIndicatorProps {
  current: number
  minimum: number
  unit?: string
  showBar?: boolean
}

export function StockIndicator({ current, minimum, unit = 'und', showBar = true }: StockIndicatorProps) {
  const status = current === 0 ? 'out' : current <= minimum ? 'low' : 'ok'

  const colors = {
    out: { text: 'text-red-700', bg: 'bg-red-500', badge: 'bg-red-50 border-red-200 text-red-700' },
    low: { text: 'text-amber-700', bg: 'bg-amber-500', badge: 'bg-amber-50 border-amber-200 text-amber-700' },
    ok:  { text: 'text-emerald-700', bg: 'bg-emerald-500', badge: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
  }

  const c = colors[status]
  const pct = minimum > 0 ? Math.min((current / (minimum * 2)) * 100, 100) : current > 0 ? 100 : 0

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <span className={clsx('text-lg font-bold', c.text)}>{current}</span>
        <span className="text-xs text-gray-400">{unit}</span>
        {status === 'out' && (
          <span className={clsx('text-[10px] font-bold px-1.5 py-0.5 rounded border', c.badge)}>AGOTADO</span>
        )}
        {status === 'low' && (
          <span className={clsx('text-[10px] font-bold px-1.5 py-0.5 rounded border', c.badge)}>STOCK BAJO</span>
        )}
      </div>
      {showBar && (
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className={clsx('h-full rounded-full transition-all', c.bg)} style={{ width: `${pct}%` }} />
        </div>
      )}
      <p className="text-[10px] text-gray-400">Mínimo: {minimum} {unit}</p>
    </div>
  )
}
