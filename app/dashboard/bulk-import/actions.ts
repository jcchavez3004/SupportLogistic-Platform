'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getCurrentProfile } from '@/utils/supabase/getCurrentProfile'

export type BulkImportClientOption = {
  id: string
  company_name: string | null
  source?: 'clients' | 'profiles'
}

// Tipo para los datos de cada fila del Excel
export interface BulkImportRow {
  // Nuevas columnas principales del Excel
  origen: string
  destino: string
  fecha: string
  tipo_vehiculo: string
  descripcion: string
  referencia: string
  // Campos opcionales heredados del formato anterior
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

  // Intento 1: buscar por requires_zoning = true
  const { data: byFlag, error: flagError } = await supabase
    .from('service_types')
    .select('id, name, requires_zoning')
    .eq('requires_zoning', true)
    .maybeSingle()  // ← no lanza error si hay 0 o >1 resultados

  if (flagError) {
    console.error('[getZoneServiceTypeId] Error buscando por requires_zoning:', flagError)
  }

  if (byFlag?.id) {
    console.log('[getZoneServiceTypeId] Encontrado por requires_zoning=true:', byFlag)
    return byFlag.id
  }

  // Intento 2: buscar por nombre si el flag no está configurado
  const { data: byName, error: nameError } = await supabase
    .from('service_types')
    .select('id, name, requires_zoning')
    .ilike('name', '%zona%')
    .maybeSingle()

  if (nameError) {
    console.error('[getZoneServiceTypeId] Error buscando por nombre:', nameError)
  }

  if (byName?.id) {
    console.warn(
      '[getZoneServiceTypeId] ⚠️ Encontrado por nombre pero requires_zoning=false.' +
      ' Ejecuta: UPDATE service_types SET requires_zoning = true WHERE id = \'' +
      byName.id + '\';',
      byName
    )
    return byName.id
  }

  // Log final para diagnóstico — ver todos los service_types disponibles
  const { data: allTypes } = await supabase
    .from('service_types')
    .select('id, name, requires_zoning')

  console.error(
    '[getZoneServiceTypeId] ❌ No se encontró ningún service_type válido.' +
    ' Service types disponibles:', allTypes
  )

  return null
}

export async function checkZoneServiceEnabled(): Promise<{
  enabled: boolean
  clientId: string | null
  serviceTypeId: string | null
}> {
  const supabase = await createClient()
  const profile = await getCurrentProfile()

  if (!profile) {
    console.log('[checkZoneServiceEnabled] No profile found')
    return { enabled: false, clientId: null, serviceTypeId: null }
  }

  const zoneServiceTypeId = await getZoneServiceTypeId()

  if (!zoneServiceTypeId) {
    console.error(
      '[checkZoneServiceEnabled] ❌ No existe service_type con requires_zoning=true.' +
      ' Ve a Supabase → SQL Editor y ejecuta:' +
      " UPDATE service_types SET requires_zoning = true WHERE name ILIKE '%zona%';"
    )
    return { enabled: false, clientId: profile.client_id, serviceTypeId: null }
  }

  // Roles administrativos: siempre habilitados si el service_type existe
  const adminRoles = ['super_admin', 'operador']
  if (adminRoles.includes(profile.role)) {
    console.log('[checkZoneServiceEnabled] Admin/operador → acceso garantizado', {
      role: profile.role,
      serviceTypeId: zoneServiceTypeId,
    })
    return {
      enabled: true,
      clientId: profile.client_id,
      serviceTypeId: zoneServiceTypeId,
    }
  }

  // Clientes: verificar en client_services
  if (!profile.client_id) {
    console.log('[checkZoneServiceEnabled] Role cliente sin client_id en perfil')
    return { enabled: false, clientId: null, serviceTypeId: zoneServiceTypeId }
  }

  const { data, error } = await supabase
    .from('client_services')
    .select('id, enabled')
    .eq('client_id', profile.client_id)
    .eq('service_type_id', zoneServiceTypeId)
    .maybeSingle()

  if (error) {
    console.error('[checkZoneServiceEnabled] Error consultando client_services:', error)
    return { enabled: false, clientId: profile.client_id, serviceTypeId: zoneServiceTypeId }
  }

  // Si no hay registro pero el cliente tiene el badge visible en la UI,
  // puede ser que client_services use enabled=true por default
  const isEnabled = data?.enabled === true

  console.log('[checkZoneServiceEnabled] Cliente result:', {
    clientId: profile.client_id,
    serviceTypeId: zoneServiceTypeId,
    found: !!data,
    enabled: isEnabled,
  })

  return {
    enabled: isEnabled,
    clientId: profile.client_id,
    serviceTypeId: zoneServiceTypeId,
  }
}

/**
 * Carga clientes para el dropdown (solo roles administrativos).
 * Importante: no filtra por status ni por service_type para evitar excluir clientes válidos.
 */
export async function getClientsForBulkImport(): Promise<{
  isAdmin: boolean
  profileClientId: string | null
  clients: BulkImportClientOption[]
}> {
  const supabase = await createClient()
  const profile = await getCurrentProfile()

  if (!profile) {
    return { isAdmin: false, profileClientId: null, clients: [] }
  }

  const adminRoles = ['super_admin', 'operador']
  const isAdmin = adminRoles.includes(profile.role)

  if (!isAdmin) {
    return { isAdmin: false, profileClientId: profile.client_id, clients: [] }
  }

  const { data, error } = await supabase
    .from('clients')
    .select('id, company_name')
    .order('company_name', { ascending: true })

  if (error) {
    console.error('[bulk-import] Error cargando clientes desde clients:', {
      message: (error as any)?.message,
      code: (error as any)?.code,
      details: (error as any)?.details,
      hint: (error as any)?.hint,
    })
    return { isAdmin: true, profileClientId: profile.client_id, clients: [] }
  }

  const clients: BulkImportClientOption[] = (data ?? []).map((c: any) => ({
    id: String(c.id),
    company_name: c.company_name ?? null,
    source: 'clients',
  }))

  console.log('[bulk-import] Clients dropdown (clients table):', {
    rows: clients.length,
    sample: clients.slice(0, 3),
  })

  return { isAdmin: true, profileClientId: profile.client_id, clients }
}

/**
 * Procesa la importación masiva de servicios
 */
export async function processBulkImport(
  rows: BulkImportRow[],
  clientIdOverride?: string,  // ← NUEVO: permite que la UI pase el clientId
  onProgress?: (current: number, total: number) => void
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
    return { success: false, count: 0, error: 'No se encontró tu perfil de usuario.' }
  }

  const adminRoles = ['super_admin', 'operador']
  const isAdmin = adminRoles.includes(profile.role)

  // ── Resolver el clientId a usar ────────────────────────────────────────────
  // Admin sin cliente en perfil: DEBE venir clientIdOverride desde la UI
  // Cliente normal: usa su propio client_id del perfil
  let clientIdToUse: string | null = null

  if (isAdmin) {
    // Admin puede importar para cualquier cliente pasando clientIdOverride
    // Si no viene override, usa su propio client_id (si lo tiene)
    clientIdToUse = clientIdOverride ?? profile.client_id ?? null

    if (!clientIdToUse) {
      return {
        success: false,
        count: 0,
        error:
          'Como administrador debes seleccionar un cliente para la importación. ' +
          'Recarga la página.',
      }
    }
  } else {
    // Cliente: siempre usa su propio client_id
    clientIdToUse = profile.client_id ?? null

    if (!clientIdToUse) {
      return {
        success: false,
        count: 0,
        error: 'Tu perfil no tiene una empresa asociada. Contacta al administrador.',
      }
    }
  }

  // ── Verificar el service type de zonas ────────────────────────────────────
  // ID real confirmado: 1bcfd680-ab64-49db-be0b-05b3419c1006
  const ZONE_SERVICE_TYPE_ID = '1bcfd680-ab64-49db-be0b-05b3419c1006'
  const serviceTypeId = ZONE_SERVICE_TYPE_ID

  // ── Para clientes: verificar que tienen el servicio habilitado ────────────
  if (!isAdmin) {
    const { data: clientService, error: csError } = await supabase
      .from('client_services')
      .select('enabled')
      .eq('client_id', clientIdToUse)
      .eq('service_type_id', serviceTypeId)
      .maybeSingle()

    if (csError) {
      console.error('[bulk-import] Error verificando client_services:', csError)
    }

    if (!clientService || clientService.enabled !== true) {
      return {
        success: false,
        count: 0,
        error:
          'Tu empresa no tiene habilitado el Servicio por Zonas. ' +
          'Contacta al administrador para activarlo.',
      }
    }
  }

  // ── Obtener dirección del cliente para pickup_address ─────────────────────
  const { data: clientData, error: clientError } = await supabase
    .from('clients')
    .select('id, address')
    .eq('id', clientIdToUse)
    .maybeSingle()

  if (clientError) {
    console.error('[bulk-import] Error consultando cliente:', clientError)
  }

  const pickupAddressFromClient = (clientData as any)?.address ?? null

  if (!rows || rows.length === 0) {
    return { success: false, count: 0, error: 'No hay datos para importar' }
  }

  console.log('[bulk-import] Iniciando importación:', {
    rows: rows.length,
    client_id: clientIdToUse,
    service_type_id: serviceTypeId,
    role: profile.role,
    isAdmin,
  })

  // ── A PARTIR DE AQUÍ: código existente preservado ─────────────────────────
  // Preparar los servicios para inserción masiva
  const servicesToInsert = rows.map((row, idx) => {
    // Usamos la columna "Destino" como dirección principal de entrega;
    // si también viene "direccion" del formato antiguo, tiene prioridad.
    const destino = row.destino?.trim() || ''
    const direccion = row.direccion?.trim() || ''
    const delivery_address = direccion || destino

    const recipient_name = row.destinatario?.trim() || ''

    if (!delivery_address || !recipient_name) {
      console.log(
        '[bulk-import] Fila con campos vacíos (se insertará pero puede fallar por constraints):',
        {
          row_index_1based: idx + 1,
          origen: row.origen,
          destino: row.destino,
          fecha: row.fecha,
          tipo_vehiculo: row.tipo_vehiculo,
          descripcion: row.descripcion,
          referencia: row.referencia,
          destinatario: row.destinatario,
          direccion: row.direccion,
          telefono: row.telefono,
          localidad: row.localidad,
          observaciones: row.observaciones,
        }
      )
    }

    return {
      __rowIndex: idx, // solo para debug interno
      client_id: clientIdToUse,

      // pickup_address: usa la dirección del cliente como origen físico.
      // Fallback: columna "Origen" del Excel, o texto genérico.
      pickup_address: pickupAddressFromClient
        || row.origen?.trim()
        || 'Origen no especificado',

      // delivery_address: usa "Direccion" del Excel si viene, sino "Destino".
      // Ambos son NOT NULL en la DB — nunca puede quedar vacío.
      delivery_address: direccion || destino || 'Dirección no especificada',

      // ✅ Nombre correcto: delivery_contact_name (antes: recipient_name ❌)
      delivery_contact_name: recipient_name || null,

      // ✅ Nombre correcto: delivery_phone (antes: recipient_phone ❌)
      delivery_phone: row.telefono?.trim() || null,

      // ✅ Nombre correcto: observations (antes: notes ❌)
      // Prioridad: descripcion del Excel nuevo > observaciones del formato viejo
      observations: row.descripcion?.trim()
        || row.observaciones?.trim()
        || null,

      status: 'solicitado',
      service_type_id: serviceTypeId,

      // zone_label: se calcula desde "Localidad" si viene, sino desde "Destino"
      zone_label: row.localidad?.trim()
        ? getZoneLabel(row.localidad)
        : getZoneLabel(row.destino || ''),
    }
  })

  const insertOneWithFallback = async (
    rowPayload: Record<string, any>,
    meta: { row_index_1based: number }
  ) => {
    let payload = { ...rowPayload }
    const droppedColumns: string[] = []

    for (let attempt = 1; attempt <= 6; attempt++) {
      const { error: rowError } = await supabase.from('services').insert(payload)
      if (!rowError) {
        if (droppedColumns.length) {
          console.log('[bulk-import] Insert OK tras fallback de columnas:', {
            row_index_1based: meta.row_index_1based,
            droppedColumns,
          })
        }
        return { ok: true as const }
      }

      const message = (rowError as any)?.message as unknown
      const missingColMatch =
        typeof message === 'string'
          ? message.match(/column ["`']?([^"`']+)["`']? does not exist/i)
          : null

      if (missingColMatch?.[1]) {
        const col = missingColMatch[1]
        if (payload[col] !== undefined) {
          droppedColumns.push(col)
          const { [col]: _omit, ...rest } = payload
          payload = rest
          console.log('[bulk-import] Columna inexistente; reintentando sin ella:', {
            row_index_1based: meta.row_index_1based,
            missing_column: col,
            attempt,
          })
          continue
        }
      }

      return {
        ok: false as const,
        error: rowError,
        payload,
      }
    }

    return {
      ok: false as const,
      error: new Error('Demasiados reintentos al insertar fila (fallback de columnas).'),
      payload,
    }
  }

  // DEBUG TEMPORAL
  console.log('[bulk-import] Primer registro a insertar:', {
    ...servicesToInsert[0],
    __rowIndex: undefined,
  })

  // Inserción masiva (en lotes de 100 para evitar timeouts)
  const BATCH_SIZE = 100
  let insertedCount = 0
  const errors: string[] = []

  for (let i = 0; i < servicesToInsert.length; i += BATCH_SIZE) {
    const batch = servicesToInsert.slice(i, i + BATCH_SIZE)
    const payload = batch.map(({ __rowIndex, ...rest }) => rest)
    
    const { error } = await supabase
      .from('services')
      .insert(payload)

    if (error) {
      console.error('[bulk-import] Error insertando lote:', {
        batch_number_1based: Math.floor(i / BATCH_SIZE) + 1,
        batch_start_row_1based: i + 1,
        batch_size: batch.length,
        message: (error as any)?.message,
        code: (error as any)?.code,
        details: (error as any)?.details,
        hint: (error as any)?.hint,
        sample_payload_first: payload[0],
      })

      // Fallback: insertar fila por fila para detectar exactamente cuál falla.
      for (let j = 0; j < batch.length; j++) {
        const item = batch[j]
        const { __rowIndex, ...rowPayload } = item as any
        const globalRow1Based = (typeof __rowIndex === 'number' ? __rowIndex : i + j) + 1

        const result = await insertOneWithFallback(rowPayload, {
          row_index_1based: globalRow1Based,
        })

        if (!result.ok) {
          const rowError: any = (result as any).error
          console.error('[bulk-import] Error insertando fila:', {
            row_index_1based: globalRow1Based,
            payload: rowPayload,
            message: (rowError as any)?.message,
            code: (rowError as any)?.code,
            details: (rowError as any)?.details,
            hint: (rowError as any)?.hint,
          })
          errors.push(`Fila ${globalRow1Based}: ${(rowError as any)?.message ?? 'Error desconocido'}`)
        } else {
          insertedCount += 1
        }
      }
    } else {
      insertedCount += batch.length
    }

    onProgress?.(Math.min(i + BATCH_SIZE, servicesToInsert.length), servicesToInsert.length)
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
