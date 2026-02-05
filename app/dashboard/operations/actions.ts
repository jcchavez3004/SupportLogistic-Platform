'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export type ZoneSummary = {
  zone_label: string
  pending_count: number
  assigned_count: number
  total_count: number
  driver_id: string | null
  driver_name: string | null
  status: 'pending' | 'partial' | 'assigned'
}

export type ZoneService = {
  id: string
  service_number: number | null
  delivery_address: string
  recipient_name: string | null
  recipient_phone: string | null
  status: string
  notes: string | null
}

/**
 * Obtiene el resumen de zonas con envíos pendientes o del día actual
 */
export async function getZonesSummary(): Promise<ZoneSummary[]> {
  const supabase = await createClient()

  // Obtener fecha de inicio del día actual
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Obtener servicios con zone_label, filtrando por pendientes o del día
  const { data: services, error } = await supabase
    .from('services')
    .select('id, zone_label, status, driver_id, created_at')
    .not('zone_label', 'is', null)
    .or(`status.in.(solicitado,asignado,en_curso_recogida,recogido,en_curso_entrega),created_at.gte.${today.toISOString()}`)
    .order('zone_label')

  if (error) {
    console.error('Error fetching zones summary:', error)
    return []
  }

  if (!services || services.length === 0) {
    return []
  }

  // Agrupar por zona
  const zonesMap = new Map<string, {
    pending: number
    assigned: number
    total: number
    drivers: Set<string>
  }>()

  services.forEach((s) => {
    const zone = s.zone_label || 'SIN ZONA'
    if (!zonesMap.has(zone)) {
      zonesMap.set(zone, { pending: 0, assigned: 0, total: 0, drivers: new Set() })
    }
    const zoneData = zonesMap.get(zone)!
    zoneData.total++

    if (s.status === 'solicitado') {
      zoneData.pending++
    } else {
      zoneData.assigned++
    }

    if (s.driver_id) {
      zoneData.drivers.add(s.driver_id)
    }
  })

  // Obtener nombres de conductores
  const allDriverIds = new Set<string>()
  zonesMap.forEach((data) => {
    data.drivers.forEach((id) => allDriverIds.add(id))
  })

  let driverNames: Map<string, string> = new Map()
  if (allDriverIds.size > 0) {
    const { data: drivers } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', Array.from(allDriverIds))

    if (drivers) {
      drivers.forEach((d) => {
        driverNames.set(d.id, d.full_name || 'Sin nombre')
      })
    }
  }

  // Construir resultado
  const result: ZoneSummary[] = []
  zonesMap.forEach((data, zone) => {
    // Si todos los envíos tienen el mismo conductor, mostrarlo
    const driverId = data.drivers.size === 1 ? Array.from(data.drivers)[0] : null
    const driverName = driverId ? driverNames.get(driverId) || null : null

    let status: ZoneSummary['status'] = 'pending'
    if (data.pending === 0 && data.total > 0) {
      status = 'assigned'
    } else if (data.assigned > 0 && data.pending > 0) {
      status = 'partial'
    }

    result.push({
      zone_label: zone,
      pending_count: data.pending,
      assigned_count: data.assigned,
      total_count: data.total,
      driver_id: driverId,
      driver_name: driverName,
      status,
    })
  })

  // Ordenar por nombre de zona
  result.sort((a, b) => a.zone_label.localeCompare(b.zone_label))

  return result
}

/**
 * Obtiene la lista de conductores para el selector
 */
export async function getDriversForZoneAssignment() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, vehicle_plate')
    .eq('role', 'conductor')
    .order('full_name')

  if (error) {
    console.error('Error fetching drivers:', error)
    return []
  }

  return data || []
}

/**
 * Asigna un conductor a todos los envíos de una zona
 */
export async function assignDriverToZone(
  zoneLabel: string,
  driverId: string
): Promise<{ success: boolean; count: number; error?: string }> {
  const supabase = await createClient()

  // Actualizar todos los servicios de la zona que estén en estado 'solicitado'
  const { data, error } = await supabase
    .from('services')
    .update({
      driver_id: driverId,
      status: 'asignado',
    })
    .eq('zone_label', zoneLabel)
    .eq('status', 'solicitado')
    .select('id')

  if (error) {
    console.error('Error assigning driver to zone:', error)
    return { success: false, count: 0, error: error.message }
  }

  revalidatePath('/dashboard/operations')
  revalidatePath('/dashboard/services')

  return { success: true, count: data?.length || 0 }
}

/**
 * Obtiene todos los servicios de una zona para el manifiesto
 */
export async function getZoneServices(zoneLabel: string): Promise<ZoneService[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('services')
    .select('id, service_number, delivery_address, recipient_name, recipient_phone, status, notes')
    .eq('zone_label', zoneLabel)
    .in('status', ['solicitado', 'asignado', 'en_curso_recogida', 'recogido', 'en_curso_entrega'])
    .order('service_number')

  if (error) {
    console.error('Error fetching zone services:', error)
    return []
  }

  return (data || []).map((s) => ({
    id: s.id,
    service_number: s.service_number,
    delivery_address: s.delivery_address,
    recipient_name: s.recipient_name,
    recipient_phone: s.recipient_phone,
    status: s.status,
    notes: s.notes,
  }))
}
