import { getPublicServiceView } from './actions'
import { PublicDeliveryView } from './PublicDeliveryView'

interface PageProps {
  params: Promise<{ id: string }>
}

// Página pública, sin login: el conductor de campo la abre desde el enlace
// de WhatsApp que la operadora comparte al crear/asignar el servicio.
export default async function EntregaPublicaPage({ params }: PageProps) {
  const { id } = await params
  const service = await getPublicServiceView(id)

  if (!service) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-sm text-center space-y-2">
          <p className="text-lg font-bold text-gray-900">Enlace no válido</p>
          <p className="text-sm text-gray-500">
            Este enlace de entrega no existe o el servicio aún no tiene un
            conductor asignado. Contacta a operaciones de Support Logistic.
          </p>
        </div>
      </div>
    )
  }

  return <PublicDeliveryView initialService={service} />
}
