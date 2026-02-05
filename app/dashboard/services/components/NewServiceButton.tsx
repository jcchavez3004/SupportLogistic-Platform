'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { NewServiceModal } from './NewServiceModal'
import type { UserRole } from '@/utils/supabase/getCurrentProfile'

type ClientOption = { id: string; company_name: string }

interface NewServiceButtonProps {
  clients: ClientOption[]
  role: UserRole
  clientId: string | null
}

export function NewServiceButton({ clients, role, clientId }: NewServiceButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center justify-center w-full sm:w-auto px-4 py-3 sm:py-2 border border-transparent text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors touch-manipulation"
      >
        <Plus className="mr-2 h-5 w-5 sm:h-4 sm:w-4" />
        {role === 'cliente' ? 'Solicitar Envío' : 'Nuevo Servicio'}
      </button>
      <NewServiceModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        clients={clients}
        role={role}
        clientId={clientId}
      />
    </>
  )
}
