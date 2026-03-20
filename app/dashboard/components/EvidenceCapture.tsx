'use client'

import { useState, useRef, useCallback } from 'react'
import { Camera, RotateCcw, Upload, X } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

export interface EvidenceResult {
  photo1Url: string
  photo2Url: string | null
  signatureUrl: string
}

interface EvidenceCaptureProps {
  serviceId: string
  onComplete: (data: EvidenceResult) => void
  onCancel: () => void
}

export function EvidenceCapture({ serviceId, onComplete, onCancel }: EvidenceCaptureProps) {
  const supabase = createClient()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const lastPoint = useRef<{ x: number; y: number } | null>(null)

  const [step, setStep] = useState<'photos' | 'signature'>('photos')
  const [photo1, setPhoto1] = useState<File | null>(null)
  const [photo1Preview, setPhoto1Preview] = useState<string | null>(null)
  const [photo2, setPhoto2] = useState<File | null>(null)
  const [photo2Preview, setPhoto2Preview] = useState<string | null>(null)
  const [isSigning, setIsSigning] = useState(false)
  const [hasSigned, setHasSigned] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ── Fotos ────────────────────────────────────────────────────────────────
  const handlePhoto = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, slot: 1 | 2) => {
      const file = e.target.files?.[0]
      if (!file) return
      const url = URL.createObjectURL(file)
      if (slot === 1) { setPhoto1(file); setPhoto1Preview(url) }
      else { setPhoto2(file); setPhoto2Preview(url) }
      e.target.value = ''
    },
    []
  )

  // ── Canvas firma ──────────────────────────────────────────────────────────
  const getPoint = (
    e: React.TouchEvent | React.MouseEvent,
    canvas: HTMLCanvasElement
  ) => {
    const rect = canvas.getBoundingClientRect()
    const sx = canvas.width / rect.width
    const sy = canvas.height / rect.height
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * sx,
        y: (e.touches[0].clientY - rect.top) * sy,
      }
    }
    return {
      x: ((e as React.MouseEvent).clientX - rect.left) * sx,
      y: ((e as React.MouseEvent).clientY - rect.top) * sy,
    }
  }

  const startSign = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    setIsSigning(true)
    lastPoint.current = getPoint(e, canvas)
  }

  const drawSign = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault()
    if (!isSigning) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || !lastPoint.current) return
    const p = getPoint(e, canvas)
    ctx.beginPath()
    ctx.strokeStyle = '#1e40af'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    lastPoint.current = p
    setHasSigned(true)
  }

  const endSign = () => { setIsSigning(false); lastPoint.current = null }

  const clearSignature = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasSigned(false)
  }

  // ── Upload a Supabase Storage ─────────────────────────────────────────────
  const uploadFile = async (file: File | Blob, path: string): Promise<string> => {
    const { error } = await supabase.storage
      .from('evidence')
      .upload(path, file, { upsert: true })
    if (error) throw new Error(error.message)
    return supabase.storage.from('evidence').getPublicUrl(path).data.publicUrl
  }

  const handleSubmit = async () => {
    if (!photo1) { setError('Debes tomar al menos una foto.'); return }
    if (!hasSigned) { setError('Debes capturar la firma del destinatario.'); return }

    setIsUploading(true)
    setError(null)

    try {
      const ts = Date.now()
      const photo1Url = await uploadFile(photo1, `${serviceId}/photo1_${ts}.jpg`)
      const photo2Url = photo2
        ? await uploadFile(photo2, `${serviceId}/photo2_${ts}.jpg`)
        : null
      const blob = await new Promise<Blob>((res, rej) =>
        canvasRef.current!.toBlob((b) => b ? res(b) : rej(new Error('Canvas vacío')), 'image/png')
      )
      const signatureUrl = await uploadFile(blob, `${serviceId}/signature_${ts}.png`)
      onComplete({ photo1Url, photo2Url, signatureUrl })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al subir evidencia')
    } finally {
      setIsUploading(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Evidencia de entrega</h2>
        <button onClick={onCancel} className="p-2 rounded-full hover:bg-gray-100">
          <X className="h-5 w-5 text-gray-500" />
        </button>
      </div>

      <div className="flex-1 px-4 py-5 space-y-5 max-w-lg mx-auto w-full">
        {/* Tabs */}
        <div className="flex rounded-xl border border-gray-200 overflow-hidden">
          {(['photos', 'signature'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStep(s)}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                step === s ? 'bg-blue-600 text-white' : 'bg-white text-gray-500'
              }`}
            >
              {s === 'photos' ? '📷 Fotos' : '✍️ Firma'}
            </button>
          ))}
        </div>

        {/* PASO: Fotos */}
        {step === 'photos' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Mínimo una foto de evidencia de la entrega.</p>

            {[1, 2].map((slot) => {
              const preview = slot === 1 ? photo1Preview : photo2Preview
              const isRequired = slot === 1
              return (
                <div key={slot} className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Foto {slot}{' '}
                    {isRequired
                      ? <span className="text-red-500">*</span>
                      : <span className="text-gray-400 font-normal">(opcional)</span>}
                  </label>
                  {preview ? (
                    <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-300">
                      <img src={preview} alt={`Foto ${slot}`} className="w-full h-52 object-cover" />
                      <button
                        onClick={() => slot === 1
                          ? (setPhoto1(null), setPhoto1Preview(null))
                          : (setPhoto2(null), setPhoto2Preview(null))
                        }
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-36 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 cursor-pointer hover:bg-gray-100 active:bg-gray-200">
                      <Camera className="h-7 w-7 text-gray-400 mb-1" />
                      <span className="text-sm text-gray-500">Tomar foto</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(e) => handlePhoto(e, slot as 1 | 2)}
                        className="sr-only"
                      />
                    </label>
                  )}
                </div>
              )
            })}

            <button
              onClick={() => setStep('signature')}
              disabled={!photo1}
              className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl disabled:opacity-40 text-base active:scale-[0.98] transition-transform"
            >
              Continuar → Firma
            </button>
          </div>
        )}

        {/* PASO: Firma */}
        {step === 'signature' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Pide al destinatario que firme aquí.</p>

            <div className="relative rounded-2xl border-2 border-gray-200 bg-gray-50 overflow-hidden">
              <canvas
                ref={canvasRef}
                width={600}
                height={240}
                className="w-full touch-none cursor-crosshair"
                style={{ height: '200px' }}
                onMouseDown={startSign}
                onMouseMove={drawSign}
                onMouseUp={endSign}
                onMouseLeave={endSign}
                onTouchStart={startSign}
                onTouchMove={drawSign}
                onTouchEnd={endSign}
              />
              {!hasSigned && (
                <p className="absolute inset-0 flex items-center justify-center text-gray-300 text-sm pointer-events-none">
                  Firma aquí
                </p>
              )}
            </div>

            <button
              onClick={clearSignature}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
            >
              <RotateCcw className="h-4 w-4" /> Limpiar firma
            </button>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={isUploading || !hasSigned || !photo1}
              className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl disabled:opacity-40 text-base active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              {isUploading
                ? <><div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Subiendo...</>
                : <><Upload className="h-5 w-5" /> Confirmar entrega</>
              }
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
