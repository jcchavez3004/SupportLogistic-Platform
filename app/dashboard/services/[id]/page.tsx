import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getServiceById } from '../../actions'
import { getCurrentProfile } from '@/utils/supabase/getCurrentProfile'
import { ServiceDetailView } from './components/ServiceDetailView'

interface ServiceDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ServiceDetailPage({ params }: ServiceDetailPageProps) {
  const { id } = await params
  
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const profile = await getCurrentProfile()
  const role = profile?.role || 'cliente'

  const service = await getServiceById(id)

  if (!service) {
    redirect('/dashboard/services')
  }

  return (
    <ServiceDetailView
      service={service}
      serviceNumber={`#${service.service_number ?? 'S/N'}`}
      role={role}
      serviceId={service.id}
    />
  )
}
