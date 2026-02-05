'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { NewClientModal } from './NewClientModal'

interface ServiceType {
  id: string
  name: string
  description: string
  requires_zoning: boolean
}

interface NewClientButtonProps {
  serviceTypes: ServiceType[]
}

export function NewClientButton({ serviceTypes }: NewClientButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
      >
        <Plus className="mr-2 h-4 w-4" />
        Nuevo Cliente
      </button>
      <NewClientModal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
        serviceTypes={serviceTypes}
      />
    </>
  )
}
