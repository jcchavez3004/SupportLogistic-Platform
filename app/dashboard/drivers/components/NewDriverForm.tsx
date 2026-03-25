'use client'

import { useState, useRef } from 'react'
import type { FormEvent, ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, X, FileText, Check } from 'lucide-react'
import { createDriver } from '../actions'

type DocKey = 'doc_cedula' | 'doc_licencia' | 'doc_arl'

const DOC_CONFIG: { key: DocKey; label: string; description: string }[] = [
  { key: 'doc_cedula', label: 'Cédula', description: 'Documento de identidad' },
  { key: 'doc_licencia', label: 'Licencia de Conducción', description: 'Vigente' },
  { key: 'doc_arl', label: 'ARL', description: 'Afiliación a riesgos laborales' },
]

const ACCEPTED = '.pdf,.jpg,.jpeg,.png,.webp'

export function NewDriverForm() {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [files, setFiles] = useState<Record<DocKey, File | null>>({
    doc_cedula: null,
    doc_licencia: null,
    doc_arl: null,
  })

  function handleFileChange(key: DocKey) {
    return (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] ?? null
      setFiles((prev) => ({ ...prev, [key]: file }))
    }
  }

  function clearFile(key: DocKey) {
    setFiles((prev) => ({ ...prev, [key]: null }))
    const input = formRef.current?.querySelector<HTMLInputElement>(`[name="${key}"]`)
    if (input) input.value = ''
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    setMessage(null)
    const formData = new FormData(e.currentTarget)
    const result = await createDriver(formData)
    setPending(false)
    if (result.success) {
      setOpen(false)
      setFiles({ doc_cedula: null, doc_licencia: null, doc_arl: null })
      router.refresh()
      return
    }
    setMessage(result.error ?? 'Error al crear conductor')
  }

  function handleClose() {
    setOpen(false)
    setMessage(null)
    setFiles({ doc_cedula: null, doc_licencia: null, doc_arl: null })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true)
          setMessage(null)
        }}
        className="inline-flex items-center justify-center w-full sm:w-auto px-4 py-3 sm:py-2 border border-gray-200 text-sm font-medium rounded-lg text-gray-700 bg-white shadow-sm hover:bg-gray-50 touch-manipulation"
      >
        Nuevo Conductor
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div
            role="dialog"
            className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-5"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Nuevo conductor</h2>
              <button type="button" onClick={handleClose} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
              {/* ── Datos básicos ──────────────────────────────── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
                  <input
                    name="email"
                    type="email"
                    required
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    autoComplete="email"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Contraseña temporal *</label>
                  <input
                    name="password"
                    type="password"
                    required
                    minLength={8}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nombre completo</label>
                  <input
                    name="full_name"
                    type="text"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Teléfono</label>
                  <input
                    name="phone"
                    type="tel"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Placa vehículo</label>
                  <input
                    name="vehicle_plate"
                    type="text"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* ── Documentos ──────────────────────────────────── */}
              <div>
                <p className="text-xs font-medium text-gray-600 mb-2">
                  Documentos <span className="text-gray-400">(opcionales, PDF o imagen, máx 10 MB)</span>
                </p>
                <div className="space-y-2">
                  {DOC_CONFIG.map(({ key, label, description }) => (
                    <div key={key}>
                      {files[key] ? (
                        <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2">
                          <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-green-800 truncate">
                              {label}
                            </p>
                            <p className="text-[11px] text-green-600 truncate">
                              {files[key]!.name} ({(files[key]!.size / 1024).toFixed(0)} KB)
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => clearFile(key)}
                            className="text-green-600 hover:text-red-500 flex-shrink-0"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex items-center gap-3 rounded-lg border border-dashed border-gray-300 px-3 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 flex-shrink-0">
                            {key === 'doc_arl' ? (
                              <FileText className="h-4 w-4 text-gray-500" />
                            ) : (
                              <Upload className="h-4 w-4 text-gray-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-700">{label}</p>
                            <p className="text-[11px] text-gray-400">{description}</p>
                          </div>
                          <span className="text-[11px] text-blue-600 font-medium flex-shrink-0">
                            Elegir archivo
                          </span>
                          <input
                            type="file"
                            name={key}
                            accept={ACCEPTED}
                            className="hidden"
                            onChange={handleFileChange(key)}
                          />
                        </label>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Error ───────────────────────────────────────── */}
              {message && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2" role="alert">
                  {message}
                </p>
              )}

              {/* ── Botones ─────────────────────────────────────── */}
              <div className="flex gap-2 justify-end pt-1">
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
                  className="px-5 py-2 text-sm rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {pending ? 'Creando…' : 'Crear Conductor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
