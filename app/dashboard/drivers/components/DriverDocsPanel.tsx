'use client'

import { useState, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ExternalLink, Upload, Loader2, CheckCircle2, Clock } from 'lucide-react'
import type { DriverDoc } from '../actions'
import { uploadDriverDoc } from '../actions'

const DOC_ICONS: Record<DriverDoc['key'], string> = {
  doc_cedula: '🪪',
  doc_licencia: '🚗',
  doc_arl: '🛡️',
}

interface DriverDocsPanelProps {
  driverId: string
  docs: DriverDoc[]
}

export function DriverDocsPanel({ driverId, docs }: DriverDocsPanelProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
        Documentos
      </p>
      <div className="grid grid-cols-1 gap-2">
        {docs.map((doc) => (
          <DocRow key={doc.key} driverId={driverId} doc={doc} />
        ))}
      </div>
    </div>
  )
}

function DocRow({ driverId, doc }: { driverId: string; doc: DriverDoc }) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)

    const fd = new FormData()
    fd.set('driver_id', driverId)
    fd.set('doc_type', doc.key)
    fd.set('file', file)

    startTransition(async () => {
      const result = await uploadDriverDoc(fd)
      if (result.success) {
        router.refresh()
      } else {
        setError(result.error ?? 'Error al subir')
      }
    })

    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
      <span className="text-base" role="img" aria-label={doc.label}>
        {DOC_ICONS[doc.key]}
      </span>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-700 truncate">{doc.label}</p>
        {error && <p className="text-xs text-red-500 truncate">{error}</p>}
      </div>

      {doc.exists ? (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 rounded-full px-2 py-0.5 ring-1 ring-inset ring-green-200">
          <CheckCircle2 className="h-3 w-3" />
          Subido
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 rounded-full px-2 py-0.5 ring-1 ring-inset ring-gray-200">
          <Clock className="h-3 w-3" />
          Pendiente
        </span>
      )}

      {doc.exists && doc.url && (
        <a
          href={doc.url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
          title="Ver documento"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}

      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={handleUpload}
      />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={isPending}
        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors disabled:opacity-50"
        title={doc.exists ? 'Reemplazar' : 'Subir'}
      >
        {isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Upload className="h-3.5 w-3.5" />
        )}
        {doc.exists ? 'Reemplazar' : 'Subir'}
      </button>
    </div>
  )
}
