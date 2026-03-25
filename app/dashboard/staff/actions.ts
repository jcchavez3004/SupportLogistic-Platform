'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { getCurrentProfile } from '@/utils/supabase/getCurrentProfile'
import { revalidatePath } from 'next/cache'

// ─── Tipos ───────────────────────────────────────────────────────────────────

export type StaffMember = {
  id: string
  email: string | null
  full_name: string | null
  role: 'super_admin' | 'operador'
  phone: string | null
}

export type StaffRole = 'operador' | 'super_admin'

// ─── Guard de permisos ────────────────────────────────────────────────────────

async function requireSuperAdmin() {
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== 'super_admin') {
    throw new Error('Solo el Super Admin puede gestionar el staff.')
  }
  return profile
}

// ─── Listar staff ─────────────────────────────────────────────────────────────

export async function getStaffMembers(): Promise<StaffMember[]> {
  await requireSuperAdmin()
  const admin = createAdminClient()

  const { data: profiles, error } = await admin
    .from('profiles')
    .select('id, full_name, role, phone')
    .in('role', ['super_admin', 'operador'])
    .order('role', { ascending: true })

  if (error) {
    console.error('[getStaffMembers] Error:', error)
    throw new Error('No se pudo cargar el staff.')
  }

  if (!profiles || profiles.length === 0) return []

  const { data: authUsers, error: authError } = await admin.auth.admin.listUsers({
    perPage: 1000,
  })

  if (authError) {
    console.error('[getStaffMembers] Auth error:', authError)
  }

  const emailMap = new Map(
    (authUsers?.users ?? []).map((u) => [u.id, u.email ?? null])
  )

  return profiles.map((p) => ({
    id: p.id,
    email: emailMap.get(p.id) ?? null,
    full_name: p.full_name ?? null,
    role: p.role as StaffRole,
    phone: p.phone ?? null,
  }))
}

// ─── Crear miembro de staff ───────────────────────────────────────────────────

export async function createStaffMember(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  await requireSuperAdmin()

  const email = (formData.get('email') as string | null)?.trim() ?? ''
  const password = (formData.get('password') as string | null) ?? ''
  const full_name = (formData.get('full_name') as string | null)?.trim() ?? ''
  const role = (formData.get('role') as string | null)?.trim() as StaffRole
  const phone = (formData.get('phone') as string | null)?.trim() || null

  if (!email || !password) {
    return { success: false, error: 'Email y contraseña son obligatorios.' }
  }
  if (!['operador', 'super_admin'].includes(role)) {
    return { success: false, error: 'Rol inválido.' }
  }
  if (password.length < 8) {
    return { success: false, error: 'La contraseña debe tener al menos 8 caracteres.' }
  }

  try {
    const admin = createAdminClient()

    const { data: created, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    })

    if (authError) {
      console.error('[createStaffMember] Auth error:', authError)
      return { success: false, error: authError.message }
    }

    const userId = created.user?.id
    if (!userId) {
      return { success: false, error: 'No se obtuvo el ID del usuario creado.' }
    }

    const { error: profileError } = await admin
      .from('profiles')
      .upsert(
        { id: userId, role, full_name: full_name || null, phone },
        { onConflict: 'id' }
      )

    if (profileError) {
      console.error('[createStaffMember] Profile error:', profileError)
      await admin.auth.admin.deleteUser(userId)
      return { success: false, error: `Error al crear perfil: ${profileError.message}` }
    }

    revalidatePath('/dashboard/staff')
    return { success: true }
  } catch (e) {
    console.error('[createStaffMember]', e)
    return { success: false, error: e instanceof Error ? e.message : 'Error desconocido' }
  }
}

// ─── Editar miembro de staff ──────────────────────────────────────────────────

export async function updateStaffMember(
  userId: string,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  await requireSuperAdmin()

  const full_name = (formData.get('full_name') as string | null)?.trim() || null
  const role = (formData.get('role') as string | null)?.trim() as StaffRole
  const phone = (formData.get('phone') as string | null)?.trim() || null

  if (!['operador', 'super_admin'].includes(role)) {
    return { success: false, error: 'Rol inválido.' }
  }

  try {
    const admin = createAdminClient()

    const { error } = await admin
      .from('profiles')
      .update({ full_name, role, phone })
      .eq('id', userId)

    if (error) {
      console.error('[updateStaffMember]', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/staff')
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Error desconocido' }
  }
}

// ─── Eliminar miembro de staff ────────────────────────────────────────────────

export async function deleteStaffMember(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const currentProfile = await requireSuperAdmin()

  if (userId === currentProfile.id) {
    return { success: false, error: 'No puedes eliminarte a ti mismo.' }
  }

  try {
    const admin = createAdminClient()

    const { error: profileError } = await admin
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (profileError) {
      console.error('[deleteStaffMember] Profile error:', profileError)
      return { success: false, error: `Error al eliminar perfil: ${profileError.message}` }
    }

    const { error: authError } = await admin.auth.admin.deleteUser(userId)

    if (authError) {
      console.error('[deleteStaffMember] Auth error:', authError)
      return { success: false, error: `Error al eliminar usuario: ${authError.message}` }
    }

    revalidatePath('/dashboard/staff')
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Error desconocido' }
  }
}
