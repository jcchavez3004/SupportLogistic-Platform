'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

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

/** Fila de servicio con relaciones (coincide con el select de getServiceById). */
export interface ServiceDetail {
  id: string
  service_number: number | null
  client_id: string
  driver_id: string | null
  status: string
  pickup_address: string
  pickup_contact_name: string | null
  pickup_phone: string | null
  delivery_address: string
  delivery_contact_name: string | null
  delivery_phone: string | null
  observations: string | null
  evidence_photo_url: string | null
  evidence_photo_url_2: string | null
  evidence_signature_url: string | null
  novedad_descripcion: string | null
  driver_lat: number | null
  driver_lng: number | null
  driver_location_updated_at: string | null
  started_at: string | null
  picked_up_at: string | null
  completed_at: string | null
  created_at: string
  clients: {
    id: string
    company_name: string
    nit: string | null
    address: string | null
    logo_url: string | null
  } | null
  driver: {
    id: string
    full_name: string | null
    phone: string | null
    vehicle_plate: string | null
  } | null
}

/**
 * Obtiene un servicio específico por ID con datos del cliente y conductor.
 * Sin `updated_at` ni `select *` para evitar columnas inexistentes en la tabla.
 */
export async function getServiceById(serviceId: string): Promise<ServiceDetail | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('services')
    .select(
      `
      id,
      service_number,
      client_id,
      driver_id,
      status,
      pickup_address,
      pickup_contact_name,
      pickup_phone,
      delivery_address,
      delivery_contact_name,
      delivery_phone,
      observations,
      evidence_photo_url,
      evidence_photo_url_2,
      evidence_signature_url,
      novedad_descripcion,
      driver_lat,
      driver_lng,
      driver_location_updated_at,
      started_at,
      picked_up_at,
      completed_at,
      created_at,
      clients:client_id (
        id,
        company_name,
        nit,
        address,
        logo_url
      ),
      driver:driver_id (
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

  return data as unknown as ServiceDetail
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

/**
 * Actualiza el estado de un servicio con campos opcionales adicionales.
 * Solo el conductor asignado puede actualizar su propio servicio.
 */
export async function updateServiceStatus(
  serviceId: string,
  newStatus: string,
  extraFields?: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado' }

  const { error } = await supabase
    .from('services')
    .update({ status: newStatus, ...extraFields })
    .eq('id', serviceId)
    .eq('driver_id', user.id)

  if (error) {
    console.error('[updateServiceStatus]', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

/**
 * Obtiene todos los servicios del conductor con las columnas necesarias.
 */
export async function getDriverServices(driverId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('services')
    .select(`
      id, service_number, status, created_at,
      pickup_address, pickup_contact_name, pickup_phone,
      delivery_address, delivery_contact_name, delivery_phone,
      observations, zone_label,
      driver_lat, driver_lng, driver_location_updated_at,
      started_at, picked_up_at, completed_at,
      evidence_photo_url, evidence_photo_url_2,
      evidence_signature_url, novedad_descripcion,
      clients:clients (
        company_name
      )
    `)
    .eq('driver_id', driverId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('[getDriverServices]', error)
    return []
  }

  const rows = data ?? []
  return rows.map((service: any) => ({
    ...service,
    clients: Array.isArray(service.clients) ? service.clients[0] : service.clients,
  }))
}
