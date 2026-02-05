'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Eye } from 'lucide-react'
import { uploadEvidence } from '../actions'

export function EvidenceUpload({
  serviceId,
  evidenceUrl,
}: {
  serviceId: string
  evidenceUrl: string | null
}) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const openPicker = () => {
    setError(null)
    inputRef.current?.click()
  }

  const onFileChange = (file: File | null) => {
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Solo imágenes.')
      return
    }

    const MAX_BYTES = 6 * 1024 * 1024
    if (file.size > MAX_BYTES) {
      setError('Máx 6MB.')
      return
    }

    startTransition(async () => {
      try {
        const fd = new FormData()
        fd.set('service_id', serviceId)
        fd.set('file', file)
        await uploadEvidence(fd)
        router.refresh()
      } catch (e: any) {
        setError(e?.message ?? 'Error al subir.')
      } finally {
        if (inputRef.current) inputRef.current.value = ''
      }
    })
  }

  if (evidenceUrl) {
    return (
      <a
        href={evidenceUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-slate-200 bg-white hover:bg-slate-50"
        title="Ver evidencia"
      >
        <Eye className="h-4 w-4 text-slate-700" />
      </a>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
        disabled={isPending}
      />

      <button
        type="button"
        onClick={openPicker}
        disabled={isPending}
        className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-60"
        title="Subir evidencia"
      >
        <Camera className="h-4 w-4 text-slate-700" />
      </button>

      {error ? <span className="text-xs text-rose-600">{error}</span> : null}
    </div>
  )
}

