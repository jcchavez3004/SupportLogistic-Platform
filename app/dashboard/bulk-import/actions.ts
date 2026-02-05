'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getCurrentProfile } from '@/utils/supabase/getCurrentProfile'

// Tipo para los datos de cada fila del Excel
export interface BulkImportRow {
  destinatario: string
  direccion: string
  telefono: string
  localidad: string
  observaciones: string
}

// Reglas de zonificación basadas en localidad
const ZONE_RULES: { pattern: RegExp; zone: string }[] = [
  { pattern: /suba/i, zone: 'ZONA 1 - SUBA' },
  { pattern: /usaqu[eé]n/i, zone: 'ZONA 2 - USAQUÉN' },
  { pattern: /chapinero/i, zone: 'ZONA 3 - CHAPINERO' },
  { pattern: /kennedy/i, zone: 'ZONA 4 - KENNEDY' },
  { pattern: /bosa/i, zone: 'ZONA 5 - BOSA' },
  { pattern: /engativ[aá]/i, zone: 'ZONA 6 - ENGATIVÁ' },
  { pattern: /fontib[oó]n/i, zone: 'ZONA 7 - FONTIBÓN' },
  { pattern: /teusaquillo/i, zone: 'ZONA 8 - TEUSAQUILLO' },
  { pattern: /ciudad bol[ií]var/i, zone: 'ZONA 9 - CIUDAD BOLÍVAR' },
  { pattern: /rafael uribe/i, zone: 'ZONA 10 - RAFAEL URIBE' },
]

/**
 * Determina la zona basada en la localidad
 */
function getZoneLabel(localidad: string): string {
  if (!localidad) return 'ZONA SIN ASIGNAR'
  
  for (const rule of ZONE_RULES) {
    if (rule.pattern.test(localidad)) {
      return rule.zone
    }
  }
  
  return 'ZONA SIN ASIGNAR'
}

/**
 * Obtiene el ID del tipo de servicio "por zonas" de manera dinámica
 */
async function getZoneServiceTypeId(): Promise<string | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('service_types')
    .select('id')
    .eq('requires_zoning', true)
    .single()

  if (error || !data) {
    console.error('getZoneServiceTypeId: Error fetching zone service type:', error)
    return null
  }

  return data.id
}

/**
 * Verifica si el usuario tiene acceso a la importación masiva
 * - Admin y operaciones: siempre tienen acceso
 * - Clientes: necesitan tener el servicio por zonas habilitado
 */
export async function checkZoneServiceEnabled(): Promise<{ enabled: boolean; clientId: string | null; serviceTypeId: string | null }> {
  const supabase = await createClient()
  const profile = await getCurrentProfile()

  if (!profile) {
    console.log('checkZoneServiceEnabled: No profile found')
    return { enabled: false, clientId: null, serviceTypeId: null }
  }

  // Roles administrativos siempre tienen acceso
  const adminRoles = ['super_admin', 'operador']
  if (adminRoles.includes(profile.role)) {
    console.log('checkZoneServiceEnabled: Admin/operations role, granting access')
    const zoneServiceTypeId = await getZoneServiceTypeId()
    if (!zoneServiceTypeId) {
      console.error('checkZoneServiceEnabled: Zone service type not found in database')
      return { enabled: false, clientId: profile.client_id, serviceTypeId: null }
    }
    return { enabled: true, clientId: profile.client_id, serviceTypeId: zoneServiceTypeId }
  }

  // Para clientes, verificar que tengan el servicio habilitado
  if (profile.role !== 'cliente' || !profile.client_id) {
    console.log('checkZoneServiceEnabled: Not client role or no client_id')
    return { enabled: false, clientId: null, serviceTypeId: null }
  }

  // Primero obtener el ID del tipo de servicio por zonas
  const zoneServiceTypeId = await getZoneServiceTypeId()
  
  if (!zoneServiceTypeId) {
    console.error('checkZoneServiceEnabled: Zone service type not found in database')
    return { enabled: false, clientId: profile.client_id, serviceTypeId: null }
  }

  console.log('checkZoneServiceEnabled: Checking client_id:', profile.client_id, 'for service_type_id:', zoneServiceTypeId)

  // Verificar si tiene el servicio por zonas habilitado
  const { data, error } = await supabase
    .from('client_services')
    .select('id, enabled')
    .eq('client_id', profile.client_id)
    .eq('service_type_id', zoneServiceTypeId)
    .eq('enabled', true)
    .maybeSingle()

  if (error) {
    console.error('checkZoneServiceEnabled: Error checking client_services:', error)
    return { enabled: false, clientId: profile.client_id, serviceTypeId: zoneServiceTypeId }
  }

  console.log('checkZoneServiceEnabled: Result:', { hasData: !!data, enabled: !!data })

  return { enabled: !!data, clientId: profile.client_id, serviceTypeId: zoneServiceTypeId }
}

/**
 * Procesa la importación masiva de servicios
 */
export async function processBulkImport(
  rows: BulkImportRow[],
  onProgress?: (current: number, total: number) => void,
  targetClientId?: string
): Promise<{ success: boolean; count: number; error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const profile = await getCurrentProfile()

  if (!profile) {
    return { success: false, count: 0, error: 'No tienes permisos para realizar esta acción' }
  }

  // Roles administrativos pueden importar para cualquier cliente
  const adminRoles = ['super_admin', 'operador']
  const isAdmin = adminRoles.includes(profile.role)

  // Determinar el client_id a usar
  let clientIdToUse: string | null = null
  
  if (isAdmin) {
    // Admin puede especificar un cliente o usar uno por defecto
    clientIdToUse = targetClientId || profile.client_id
    
    // Si es admin y no tiene client_id, obtener el primer cliente disponible
    if (!clientIdToUse) {
      const { data: firstClient } = await supabase
        .from('clients')
        .select('id')
        .limit(1)
        .single()
      
      clientIdToUse = firstClient?.id || null
    }
  } else if (profile.role === 'cliente' && profile.client_id) {
    clientIdToUse = profile.client_id
  }

  if (!clientIdToUse) {
    return { success: false, count: 0, error: 'No se pudo determinar el cliente para la importación' }
  }

  // Verificar que tiene el servicio por zonas habilitado y obtener el ID del tipo de servicio
  const { enabled, serviceTypeId } = await checkZoneServiceEnabled()
  if (!enabled || !serviceTypeId) {
    return { success: false, count: 0, error: 'No tienes habilitado el Servicio por Zonas' }
  }

  if (!rows || rows.length === 0) {
    return { success: false, count: 0, error: 'No hay datos para importar' }
  }

  // Preparar los servicios para inserción masiva
  const servicesToInsert = rows.map((row) => ({
    client_id: clientIdToUse,
    pickup_address: clientIdToUse, // Se usará la dirección del cliente como origen
    delivery_address: row.direccion || 'Dirección no especificada',
    recipient_name: row.destinatario || 'Sin nombre',
    recipient_phone: row.telefono || null,
    notes: row.observaciones || null,
    status: 'solicitado',
    service_type_id: serviceTypeId, // Servicio por Zonas (ID dinámico)
    zone_label: getZoneLabel(row.localidad),
  }))

  // Inserción masiva (en lotes de 100 para evitar timeouts)
  const BATCH_SIZE = 100
  let insertedCount = 0
  const errors: string[] = []

  for (let i = 0; i < servicesToInsert.length; i += BATCH_SIZE) {
    const batch = servicesToInsert.slice(i, i + BATCH_SIZE)
    
    const { error } = await supabase
      .from('services')
      .insert(batch)

    if (error) {
      errors.push(`Lote ${Math.floor(i / BATCH_SIZE) + 1}: ${error.message}`)
    } else {
      insertedCount += batch.length
    }
  }

  revalidatePath('/dashboard/services')
  revalidatePath('/dashboard/bulk-import')

  if (errors.length > 0) {
    return {
      success: insertedCount > 0,
      count: insertedCount,
      error: `Se insertaron ${insertedCount} de ${rows.length}. Errores: ${errors.join('; ')}`,
    }
  }

  return { success: true, count: insertedCount }
}
