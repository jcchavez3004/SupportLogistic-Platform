'use server'

import { createClient } from '@/utils/supabase/server'
import { getCurrentProfile } from '@/utils/supabase/getCurrentProfile'
import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'

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

const DOC_LABELS: Record<string, string> = {
  doc_cedula: 'Cédula',
  doc_licencia: 'Licencia de Conducción',
  doc_arl: 'ARL',
}

function getExtFromMime(mime: string): string {
  if (mime === 'application/pdf') return 'pdf'
  if (mime === 'image/jpeg') return 'jpg'
  if (mime === 'image/png') return 'png'
  if (mime === 'image/webp') return 'webp'
  return 'bin'
}

/**
 * Sube un documento de conductor a Supabase Storage (bucket `driver-docs`).
 * Ruta: `{userId}/{docType}.{ext}`
 */
async function uploadDriverDocument(
  adminClient: ReturnType<typeof createAdminClient>,
  userId: string,
  docType: string,
  file: File
): Promise<{ success: boolean; url?: string; error?: string }> {
  const MAX_SIZE = 10 * 1024 * 1024 // 10 MB
  if (file.size > MAX_SIZE) {
    return { success: false, error: `${DOC_LABELS[docType] ?? docType}: máximo 10 MB.` }
  }

  const ext = getExtFromMime(file.type)
  const filePath = `${userId}/${docType}.${ext}`
  const bytes = await file.arrayBuffer()

  const { error: upError } = await adminClient.storage
    .from('driver-docs')
    .upload(filePath, bytes, {
      contentType: file.type || 'application/octet-stream',
      upsert: true,
    })

  if (upError) {
    console.error(`[uploadDriverDocument] ${docType}:`, upError)
    return { success: false, error: upError.message }
  }

  const { data: urlData } = adminClient.storage.from('driver-docs').getPublicUrl(filePath)
  return { success: true, url: urlData?.publicUrl ?? undefined }
}

/**
 * Acción pública para subir un documento de un conductor existente.
 */
export async function uploadDriverDoc(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const profile = await getCurrentProfile()
  if (!profile || (profile.role !== 'super_admin' && profile.role !== 'operador')) {
    return { success: false, error: 'Sin permisos.' }
  }

  const driverId = (formData.get('driver_id') as string | null)?.trim() ?? ''
  const docType = (formData.get('doc_type') as string | null)?.trim() ?? ''
  const file = formData.get('file') as File | null

  if (!driverId || !docType || !file || file.size === 0) {
    return { success: false, error: 'Faltan datos: driver_id, doc_type y file son requeridos.' }
  }

  try {
    const admin = createAdminClient()
    return await uploadDriverDocument(admin, driverId, docType, file)
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Error desconocido' }
  }
}

/**
 * Crea usuario en Auth y filas en `profiles` + `drivers` con `user_id` enlazado al UUID de auth.users.
 * Usa la service role para `auth.admin.createUser` (evita `signUp` que puede corromper la sesión del admin).
 */
export async function createDriver(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const profile = await getCurrentProfile()
  if (!profile || (profile.role !== 'super_admin' && profile.role !== 'operador')) {
    return { success: false, error: 'No tienes permisos para crear conductores.' }
  }

  const email = (formData.get('email') as string | null)?.trim() ?? ''
  const password = (formData.get('password') as string | null) ?? ''
  const full_name = (formData.get('full_name') as string | null)?.trim() ?? ''
  const phone = (formData.get('phone') as string | null)?.trim() || null
  const vehicle_plate = (formData.get('vehicle_plate') as string | null)?.trim() || null

  if (!email || !password) {
    return { success: false, error: 'Email y contraseña son obligatorios.' }
  }

  let userId: string | null = null

  try {
    const admin = createAdminClient()
    const { data: created, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    })

    if (authError) {
      console.error('[createDriver] auth.admin.createUser:', authError)
      return { success: false, error: authError.message || 'Error al crear el usuario en Auth.' }
    }

    userId = created.user?.id ?? null
    console.log('[createDriver] user_id antes de insert drivers:', userId, {
      isNull: userId === null,
      isUndefined: userId === undefined,
    })

    if (!userId) {
      return {
        success: false,
        error:
          'No se obtuvo user_id tras crear el usuario. Revisa políticas de Auth y logs de Supabase.',
      }
    }

    const { error: profileError } = await admin.from('profiles').upsert(
      {
        id: userId,
        role: 'conductor',
        full_name: full_name || null,
        phone,
        vehicle_plate,
      },
      { onConflict: 'id' }
    )

    if (profileError) {
      console.error('[createDriver] profiles upsert:', profileError)
      return { success: false, error: `Perfil: ${profileError.message}` }
    }

    const driverPayload = {
      user_id: userId,
      phone,
      vehicle_plate,
    }

    const { error: driverError } = await admin.from('drivers').insert(driverPayload)

    if (driverError) {
      console.error('[createDriver] drivers insert:', driverError)
      return { success: false, error: `Conductores: ${driverError.message}` }
    }

    // Subir documentos si fueron adjuntados
    const docTypes = ['doc_cedula', 'doc_licencia', 'doc_arl'] as const
    for (const docType of docTypes) {
      const file = formData.get(docType) as File | null
      if (!file || file.size === 0) continue
      const uploadResult = await uploadDriverDocument(admin, userId, docType, file)
      if (!uploadResult.success) {
        console.warn(`[createDriver] ${docType} upload failed:`, uploadResult.error)
      }
    }

    revalidatePath('/dashboard/drivers')
    return { success: true }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error desconocido'
    console.error('[createDriver]', e)
    return { success: false, error: message }
  }
}

