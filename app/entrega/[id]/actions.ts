'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'
import { sendServiceDeliveredNotifications } from '@/lib/notifications'

export type DeliveryPoint = {
  order: number
  address: string
  contact_name: string | null
  contact_phone: string | null
  time_start: string | null
  time_end: string | null
  description: string | null
  reference_id: string | null
  completed?: boolean
  completed_at?: string | null
  evidence_photo_url?: string | null
  evidence_photo_url_2?: string | null
  evidence_signature_url?: string | null
}

export type PublicServiceView = {
  id: string
  service_number: number | null
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
  completed_at: string | null
  is_multipoint: boolean | null
  delivery_points: DeliveryPoint[] | null
  clients: { company_name: string } | null
  field_drivers: { full_name: string | null } | null
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Vista pública de un servicio para el enlace de conductor (sin login, sin cuenta).
 * El UUID del servicio actúa como llave del enlace: no es adivinable.
 * Por seguridad, solo retorna datos si el servicio existe Y ya tiene un
 * conductor de campo asignado (nunca expone servicios sin asignar por esta vía).
 */
export async function getPublicServiceView(serviceId: string): Promise<PublicServiceView | null> {
  if (!UUID_RE.test(serviceId)) return null

  const admin = createAdminClient()

  const { data, error } = await admin
    .from('services')
    .select(
      `
      id, service_number, status,
      pickup_address, pickup_contact_name, pickup_phone,
      delivery_address, delivery_contact_name, delivery_phone,
      observations,
      evidence_photo_url, evidence_photo_url_2, evidence_signature_url,
      completed_at,
      is_multipoint, delivery_points,
      field_driver_id,
      clients:client_id ( company_name ),
      field_drivers ( full_name )
    `
    )
    .eq('id', serviceId)
    .single()

  if (error || !data || !data.field_driver_id) return null

  const clientsRaw = data.clients as unknown
  const clients = (Array.isArray(clientsRaw) ? clientsRaw[0] : clientsRaw) ?? null
  const driversRaw = data.field_drivers as unknown
  const field_drivers = (Array.isArray(driversRaw) ? driversRaw[0] : driversRaw) ?? null

  return {
    id: data.id,
    service_number: data.service_number,
    status: data.status,
    pickup_address: data.pickup_address,
    pickup_contact_name: data.pickup_contact_name,
    pickup_phone: data.pickup_phone,
    delivery_address: data.delivery_address,
    delivery_contact_name: data.delivery_contact_name,
    delivery_phone: data.delivery_phone,
    observations: data.observations,
    evidence_photo_url: data.evidence_photo_url,
    evidence_photo_url_2: data.evidence_photo_url_2,
    evidence_signature_url: data.evidence_signature_url,
    completed_at: data.completed_at,
    is_multipoint: data.is_multipoint,
    delivery_points: (data.delivery_points as DeliveryPoint[] | null) ?? null,
    clients: clients as { company_name: string } | null,
    field_drivers: field_drivers as { full_name: string | null } | null,
  }
}

// Únicas transiciones permitidas desde el enlace público (sin login).
// No se reutiliza la lógica "extraFields" abierta del panel autenticado:
// aquí cada transición aplica exactamente los campos que le corresponden,
// nunca lo que venga del cliente.
const NEXT_STATUS: Record<string, string> = {
  asignado: 'en_curso_recogida',
  en_curso_recogida: 'recogido',
  recogido: 'en_curso_entrega',
}

export async function advancePublicServiceStatus(
  serviceId: string,
  expectedCurrentStatus: string
): Promise<{ success: boolean; error?: string; newStatus?: string }> {
  if (!UUID_RE.test(serviceId)) return { success: false, error: 'Enlace inválido.' }

  const admin = createAdminClient()

  const { data: current, error: readError } = await admin
    .from('services')
    .select('id, status, field_driver_id')
    .eq('id', serviceId)
    .single()

  if (readError || !current || !current.field_driver_id) {
    return { success: false, error: 'Servicio no encontrado.' }
  }

  if (current.status !== expectedCurrentStatus) {
    return {
      success: false,
      error: 'El estado del servicio cambió. Recarga la página.',
      newStatus: current.status,
    }
  }

  const nextStatus = NEXT_STATUS[current.status]
  if (!nextStatus) {
    return { success: false, error: 'No se puede avanzar el estado desde aquí.' }
  }

  const extra: Record<string, unknown> =
    nextStatus === 'en_curso_recogida'
      ? { started_at: new Date().toISOString() }
      : nextStatus === 'recogido'
        ? { picked_up_at: new Date().toISOString() }
        : {}

  const { error } = await admin
    .from('services')
    .update({ status: nextStatus, ...extra })
    .eq('id', serviceId)

  if (error) {
    console.error('[advancePublicServiceStatus]', error)
    return { success: false, error: 'No se pudo actualizar el servicio.' }
  }

  revalidatePath(`/entrega/${serviceId}`)
  revalidatePath('/dashboard/services')
  return { success: true, newStatus: nextStatus }
}

export async function submitPublicEvidence(
  serviceId: string,
  data: { photo1Url: string; photo2Url: string | null; signatureUrl: string }
): Promise<{ success: boolean; error?: string }> {
  if (!UUID_RE.test(serviceId)) return { success: false, error: 'Enlace inválido.' }

  const admin = createAdminClient()

  const { data: current, error: readError } = await admin
    .from('services')
    .select(
      `
      id, status, field_driver_id, service_number,
      pickup_address, delivery_address, delivery_contact_name,
      clients:client_id ( company_name )
    `
    )
    .eq('id', serviceId)
    .single()

  if (readError || !current || !current.field_driver_id) {
    return { success: false, error: 'Servicio no encontrado.' }
  }

  if (current.status !== 'en_curso_entrega') {
    return {
      success: false,
      error: 'Este servicio no está listo para registrar evidencia de entrega.',
    }
  }

  const { error } = await admin
    .from('services')
    .update({
      status: 'entregado',
      evidence_photo_url: data.photo1Url,
      evidence_photo_url_2: data.photo2Url,
      evidence_signature_url: data.signatureUrl,
      completed_at: new Date().toISOString(),
    })
    .eq('id', serviceId)

  if (error) {
    console.error('[submitPublicEvidence]', error)
    return { success: false, error: 'No se pudo guardar la evidencia.' }
  }

  const clientsRaw = current.clients as unknown
  const clientsData = Array.isArray(clientsRaw) ? clientsRaw[0] : clientsRaw
  const companyName = (clientsData as Record<string, unknown> | null)?.company_name

  void sendServiceDeliveredNotifications({
    serviceId: current.id,
    serviceNumber: current.service_number ?? 'S/N',
    clientName: (typeof companyName === 'string' ? companyName : null) ?? 'Cliente',
    pickupAddress: current.pickup_address,
    deliveryAddress: current.delivery_address,
    deliveryContact: current.delivery_contact_name,
    clientEmail: null,
  })

  revalidatePath(`/entrega/${serviceId}`)
  revalidatePath('/dashboard/services')
  return { success: true }
}

/**
 * Registra la evidencia de UN punto de entrega dentro de un servicio
 * multipunto (delivery_points). No toca los demás puntos. Cuando el
 * último punto pendiente queda completado, marca todo el servicio
 * como 'entregado' y dispara las notificaciones de entrega.
 */
export async function submitPublicPointEvidence(
  serviceId: string,
  pointOrder: number,
  data: { photo1Url: string; photo2Url: string | null; signatureUrl: string }
): Promise<{ success: boolean; error?: string; deliveryPoints?: DeliveryPoint[]; allCompleted?: boolean }> {
  if (!UUID_RE.test(serviceId)) return { success: false, error: 'Enlace inválido.' }

  const admin = createAdminClient()

  const { data: current, error: readError } = await admin
    .from('services')
    .select(
      `
      id, status, field_driver_id, service_number, is_multipoint, delivery_points,
      pickup_address, delivery_address, delivery_contact_name,
      clients:client_id ( company_name )
    `
    )
    .eq('id', serviceId)
    .single()

  if (readError || !current || !current.field_driver_id) {
    return { success: false, error: 'Servicio no encontrado.' }
  }

  if (current.status !== 'en_curso_entrega') {
    return {
      success: false,
      error: 'Este servicio no está listo para registrar evidencia de entrega.',
    }
  }

  const points = current.delivery_points as DeliveryPoint[] | null
  if (!current.is_multipoint || !Array.isArray(points) || points.length === 0) {
    return { success: false, error: 'Este servicio no tiene múltiples puntos de entrega.' }
  }

  const targetIndex = points.findIndex((p) => p.order === pointOrder)
  if (targetIndex === -1) {
    return { success: false, error: 'Punto de entrega no encontrado.' }
  }
  if (points[targetIndex].completed) {
    return { success: false, error: 'Este punto ya fue registrado como entregado.' }
  }

  const now = new Date().toISOString()
  const updatedPoints: DeliveryPoint[] = points.map((p, i) =>
    i === targetIndex
      ? {
          ...p,
          completed: true,
          completed_at: now,
          evidence_photo_url: data.photo1Url,
          evidence_photo_url_2: data.photo2Url,
          evidence_signature_url: data.signatureUrl,
        }
      : p
  )

  const allCompleted = updatedPoints.every((p) => p.completed)

  const updatePayload: Record<string, unknown> = { delivery_points: updatedPoints }
  if (allCompleted) {
    updatePayload.status = 'entregado'
    updatePayload.completed_at = now
  }

  const { error } = await admin.from('services').update(updatePayload).eq('id', serviceId)

  if (error) {
    console.error('[submitPublicPointEvidence]', error)
    return { success: false, error: 'No se pudo guardar la evidencia del punto.' }
  }

  if (allCompleted) {
    const clientsRaw = current.clients as unknown
    const clientsData = Array.isArray(clientsRaw) ? clientsRaw[0] : clientsRaw
    const companyName = (clientsData as Record<string, unknown> | null)?.company_name

    void sendServiceDeliveredNotifications({
      serviceId: current.id,
      serviceNumber: current.service_number ?? 'S/N',
      clientName: (typeof companyName === 'string' ? companyName : null) ?? 'Cliente',
      pickupAddress: current.pickup_address,
      deliveryAddress: current.delivery_address,
      deliveryContact: current.delivery_contact_name,
      clientEmail: null,
    })
  }

  revalidatePath(`/entrega/${serviceId}`)
  revalidatePath('/dashboard/services')
  return { success: true, deliveryPoints: updatedPoints, allCompleted }
}
