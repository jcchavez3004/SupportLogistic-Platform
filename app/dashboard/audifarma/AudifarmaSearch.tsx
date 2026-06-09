'use client'

import { useState, useTransition } from 'react'
import {
  Search, Package, MapPin, Clock, User,
  CheckCircle2, AlertCircle, X, Layers, FileSignature,
} from 'lucide-react'
import Image from 'next/image'
import { searchPaquete, type PaqueteRuta } from './actions'

interface AudifarmaSearchProps {
  isStaff: boolean
}

export function AudifarmaSearch({ isStaff }: AudifarmaSearchProps) {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<PaqueteRuta | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

  const handleSearch = () => {
    if (!query.trim()) return
    setError(null)
    setResult(null)
    setSearched(true)

    startTransition(async () => {
      const res = await searchPaquete(query.trim())
      if (res.error) {
        setError(res.error)
      } else {
        setResult(res.data)
      }
    })
  }

  const photos = result
    ? [result.evidence_photo_1, result.evidence_photo_2, result.evidence_photo_3, result.evidence_photo_4].filter(Boolean) as string[]
    : []

  const hasEvidence = photos.length > 0 || result?.evidence_signature

  return (
    <>
      {/* Search bar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Número de documento / tracking
        </label>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
              placeholder="Ej: 15813-NODO-120"
              className="w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 font-mono"
              autoFocus
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={!query.trim() || isPending}
            className="px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm whitespace-nowrap"
          >
            {isPending ? 'Buscando...' : 'Buscar'}
          </button>
        </div>
      </div>

      {/* Loading */}
      {isPending && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Error */}
      {error && !isPending && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">{error}</p>
            <p className="text-xs text-amber-600 mt-1">Verifica el número e intenta nuevamente.</p>
          </div>
        </div>
      )}

      {/* Result card */}
      {result && !isPending && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Header */}
          <div className={`px-6 py-4 flex items-center justify-between ${
            result.entregado ? 'bg-emerald-500' : 'bg-amber-500'
          } text-white`}>
            <div className="flex items-center gap-3">
              {result.entregado
                ? <CheckCircle2 className="h-6 w-6" />
                : <Clock className="h-6 w-6" />
              }
              <div>
                <p className="font-bold text-lg">
                  {result.entregado ? 'Entregado' : 'Pendiente de entrega'}
                </p>
                {result.entregado && result.hora_entrega && (
                  <p className="text-sm opacity-90">
                    Entregado a las {result.hora_entrega}
                  </p>
                )}
              </div>
            </div>
            {result.bultos != null && (
              <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-full">
                <Layers className="h-4 w-4" />
                <span className="text-sm font-bold">{result.bultos} bulto{result.bultos !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="px-6 py-5 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Documento</p>
                  <p className="text-sm font-bold text-gray-900 font-mono">{result.tracking_number}</p>
                </div>
              </div>
              {result.nombre_cliente && (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <User className="h-5 w-5 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Cliente</p>
                    <p className="text-sm font-semibold text-gray-900">{result.nombre_cliente}</p>
                  </div>
                </div>
              )}
            </div>
            {result.direccion && (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Dirección</p>
                  <p className="text-sm text-gray-900">{result.direccion}</p>
                </div>
              </div>
            )}
          </div>

          {/* Evidence */}
          {result.entregado && (
            <div className="border-t border-gray-100 px-6 py-5">
              {hasEvidence ? (
                <div className="space-y-4">
                  {/* Photos */}
                  {photos.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                        Fotos de evidencia ({photos.length})
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {photos.map((url, i) => (
                          <button
                            key={i}
                            onClick={() => setLightboxUrl(url)}
                            className="relative aspect-square rounded-xl overflow-hidden border-2 border-gray-100 hover:border-blue-400 transition-colors group"
                          >
                            <Image
                              src={url}
                              alt={`Evidencia ${i + 1}`}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform"
                              sizes="(max-width: 640px) 50vw, 25vw"
                            />
                            <span className="absolute bottom-1 right-1 bg-black/50 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                              {i + 1}/{photos.length}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Signature */}
                  {result.evidence_signature && (
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                        <FileSignature className="inline h-3.5 w-3.5 mr-1" />
                        Firma del destinatario
                      </p>
                      <button
                        onClick={() => setLightboxUrl(result.evidence_signature!)}
                        className="rounded-xl border-2 border-gray-100 hover:border-blue-400 overflow-hidden transition-colors inline-block"
                      >
                        <Image
                          src={result.evidence_signature}
                          alt="Firma"
                          width={300}
                          height={120}
                          className="object-contain bg-gray-50"
                        />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Clock className="h-7 w-7 text-gray-300" />
                  </div>
                  <p className="text-sm text-gray-500">Las evidencias aún no han sido registradas.</p>
                </div>
              )}
            </div>
          )}

          {/* Not delivered */}
          {!result.entregado && (
            <div className="border-t border-gray-100 px-6 py-6 text-center">
              <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock className="h-7 w-7 text-amber-400" />
              </div>
              <p className="text-sm font-semibold text-gray-700">Pendiente de entrega</p>
              <p className="text-xs text-gray-400 mt-1">Las evidencias se mostrarán una vez que el paquete sea entregado.</p>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!result && !error && !isPending && !searched && (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="h-10 w-10 text-blue-300" />
          </div>
          <p className="text-lg font-bold text-gray-700">Consulta el estado de tu entrega</p>
          <p className="text-sm text-gray-400 mt-1">Ingresa el número de documento para ver los detalles y evidencias.</p>
        </div>
      )}

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
          <div className="relative max-w-4xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
            <Image
              src={lightboxUrl}
              alt="Evidencia ampliada"
              width={1200}
              height={800}
              className="object-contain w-full h-auto max-h-[90vh] rounded-xl"
            />
          </div>
        </div>
      )}
    </>
  )
}
