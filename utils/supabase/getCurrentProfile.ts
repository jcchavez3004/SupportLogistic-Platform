import { createClient } from '@/utils/supabase/server'

export type UserRole = 'super_admin' | 'operador' | 'cliente' | 'conductor'

export interface CurrentProfile {
  id: string
  role: UserRole
  client_id: string | null
  full_name: string | null
}

/**
 * Obtiene el perfil del usuario autenticado actual, incluyendo rol y client_id.
 * Retorna null si no hay sesión o el perfil no existe.
 */
export async function getCurrentProfile(): Promise<CurrentProfile | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, role, client_id, full_name')
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    console.error('Error fetching current profile:', error)
    return null
  }

  return {
    id: profile.id,
    role: (profile.role as UserRole) || 'cliente',
    client_id: profile.client_id || null,
    full_name: profile.full_name || null,
  }
}
