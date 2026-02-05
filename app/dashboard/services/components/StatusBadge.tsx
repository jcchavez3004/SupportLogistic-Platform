'use client'

import { clsx } from 'clsx'
import { useRouter } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'
import { updateServiceStatus } from '../actions'

const STATUSES = [
  'solicitado',
  'asignado',
  'en_curso_recogida',
  'recogido',
  'en_curso_entrega',
  'entregado',
  'novedad',
] as const

export function StatusBadge({
  serviceId,
  status,
}: {
  serviceId: string
  status: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [localStatus, setLocalStatus] = useState(status)

  const styles = useMemo(() => {
    const s = localStatus
    // Requeridos por UX:
    // - solicitado: Gris/Amarillo
    // - asignado: Azul
    // - recogido: Morado
    // - entregado: Verde
    // - novedad: Rojo
    if (s === 'solicitado') return 'bg-amber-100 text-amber-900 ring-amber-200'
    if (s === 'asignado') return 'bg-sky-100 text-sky-900 ring-sky-200'
    if (s === 'recogido') return 'bg-violet-100 text-violet-900 ring-violet-200'
    if (s === 'entregado') return 'bg-emerald-100 text-emerald-900 ring-emerald-200'
    if (s === 'novedad') return 'bg-rose-100 text-rose-900 ring-rose-200'
    if (s === 'en_curso_recogida') return 'bg-slate-100 text-slate-800 ring-slate-200'
    if (s === 'en_curso_entrega') return 'bg-slate-100 text-slate-800 ring-slate-200'
    return 'bg-gray-100 text-gray-800 ring-gray-200'
  }, [localStatus])

  const onChange = (next: string) => {
    setLocalStatus(next)
    startTransition(async () => {
      await updateServiceStatus(serviceId, next)
      // Refresca los datos del Server Component sin recargar toda la página manualmente
      router.refresh()
    })
  }

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
        styles,
        isPending && 'opacity-70'
      )}
    >
      <select
        aria-label="Cambiar estado"
        className={clsx(
          'bg-transparent outline-none',
          'text-xs font-medium',
          'pr-1',
          'cursor-pointer',
          // Evita que el select estire raro el layout
          'appearance-none'
        )}
        value={localStatus}
        onChange={(e) => onChange(e.target.value)}
        disabled={isPending}
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </span>
  )
}

