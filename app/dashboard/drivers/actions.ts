'use server'

import { createClient } from '@/utils/supabase/server'

export type Driver = {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  vehicle_plate: string | null
  status: string | null
}

function isMissingColumnError(message: unknown) {
  return typeof message === 'string' && /column .* does not exist/i.test(message)
}

export async function getDrivers() {
  const supabase = await createClient()

  // `profiles` varía mucho entre proyectos. Para evitar el error
  // "column does not exist", probamos combinaciones comunes:
  // - `full_name` (y opcionalmente `email`)
  // - `first_name` + `last_name` (y opcionalmente `email`)
  const attempts: Array<{
    select: string
    order?: { column: string; ascending: boolean }
    map: (row: any) => Driver
  }> = [
    {
      select: 'id, full_name, email',
      order: { column: 'full_name', ascending: true },
      map: (d) => ({
        id: d.id,
        full_name: d.full_name ?? null,
        email: d.email ?? null,
        phone: null,
        vehicle_plate: null,
        status: null,
      }),
    },
    {
      select: 'id, full_name',
      order: { column: 'full_name', ascending: true },
      map: (d) => ({
        id: d.id,
        full_name: d.full_name ?? null,
        email: null,
        phone: null,
        vehicle_plate: null,
        status: null,
      }),
    },
    {
      select: 'id, first_name, last_name, email',
      order: { column: 'first_name', ascending: true },
      map: (d) => {
        const fn = typeof d.first_name === 'string' ? d.first_name.trim() : ''
        const ln = typeof d.last_name === 'string' ? d.last_name.trim() : ''
        const full = `${fn} ${ln}`.trim()
        return {
          id: d.id,
          full_name: full.length ? full : null,
          email: d.email ?? null,
          phone: null,
          vehicle_plate: null,
          status: null,
        }
      },
    },
    {
      select: 'id, first_name, last_name',
      order: { column: 'first_name', ascending: true },
      map: (d) => {
        const fn = typeof d.first_name === 'string' ? d.first_name.trim() : ''
        const ln = typeof d.last_name === 'string' ? d.last_name.trim() : ''
        const full = `${fn} ${ln}`.trim()
        return {
          id: d.id,
          full_name: full.length ? full : null,
          email: null,
          phone: null,
          vehicle_plate: null,
          status: null,
        }
      },
    },
  ]

  let lastError: any = null

  for (const attempt of attempts) {
    const q = supabase.from('profiles').select(attempt.select).eq('role', 'conductor')
    const query = attempt.order
      ? q.order(attempt.order.column as any, { ascending: attempt.order.ascending })
      : q

    const { data, error } = await query

    if (!error) {
      return (data ?? []).map(attempt.map)
    }

    lastError = error
    const message = (error as any)?.message

    if (isMissingColumnError(message)) {
      continue
    }

    console.error('Error fetching drivers:', {
      message,
      code: (error as any)?.code,
      details: (error as any)?.details,
      hint: (error as any)?.hint,
    })
    throw new Error('No se pudieron cargar los conductores.')
  }

  console.error('Error fetching drivers (all attempts failed):', {
    message: (lastError as any)?.message,
    code: (lastError as any)?.code,
    details: (lastError as any)?.details,
    hint: (lastError as any)?.hint,
  })
  throw new Error('No se pudieron cargar los conductores.')
}

