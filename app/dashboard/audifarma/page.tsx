import { getCurrentProfile } from '@/utils/supabase/getCurrentProfile'
import { AudifarmaSearch } from './AudifarmaSearch'

export default async function AudifarmaPage() {
  const profile = await getCurrentProfile()
  if (!profile) return null

  const isStaff = ['super_admin', 'operador'].includes(profile.role)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Audifarma — Consulta de Entregas</h1>
        <p className="mt-1 text-sm text-gray-500">
          Busca por número de documento para ver el estado y evidencias de entrega.
        </p>
      </div>
      <AudifarmaSearch isStaff={isStaff} />
    </div>
  )
}
