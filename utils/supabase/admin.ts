import { createClient } from '@supabase/supabase-js'

/**
 * Cliente Supabase con service role (solo servidor).
 * Necesario para crear usuarios sin afectar la sesión del admin (`signUp` con cookies).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY no está configurada. Añádela en .env.local para crear conductores desde el panel.'
    )
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
