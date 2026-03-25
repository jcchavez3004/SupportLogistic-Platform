'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  User, Phone, Mail, Shield, Edit2,
  Trash2, Loader2, AlertTriangle, X
} from 'lucide-react'
import type { StaffMember, StaffRole } from '../actions'
import { updateStaffMember, deleteStaffMember } from '../actions'

interface StaffTableProps {
  staff: StaffMember[]
  currentUserId: string
}

const ROLE_CONFIG: Record<StaffRole, { label: string; color: string; bg: string }> = {
  super_admin: {
    label: 'Super Admin',
    color: 'text-purple-700',
    bg: 'bg-purple-50 ring-purple-200',
  },
  operador: {
    label: 'Operador',
    color: 'text-blue-700',
    bg: 'bg-blue-50 ring-blue-200',
  },
}

// ── Componente Editar ─────────────────────────────────────────────────────────

function EditStaffModal({
  member,
  onClose,
}: {
  member: StaffMember
  onClose: () => void
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await updateStaffMember(member.id, formData)
      if (result.success) {
        router.refresh()
        onClose()
      } else {
        setError(result.error ?? 'Error al actualizar')
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Editar miembro</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Nombre completo
            </label>
            <input
              name="full_name"
              defaultValue={member.full_name ?? ''}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Teléfono
            </label>
            <input
              name="phone"
              type="tel"
              defaultValue={member.phone ?? ''}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Rol
            </label>
            <select
              name="role"
              defaultValue={member.role}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="operador">Operador</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3 justify-end pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2 text-sm rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isPending ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Componente Eliminar ───────────────────────────────────────────────────────

function DeleteStaffButton({
  member,
  currentUserId,
}: {
  member: StaffMember
  currentUserId: string
}) {
  const router = useRouter()
  const [showConfirm, setShowConfirm] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const isSelf = member.id === currentUserId

  const handleDelete = () => {
    setError(null)
    startTransition(async () => {
      const result = await deleteStaffMember(member.id)
      if (result.success) {
        router.refresh()
        setShowConfirm(false)
      } else {
        setError(result.error ?? 'Error al eliminar')
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        disabled={isSelf}
        title={isSelf ? 'No puedes eliminarte a ti mismo' : 'Eliminar'}
        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Eliminar miembro</h3>
                <p className="text-sm text-gray-500 mt-1">
                  ¿Eliminar a <strong>{member.full_name ?? member.email}</strong>?
                  Esta acción no se puede deshacer.
                </p>
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setShowConfirm(false); setError(null) }}
                disabled={isPending}
                className="px-4 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {isPending ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ── Tabla principal ───────────────────────────────────────────────────────────

export function StaffTable({ staff, currentUserId }: StaffTableProps) {
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null)

  if (staff.length === 0) {
    return (
      <div className="text-center py-12">
        <User className="mx-auto h-12 w-12 text-gray-300 mb-3" />
        <p className="text-sm text-gray-500">No hay miembros de staff registrados.</p>
      </div>
    )
  }

  return (
    <>
      {editingMember && (
        <EditStaffModal
          member={editingMember}
          onClose={() => setEditingMember(null)}
        />
      )}

      {/* Vista móvil: tarjetas */}
      <div className="block md:hidden space-y-3 p-4">
        {staff.map((member) => {
          const cfg = ROLE_CONFIG[member.role]
          return (
            <div key={member.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                    <User className="h-4 w-4 text-indigo-600" />
                  </div>
                  <span className="font-semibold text-gray-900 text-sm">
                    {member.full_name || 'Sin nombre'}
                  </span>
                </div>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${cfg.bg} ${cfg.color}`}>
                  {cfg.label}
                </span>
              </div>
              <div className="px-4 py-3 space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="h-3.5 w-3.5 text-gray-400" />
                  {member.email ?? '—'}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="h-3.5 w-3.5 text-gray-400" />
                  {member.phone ?? '—'}
                </div>
              </div>
              <div className="px-4 py-3 border-t border-gray-100 flex gap-2 justify-end">
                <button
                  onClick={() => setEditingMember(member)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  Editar
                </button>
                <DeleteStaffButton member={member} currentUserId={currentUserId} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Vista desktop: tabla */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['Nombre', 'Email', 'Teléfono', 'Rol', 'Acciones'].map((h) => (
                <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {staff.map((member) => {
              const cfg = ROLE_CONFIG[member.role]
              return (
                <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-indigo-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {member.full_name || '—'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {member.email ?? '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {member.phone ?? '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${cfg.bg} ${cfg.color}`}>
                      <Shield className="h-3 w-3" />
                      {cfg.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingMember(member)}
                        className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <DeleteStaffButton member={member} currentUserId={currentUserId} />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
