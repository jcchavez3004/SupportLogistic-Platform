import { use } from 'react'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getServiceById } from '../../actions'
import { getCurrentProfile } from '@/utils/supabase/getCurrentProfile'
import { ServiceDetailView } from './components/ServiceDetailView'

interface ServiceDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ServiceDetailPage({ params }: ServiceDetailPageProps) {
  const { id } = use(params)
  
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
    notFound()
  }

  // Usar service_number de la BD, o "PENDIENTE" si es null
  const serviceNumber = service.service_number
    ? `#${service.service_number}`
    : 'PENDIENTE'

  return (
    <ServiceDetailView
      service={service as any}
      serviceNumber={serviceNumber}
      role={role}
    />
  )
}
