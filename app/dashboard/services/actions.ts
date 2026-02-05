'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

const VALID_SERVICE_STATUSES = [
  'solicitado',
  'asignado',
  'en_curso_recogida',
  'recogido',
  'en_curso_entrega',
  'entregado',
  'novedad',
] as const

export async function getClientsForSelect() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('clients')
    .select('id, company_name')
    .order('company_name', { ascending: true })

  if (error) {
    console.error('Error fetching clients for select:', error)
    throw new Error('No se pudieron cargar los clientes.')
  }

  return data
}

export async function getDriversForSelect() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('profiles')
    // Nota: muchas implementaciones de `profiles` NO tienen la columna `email`
    // (el email vive en `auth.users`). Para evitar errores por columnas inexistentes,
    // pedimos solo campos típicos.
    .select('id, full_name')
    .eq('role', 'conductor')
    .order('full_name', { ascending: true })

  if (error) {
    console.error('Error fetching drivers for select:', {
      message: (error as any)?.message,
      code: (error as any)?.code,
      details: (error as any)?.details,
      hint: (error as any)?.hint,
    })
    throw new Error('No se pudieron cargar los conductores.')
  }

  return data
}

export async function getServices() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('services')
    .select(
      `
      id,
      service_number,
      client_id,
      driver_id,
      pickup_address,
      delivery_address,
      status,
      evidence_photo_url,
      created_at,
      clients:clients (
        company_name
      )
    `
    )
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching services:', error)
    throw new Error('No se pudieron cargar los servicios.')
  }

  return data
}

/**
 * Obtiene servicios filtrados por client_id (para usuarios con rol 'cliente')
 */
export async function getServicesForClient(clientId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('services')
    .select(
      `
      id,
      service_number,
      client_id,
      driver_id,
      pickup_address,
      delivery_address,
      status,
      evidence_photo_url,
      created_at,
      clients:clients (
        company_name
      )
    `
    )
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching services for client:', error)
    throw new Error('No se pudieron cargar los servicios.')
  }

  return data
}

export async function createNewService(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Obtener perfil del usuario para verificar rol
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, client_id')
    .eq('id', user.id)
    .single()

  const role = profile?.role || 'cliente'
  const profileClientId = profile?.client_id || null

  // Si es cliente, forzamos su client_id (ignora lo que venga del form)
  let client_id: string
  if (role === 'cliente') {
    if (!profileClientId) {
      throw new Error('Tu perfil no tiene una empresa asociada. Contacta al administrador.')
    }
    client_id = profileClientId
  } else {
    client_id = (formData.get('client_id') as string | null)?.trim() ?? ''
  }

  const pickup_address =
    (formData.get('pickup_address') as string | null)?.trim() ?? ''
  const pickup_contact_name =
    (formData.get('pickup_contact_name') as string | null)?.trim() ?? null
  const pickup_phone =
    (formData.get('pickup_phone') as string | null)?.trim() ?? null
  const delivery_address =
    (formData.get('delivery_address') as string | null)?.trim() ?? ''
  const delivery_contact_name =
    (formData.get('delivery_contact_name') as string | null)?.trim() ?? null
  const delivery_phone =
    (formData.get('delivery_phone') as string | null)?.trim() ?? null
  const observations =
    (formData.get('observations') as string | null)?.trim() ?? null

  if (!client_id || !pickup_address || !delivery_address) {
    throw new Error('Cliente, dirección de recogida y dirección de entrega son requeridos.')
  }

  const { error } = await supabase.from('services').insert({
    client_id,
    pickup_address,
    pickup_contact_name: pickup_contact_name || null,
    pickup_phone: pickup_phone || null,
    delivery_address,
    delivery_contact_name: delivery_contact_name || null,
    delivery_phone: delivery_phone || null,
    observations: observations || null,
    status: 'solicitado',
  })

  if (error) {
    console.error('Error creating service:', error)
    throw new Error('Error al crear el servicio: ' + error.message)
  }

  revalidatePath('/dashboard/services')
}

export async function assignDriverToService(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const service_id = (formData.get('service_id') as string | null)?.trim() ?? ''
  const driver_id = (formData.get('driver_id') as string | null)?.trim() ?? ''

  if (!service_id || !driver_id) {
    throw new Error('Servicio y conductor son requeridos.')
  }

  const { error } = await supabase
    .from('services')
    .update({ driver_id, status: 'asignado' })
    .eq('id', service_id)

  if (error) {
    console.error('Error assigning driver to service:', error)
    throw new Error('Error al asignar conductor: ' + error.message)
  }

  revalidatePath('/dashboard/services')
}

export async function updateServiceStatus(serviceId: string, newStatus: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  if (!serviceId) {
    throw new Error('serviceId es requerido.')
  }

  if (!VALID_SERVICE_STATUSES.includes(newStatus as any)) {
    throw new Error(`Estado inválido: ${newStatus}`)
  }

  const { error } = await supabase
    .from('services')
    .update({ status: newStatus })
    .eq('id', serviceId)

  if (error) {
    console.error('Error updating service status:', {
      message: (error as any)?.message,
      code: (error as any)?.code,
      details: (error as any)?.details,
      hint: (error as any)?.hint,
    })
    throw new Error('No se pudo actualizar el estado del servicio.')
  }

  revalidatePath('/dashboard/services')
}

export async function uploadEvidence(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const serviceId = (formData.get('service_id') as string | null)?.trim() ?? ''
  const file = formData.get('file') as File | null

  if (!serviceId) throw new Error('service_id es requerido.')
  if (!file) throw new Error('Archivo requerido.')

  if (!file.type?.startsWith('image/')) {
    throw new Error('Solo se permiten imágenes.')
  }

  const MAX_BYTES = 6 * 1024 * 1024 // 6MB
  if (file.size > MAX_BYTES) {
    throw new Error('La imagen supera el tamaño máximo permitido (6MB).')
  }

  const extFromMime = (mime: string) => {
    if (mime === 'image/jpeg') return 'jpg'
    if (mime === 'image/png') return 'png'
    if (mime === 'image/webp') return 'webp'
    if (mime === 'image/gif') return 'gif'
    return 'jpg'
  }

  const timestamp = Date.now()
  const ext = extFromMime(file.type)
  const filePath = `service-${serviceId}-${timestamp}.${ext}`

  const bytes = await file.arrayBuffer()
  const { error: uploadError } = await supabase.storage
    .from('evidence')
    .upload(filePath, bytes, {
      contentType: file.type || 'image/jpeg',
      upsert: false,
    })

  if (uploadError) {
    console.error('Error uploading evidence:', {
      message: (uploadError as any)?.message,
      code: (uploadError as any)?.code,
      details: (uploadError as any)?.details,
      hint: (uploadError as any)?.hint,
    })
    throw new Error('No se pudo subir la evidencia.')
  }

  const { data: publicData } = supabase.storage
    .from('evidence')
    .getPublicUrl(filePath)

  const publicUrl = publicData?.publicUrl
  if (!publicUrl) {
    throw new Error('No se pudo obtener la URL pública de la evidencia.')
  }

  const { error: updateError } = await supabase
    .from('services')
    .update({ evidence_photo_url: publicUrl, status: 'entregado' })
    .eq('id', serviceId)

  if (updateError) {
    console.error('Error updating service with evidence url:', {
      message: (updateError as any)?.message,
      code: (updateError as any)?.code,
      details: (updateError as any)?.details,
      hint: (updateError as any)?.hint,
    })
    throw new Error('No se pudo guardar la evidencia en el servicio.')
  }

  revalidatePath('/dashboard/services')
  return { publicUrl }
}

