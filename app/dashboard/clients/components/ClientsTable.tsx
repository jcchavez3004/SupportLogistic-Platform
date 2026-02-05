'use client'

import { useState } from 'react'
import { Client } from '@/types/database.types'
import { Pencil, Package, MapPinned } from 'lucide-react'
import { NewClientModal } from './NewClientModal'

interface ServiceType {
  id: string
  name: string
  description: string
  requires_zoning: boolean
}

interface ClientsTableProps {
  clients: Client[]
  serviceTypes: ServiceType[]
  clientServiceTypes: Record<string, string[]>
  canEdit: boolean
}

export function ClientsTable({ clients, serviceTypes, clientServiceTypes, canEdit }: ClientsTableProps) {
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleEditClick = (client: Client) => {
    setEditingClient(client)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingClient(null)
  }

  // Función para obtener los nombres de servicios de un cliente
  const getClientServiceNames = (clientId: string): { name: string; requiresZoning: boolean }[] => {
    const serviceIds = clientServiceTypes[clientId] || []
    return serviceIds
      .map((id) => {
        const service = serviceTypes.find((st) => st.id === id)
        return service ? { name: service.name, requiresZoning: service.requires_zoning } : null
      })
      .filter(Boolean) as { name: string; requiresZoning: boolean }[]
  }

  if (clients.length === 0) {
    return (
      <div className="p-12 text-center">
        <p className="text-gray-500">No hay clientes registrados aún.</p>
      </div>
    )
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Empresa
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                NIT
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Servicios
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dirección
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha Creación
              </th>
              {canEdit && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {clients.map((client) => {
              const services = getClientServiceNames(client.id)
              
              return (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {client.company_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {client.nit || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {services.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {services.map((service, idx) => (
                          <span
                            key={idx}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              service.requiresZoning
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-indigo-100 text-indigo-700'
                            }`}
                          >
                            {service.requiresZoning ? (
                              <MapPinned className="h-3 w-3" />
                            ) : (
                              <Package className="h-3 w-3" />
                            )}
                            {service.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">Sin servicios</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-[20rem] truncate">
                    {client.address || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(client.created_at).toLocaleDateString('es-ES')}
                  </td>
                  {canEdit && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button
                        onClick={() => handleEditClick(client)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Editar cliente"
                      >
                        <Pencil className="h-4 w-4" />
                        Editar
                      </button>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Modal de edición */}
      <NewClientModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        serviceTypes={serviceTypes}
        editingClient={editingClient}
      />
    </>
  )
}
