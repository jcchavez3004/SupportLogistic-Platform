'use client'

import { useEffect, useState } from 'react'

interface ClientDateProps {
  date: string | null | undefined
  options?: Intl.DateTimeFormatOptions
  locale?: string
  fallback?: string
  className?: string
}

const DEFAULT_OPTIONS: Intl.DateTimeFormatOptions = {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
}

/**
 * Renderiza fechas solo en el cliente para evitar hydration mismatch
 * entre servidor (UTC) y navegador (timezone del usuario).
 */
export function ClientDate({
  date,
  options = DEFAULT_OPTIONS,
  locale = 'es-ES',
  fallback = '—',
  className,
}: ClientDateProps) {
  const [formatted, setFormatted] = useState<string | null>(null)

  useEffect(() => {
    if (!date) return
    try {
      setFormatted(new Date(date).toLocaleDateString(locale, options))
    } catch {
      setFormatted(fallback)
    }
  }, [date, locale, options, fallback])

  if (!date) return <span className={className}>{fallback}</span>

  return (
    <span className={className} suppressHydrationWarning>
      {formatted ?? fallback}
    </span>
  )
}

/**
 * Variante que incluye hora (toLocaleString).
 */
export function ClientDateTime({
  date,
  options,
  locale = 'es-ES',
  fallback = '—',
  className,
}: ClientDateProps) {
  const [formatted, setFormatted] = useState<string | null>(null)

  useEffect(() => {
    if (!date) return
    try {
      setFormatted(
        options
          ? new Date(date).toLocaleString(locale, options)
          : new Date(date).toLocaleString(locale)
      )
    } catch {
      setFormatted(fallback)
    }
  }, [date, locale, options, fallback])

  if (!date) return <span className={className}>{fallback}</span>

  return (
    <span className={className} suppressHydrationWarning>
      {formatted ?? fallback}
    </span>
  )
}

/**
 * Variante que solo muestra la hora (toLocaleTimeString).
 */
export function ClientTime({
  date,
  options,
  locale = 'es-ES',
  fallback = '—',
  className,
}: ClientDateProps) {
  const [formatted, setFormatted] = useState<string | null>(null)

  useEffect(() => {
    if (!date) return
    try {
      setFormatted(
        options
          ? new Date(date).toLocaleTimeString(locale, options)
          : new Date(date).toLocaleTimeString(locale)
      )
    } catch {
      setFormatted(fallback)
    }
  }, [date, locale, options, fallback])

  if (!date) return <span className={className}>{fallback}</span>

  return (
    <span className={className} suppressHydrationWarning>
      {formatted ?? fallback}
    </span>
  )
}
