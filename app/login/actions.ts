'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { getCurrentProfile } from '@/utils/supabase/getCurrentProfile'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    redirect('/login?error=Por favor completa todos los campos')
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }

  const profile = await getCurrentProfile()
  if (profile?.role === 'cliente') {
    redirect('/dashboard/audifarma')
  }

  redirect('/dashboard')
}
