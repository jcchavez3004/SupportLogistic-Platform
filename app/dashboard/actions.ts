'use server'

import { createClient } from '@/utils/supabase/server'

export interface ServiceStats {
  total: number
  solicitado: number
  asignado: number
  en_curso: number
  entregado: number
  novedad: number
}

export interface DriverService {
  id: string
  service_number: string | null
  status: string
  pickup_address: string
  delivery_address: string
  delivery_contact_name: string | null
  delivery_phone: string | null
  zone_label: string | null
  created_at: string
  clients: {
    company_name: string | null
  } | null
}

/**
 * Obtiene estadísticas de servicios.
 * Si el usuario es 'cliente', RLS filtra automáticamente a sus servicios.
 * Si es 'operador' o 'super_admin', obtiene totales globales.
 */
export async function getServiceStats(): Promise<ServiceStats> {
  const supabase = await createClient()

  // Obtener todos los servicios (RLS filtra según rol)
  const { data: services, error } = await supabase
    .from('services')
    .select('status')

  if (error) {
    console.error('Error fetching service stats:', error)
    return {
      total: 0,
      solicitado: 0,
      asignado: 0,
      en_curso: 0,
      entregado: 0,
      novedad: 0,
    }
  }

  const stats: ServiceStats = {
    total: services?.length || 0,
    solicitado: 0,
    asignado: 0,
    en_curso: 0,
    entregado: 0,
    novedad: 0,
  }

  services?.forEach((s) => {
    switch (s.status) {
      case 'solicitado':
        stats.solicitado++
        break
      case 'asignado':
        stats.asignado++
        break
      case 'en_curso_recogida':
      case 'recogido':
      case 'en_curso_entrega':
        stats.en_curso++
        break
      case 'entregado':
        stats.entregado++
        break
      case 'novedad':
        stats.novedad++
        break
    }
  })

  return stats
}

/**
 * Obtiene servicios asignados a un conductor.
 */
export async function getDriverServices(driverId: string): Promise<DriverService[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('services')
    .select(
      `
      id,
      service_number,
      status,
      pickup_address,
      delivery_address,
      delivery_contact_name,
      delivery_phone,
      zone_label,
      created_at,
      clients:clients (
        company_name
      )
    `
    )
    .eq('driver_id', driverId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching driver services:', error)
    return []
  }

  return data || []
}

/**
 * Obtiene un servicio específico por ID con datos del cliente y conductor.
 */
export async function getServiceById(serviceId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('services')
    .select(
      `
      *,
      clients:clients (
        id,
        company_name,
        nit,
        address,
        logo_url
      ),
      driver:profiles!services_driver_id_fkey (
        id,
        full_name,
        phone,
        vehicle_plate
      )
    `
    )
    .eq('id', serviceId)
    .single()

  if (error) {
    console.error('Error fetching service by id:', error)
    return null
  }

  return data
}

/**
 * Actualiza un servicio existente.
 */
export async function updateService(serviceId: string, formData: FormData) {
  const supabase = await createClient()

  const pickup_address = (formData.get('pickup_address') as string)?.trim() || ''
  const pickup_contact_name = (formData.get('pickup_contact_name') as string)?.trim() || null
  const pickup_phone = (formData.get('pickup_phone') as string)?.trim() || null
  const delivery_address = (formData.get('delivery_address') as string)?.trim() || ''
  const delivery_contact_name = (formData.get('delivery_contact_name') as string)?.trim() || null
  const delivery_phone = (formData.get('delivery_phone') as string)?.trim() || null
  const observations = (formData.get('observations') as string)?.trim() || null

  const { error } = await supabase
    .from('services')
    .update({
      pickup_address,
      pickup_contact_name,
      pickup_phone,
      delivery_address,
      delivery_contact_name,
      delivery_phone,
      observations,
    })
    .eq('id', serviceId)

  if (error) {
    console.error('Error updating service:', error)
    throw new Error('No se pudo actualizar el servicio.')
  }

  return { success: true }
}
