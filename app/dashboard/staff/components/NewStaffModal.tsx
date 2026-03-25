'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Loader2, UserPlus } from 'lucide-react'
import { createStaffMember } from '../actions'

export function NewStaffModal() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    const result = await createStaffMember(formData)
    setPending(false)
    if (result.success) {
      setOpen(false)
      router.refresh()
    } else {
      setError(result.error ?? 'Error al crear el miembro')
    }
  }

  function handleClose() {
    setOpen(false)
    setError(null)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => { setOpen(true); setError(null) }}
        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
      >
        <UserPlus className="h-4 w-4" />
        Nuevo miembro
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Nuevo miembro de staff</h2>
              <button onClick={handleClose} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Email *
                  </label>
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="nombre@supportlogistic.co"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Contraseña temporal *
                  </label>
                  <input
                    name="password"
                    type="password"
                    required
                    minLength={8}
                    placeholder="Mín. 8 caracteres"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Nombre completo
                  </label>
                  <input
                    name="full_name"
                    type="text"
                    placeholder="Nombre y apellido"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Teléfono
                  </label>
                  <input
                    name="phone"
                    type="tel"
                    placeholder="3001234567"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Rol *
                  </label>
                  <select
                    name="role"
                    required
                    defaultValue="operador"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="operador">Operador</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <div className="flex gap-3 justify-end pt-1">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="px-5 py-2 text-sm rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {pending ? 'Creando...' : 'Crear miembro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
