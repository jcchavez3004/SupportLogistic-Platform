import { redirect } from 'next/navigation'
import { getCurrentProfile } from '@/utils/supabase/getCurrentProfile'

const AUDIFARMA_CLIENT_ID = '1024edc4-7f95-40e0-a9fc-a56bd8b75c77'

export default async function AudifarmaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login')

  const isStaff = ['super_admin', 'operador'].includes(profile.role)
  const isAudifarma = profile.client_id === AUDIFARMA_CLIENT_ID

  if (!isStaff && !isAudifarma) redirect('/dashboard')

  return <>{children}</>
}
