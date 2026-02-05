'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createNewClient(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const companyName =
    (formData.get('companyName') as string | null) ??
    (formData.get('company') as string | null) ??
    ''
  const nit = (formData.get('nit') as string | null) ?? null
  const address = (formData.get('address') as string | null) ?? null
  const logoUrl = (formData.get('logo_url') as string | null) ?? null
  const serviceTypesJson = (formData.get('serviceTypes') as string | null) ?? '[]'

  if (!companyName) {
    throw new Error('El nombre de la empresa es requerido')
  }

  // Parsear los tipos de servicio seleccionados
  let serviceTypeIds: string[] = []
  try {
    serviceTypeIds = JSON.parse(serviceTypesJson)
  } catch {
    throw new Error('Error al procesar los tipos de servicio')
  }

  if (serviceTypeIds.length === 0) {
    throw new Error('Debes seleccionar al menos un tipo de servicio')
  }

  // 1. Crear el cliente
  const { data: newClient, error: clientError } = await supabase
    .from('clients')
    .insert({
      company_name: companyName,
      nit: nit?.trim() || null,
      address: address?.trim() || null,
      logo_url: logoUrl?.trim() || null,
    })
    .select('id')
    .single()

  if (clientError) {
    console.error('Error creating client:', clientError)
    throw new Error('Error al crear el cliente: ' + clientError.message)
  }

  // 2. Crear las relaciones client_services
  const clientServicesData = serviceTypeIds.map((serviceTypeId) => ({
    client_id: newClient.id,
    service_type_id: serviceTypeId,
    enabled: true,
  }))

  const { error: servicesError } = await supabase
    .from('client_services')
    .insert(clientServicesData)

  if (servicesError) {
    console.error('Error assigning services to client:', servicesError)
    // Nota: El cliente ya fue creado, pero los servicios fallaron
    // En producción podrías querer hacer rollback o notificar
  }

  revalidatePath('/dashboard/clients')
}

/**
 * Actualiza un cliente existente y sus tipos de servicio
 * Implementa una estrategia de "delete all + insert" para la tabla intermedia
 */
export async function updateClient(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      redirect('/login')
    }

    // Extraer datos del formulario
    const clientId = formData.get('clientId') as string | null
    const companyName =
      (formData.get('companyName') as string | null) ??
      (formData.get('company') as string | null) ??
      ''
    const nit = (formData.get('nit') as string | null) ?? null
    const address = (formData.get('address') as string | null) ?? null
    const logoUrl = (formData.get('logo_url') as string | null) ?? null
    const serviceTypesJson = (formData.get('serviceTypes') as string | null) ?? '[]'

    // Validaciones
    if (!clientId) {
      console.error('updateClient: clientId is missing')
      return { success: false, error: 'ID de cliente es requerido' }
    }

    if (!companyName.trim()) {
      console.error('updateClient: companyName is empty')
      return { success: false, error: 'El nombre de la empresa es requerido' }
    }

    // Parsear los tipos de servicio seleccionados
    let serviceTypeIds: string[] = []
    try {
      serviceTypeIds = JSON.parse(serviceTypesJson)
      if (!Array.isArray(serviceTypeIds)) {
        throw new Error('serviceTypeIds is not an array')
      }
    } catch (parseError) {
      console.error('updateClient: Error parsing serviceTypes JSON:', parseError)
      return { success: false, error: 'Error al procesar los tipos de servicio' }
    }

    if (serviceTypeIds.length === 0) {
      console.error('updateClient: No services selected')
      return { success: false, error: 'Debes seleccionar al menos un tipo de servicio' }
    }

    console.log(`updateClient: Updating client ${clientId} with services:`, serviceTypeIds)

    // PASO 1: Actualizar los datos básicos del cliente
    const { error: clientError } = await supabase
      .from('clients')
      .update({
        company_name: companyName.trim(),
        nit: nit?.trim() || null,
        address: address?.trim() || null,
        logo_url: logoUrl?.trim() || null,
      })
      .eq('id', clientId)

    if (clientError) {
      console.error('updateClient: Error updating client data:', clientError)
      return { success: false, error: 'Error al actualizar datos del cliente: ' + clientError.message }
    }

    console.log(`updateClient: Client data updated successfully`)

    // PASO 2: Eliminar TODAS las relaciones existentes en client_services
    const { error: deleteError } = await supabase
      .from('client_services')
      .delete()
      .eq('client_id', clientId)

    if (deleteError) {
      console.error('updateClient: Error deleting old client_services:', deleteError)
      return { success: false, error: 'Error al eliminar servicios anteriores: ' + deleteError.message }
    }

    console.log(`updateClient: Old services deleted successfully`)

    // PASO 3: Insertar las nuevas relaciones
    const clientServicesData = serviceTypeIds.map((serviceTypeId) => ({
      client_id: clientId,
      service_type_id: serviceTypeId,
      enabled: true,
    }))

    const { error: insertError } = await supabase
      .from('client_services')
      .insert(clientServicesData)

    if (insertError) {
      console.error('updateClient: Error inserting new client_services:', insertError)
      return { success: false, error: 'Error al asignar nuevos servicios: ' + insertError.message }
    }

    console.log(`updateClient: New services assigned successfully`)

    // Revalidar la página para mostrar los cambios
    revalidatePath('/dashboard/clients')

    return { success: true }
  } catch (error) {
    console.error('updateClient: Unexpected error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error inesperado al actualizar el cliente' 
    }
  }
}

/**
 * Obtiene los IDs de tipos de servicio habilitados para un cliente
 */
export async function getClientServiceTypes(clientId: string): Promise<string[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('client_services')
    .select('service_type_id')
    .eq('client_id', clientId)
    .eq('enabled', true)

  if (error) {
    console.error('Error fetching client service types:', error)
    return []
  }

  return data?.map((row) => row.service_type_id) || []
}

/**
 * Obtiene todos los tipos de servicio disponibles
 */
export async function getServiceTypes() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('service_types')
    .select('id, name, description, requires_zoning')
    .order('name')

  if (error) {
    console.error('Error fetching service types:', error)
    return []
  }

  return data || []
}

/**
 * Obtiene los tipos de servicio de todos los clientes (para la tabla)
 */
export async function getAllClientsServiceTypes(): Promise<Record<string, string[]>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('client_services')
    .select('client_id, service_type_id')
    .eq('enabled', true)

  if (error) {
    console.error('Error fetching all clients service types:', error)
    return {}
  }

  // Agrupar por client_id
  const result: Record<string, string[]> = {}
  data?.forEach((row) => {
    if (!result[row.client_id]) {
      result[row.client_id] = []
    }
    result[row.client_id].push(row.service_type_id)
  })

  return result
}
