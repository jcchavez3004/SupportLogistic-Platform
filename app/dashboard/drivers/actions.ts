'use server'

import { createClient } from '@/utils/supabase/server'

export async function getDrivers() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('profiles')
    // Evitamos depender de `email` en `profiles` (normalmente vive en `auth.users`)
    .select('id, full_name, phone, vehicle_plate, status')
    .eq('role', 'conductor')
    .order('full_name', { ascending: true })

  if (error) {
    const details = {
      message: (error as any)?.message,
      code: (error as any)?.code,
      details: (error as any)?.details,
      hint: (error as any)?.hint,
    }

    // Si el error es por columnas inexistentes en `profiles`, hacemos fallback
    // a columnas mínimas para no romper la pantalla.
    if (typeof details.message === 'string' && /column .* does not exist/i.test(details.message)) {
      console.error('Error fetching drivers (missing columns). Falling back:', details)

      const fallback = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'conductor')
        .order('full_name', { ascending: true })

      if (fallback.error) {
        console.error('Error fetching drivers fallback:', {
          message: (fallback.error as any)?.message,
          code: (fallback.error as any)?.code,
          details: (fallback.error as any)?.details,
          hint: (fallback.error as any)?.hint,
        })
        throw new Error('No se pudieron cargar los conductores.')
      }

      return (fallback.data ?? []).map((d) => ({
        id: d.id,
        full_name: d.full_name,
        phone: null,
        vehicle_plate: null,
        status: null,
      }))
    }

    console.error('Error fetching drivers:', details)
    throw new Error('No se pudieron cargar los conductores.')
  }

  return (data ?? []).map((d) => ({
    id: d.id,
    full_name: d.full_name,
    phone: (d as any).phone ?? null,
    vehicle_plate: (d as any).vehicle_plate ?? null,
    status: (d as any).status ?? null,
  }))
}

