'use client'

import { useState } from 'react'
import { MapPin, Navigation, Phone, Flag, CheckCircle2, Circle, Package, ArrowRight } from 'lucide-react'
import { EvidenceCapture, type EvidenceResult } from '@/app/dashboard/components/EvidenceCapture'
import {
  advancePublicServiceStatus,
  submitPublicEvidence,
  submitPublicPointEvidence,
  type PublicServiceView,
  type DeliveryPoint,
} from './actions'

function openWaze(address: string) {
  const q = encodeURIComponent(address)
  window.open(`waze://?q=${q}&navigate=yes`, '_blank')
  setTimeout(() => window.open(`https://waze.com/ul?q=${q}&navigate=yes`, '_blank'), 500)
}

const STEP_LABEL: Record<string, string> = {
  solicitado: 'Pendiente de asignación',
  asignado: 'Asignado — listo para iniciar recogida',
  en_curso_recogida: 'En camino a recogida',
  recogido: 'Paquete recogido',
  en_curso_entrega: 'En camino a entrega',
  entregado: 'Entrega completada',
  novedad: 'Novedad reportada',
}

const ACTIONABLE = new Set(['asignado', 'en_curso_recogida', 'recogido', 'en_curso_entrega'])

interface Props {
  initialService: PublicServiceView
}

export function PublicDeliveryView({ initialService }: Props) {
  const [service, setService] = useState(initialService)
  const [loading, setLoading] = useState(false)
  const [showEvidence, setShowEvidence] = useState(false)
  const [activePoint, setActivePoint] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const points = service.delivery_points ?? []
  const isMultipoint = !!service.is_multipoint && points.length > 1

  const advance = async () => {
    setLoading(true)
    setError(null)
    const res = await advancePublicServiceStatus(service.id, service.status)
    setLoading(false)
    if (!res.success) {
      setError(res.error ?? 'No se pudo actualizar el servicio.')
      if (res.newStatus) setService((s) => ({ ...s, status: res.newStatus! }))
      return
    }
    setService((s) => ({ ...s, status: res.newStatus! }))
  }

  const openPointEvidence = (order: number) => {
    setActivePoint(order)
    setShowEvidence(true)
  }

  const handleEvidenceComplete = async (data: EvidenceResult) => {
    setLoading(true)
    setError(null)

    if (activePoint !== null) {
      const res = await submitPublicPointEvidence(service.id, activePoint, {
        photo1Url: data.photo1Url,
        photo2Url: data.photo2Url,
        signatureUrl: data.signatureUrl,
      })
      setLoading(false)
      setShowEvidence(false)
      setActivePoint(null)
      if (!res.success) {
        setError(res.error ?? 'No se pudo guardar la evidencia del punto.')
        return
      }
      setService((s) => ({
        ...s,
        delivery_points: res.deliveryPoints ?? s.delivery_points,
        status: res.allCompleted ? 'entregado' : s.status,
      }))
      return
    }

    const res = await submitPublicEvidence(service.id, {
      photo1Url: data.photo1Url,
      photo2Url: data.photo2Url,
      signatureUrl: data.signatureUrl,
    })
    setLoading(false)
    setShowEvidence(false)
    if (!res.success) {
      setError(res.error ?? 'No se pudo guardar la evidencia.')
      return
    }
    setService((s) => ({
      ...s,
      status: 'entregado',
      evidence_photo_url: data.photo1Url,
      evidence_photo_url_2: data.photo2Url,
      evidence_signature_url: data.signatureUrl,
    }))
  }

  const serviceLabel = service.service_number ? `#${service.service_number}` : 'S/N'
  const driverName = service.field_drivers?.full_name

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {showEvidence && (
        <EvidenceCapture
          serviceId={activePoint !== null ? `${service.id}-p${activePoint}` : service.id}
          onComplete={handleEvidenceComplete}
          onCancel={() => {
            setShowEvidence(false)
            setActivePoint(null)
          }}
        />
      )}

      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide">
          Support Logistic
        </p>
        <h1 className="text-xl font-bold text-gray-900 mt-1">Servicio {serviceLabel}</h1>
        {driverName && <p className="text-sm text-gray-500 mt-0.5">Conductor: {driverName}</p>}
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
            {STEP_LABEL[service.status] ?? service.status}
          </span>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {service.status === 'entregado' ? (
          <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-5 text-center space-y-3">
            <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
            <p className="font-bold text-emerald-800">Entrega registrada</p>
            <p className="text-sm text-emerald-700">
              Gracias, la evidencia ya fue guardada en el sistema.
            </p>
            {isMultipoint ? (
              <div className="space-y-3 text-left pt-2">
                {points
                  .slice()
                  .sort((a, b) => a.order - b.order)
                  .map((p) => (
                    <div key={p.order} className="rounded-xl bg-white border border-emerald-200 p-3">
                      <p className="text-xs font-bold text-emerald-700">Punto {p.order} — {p.address}</p>
                      {p.evidence_photo_url && (
                        <img
                          src={p.evidence_photo_url}
                          alt={`Evidencia punto ${p.order}`}
                          className="rounded-lg mx-auto mt-2 max-h-40 object-cover"
                        />
                      )}
                    </div>
                  ))}
              </div>
            ) : (
              service.evidence_photo_url && (
                <img
                  src={service.evidence_photo_url}
                  alt="Evidencia de entrega"
                  className="rounded-xl mx-auto max-h-56 object-cover"
                />
              )
            )}
          </div>
        ) : (
          <>
            {['asignado', 'en_curso_recogida'].includes(service.status) && (
              <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> Recogida
                </p>
                <p className="text-sm font-semibold text-gray-900">{service.pickup_address}</p>
                {service.pickup_contact_name && (
                  <p className="text-xs text-gray-500">Contacto: {service.pickup_contact_name}</p>
                )}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => openWaze(service.pickup_address)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#00d4b1] text-white text-sm font-bold rounded-xl active:scale-95 transition-transform"
                  >
                    <Navigation className="h-4 w-4" /> Abrir en Waze
                  </button>
                  {service.pickup_phone && (
                    <a
                      href={`tel:${service.pickup_phone}`}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl active:scale-95"
                    >
                      <Phone className="h-4 w-4 text-gray-600" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {['recogido', 'en_curso_entrega'].includes(service.status) && !(isMultipoint && service.status === 'en_curso_entrega') && (
              <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1">
                  <Flag className="h-3.5 w-3.5" /> Entrega
                </p>
                <p className="text-sm font-semibold text-gray-900">{service.delivery_address}</p>
                {service.delivery_contact_name && (
                  <p className="text-xs text-gray-500">Contacto: {service.delivery_contact_name}</p>
                )}
                {service.observations && (
                  <p className="text-xs text-gray-400 italic">&quot;{service.observations}&quot;</p>
                )}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => openWaze(service.delivery_address)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#00d4b1] text-white text-sm font-bold rounded-xl active:scale-95 transition-transform"
                  >
                    <Navigation className="h-4 w-4" /> Abrir en Waze
                  </button>
                  {service.delivery_phone && (
                    <a
                      href={`tel:${service.delivery_phone}`}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl active:scale-95"
                    >
                      <Phone className="h-4 w-4 text-gray-600" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {isMultipoint && service.status === 'en_curso_entrega' && (
              <div className="space-y-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1 px-1">
                  <Flag className="h-3.5 w-3.5" /> Puntos de entrega ({points.filter((p) => p.completed).length}/{points.length})
                </p>
                {points
                  .slice()
                  .sort((a, b) => a.order - b.order)
                  .map((p) => (
                    <DeliveryPointCard
                      key={p.order}
                      point={p}
                      loading={loading}
                      onRegister={() => openPointEvidence(p.order)}
                    />
                  ))}
              </div>
            )}

            <div>
              {service.status === 'asignado' && (
                <ActionButton
                  label="Iniciar recogida"
                  icon={<MapPin className="h-5 w-5" />}
                  color="bg-amber-500"
                  loading={loading}
                  onClick={advance}
                />
              )}
              {service.status === 'en_curso_recogida' && (
                <ActionButton
                  label="Confirmar recogida"
                  icon={<Package className="h-5 w-5" />}
                  color="bg-purple-600"
                  loading={loading}
                  onClick={advance}
                />
              )}
              {service.status === 'recogido' && (
                <ActionButton
                  label="Ir a entregar"
                  icon={<ArrowRight className="h-5 w-5" />}
                  color="bg-indigo-600"
                  loading={loading}
                  onClick={advance}
                />
              )}
              {service.status === 'en_curso_entrega' && !isMultipoint && (
                <ActionButton
                  label="Registrar entrega (foto + firma)"
                  icon={<CheckCircle2 className="h-5 w-5" />}
                  color="bg-emerald-600"
                  loading={loading}
                  onClick={() => setShowEvidence(true)}
                />
              )}
              {!ACTIONABLE.has(service.status) && service.status !== 'entregado' && (
                <p className="text-sm text-gray-500 text-center py-4">
                  Este servicio no tiene acciones disponibles en este momento.
                  Contacta a operaciones de Support Logistic.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function DeliveryPointCard({
  point, loading, onRegister,
}: {
  point: DeliveryPoint
  loading: boolean
  onRegister: () => void
}) {
  const done = !!point.completed
  return (
    <div
      className={`rounded-2xl border p-4 space-y-2 ${
        done ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 bg-white'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">
            Punto {point.order}
          </p>
          <p className="text-sm font-semibold text-gray-900">{point.address}</p>
          {point.contact_name && (
            <p className="text-xs text-gray-500">Contacto: {point.contact_name}</p>
          )}
          {(point.time_start || point.time_end) && (
            <p className="text-xs text-gray-500">
              Horario: {point.time_start ?? '—'} a {point.time_end ?? '—'}
            </p>
          )}
          {point.description && (
            <p className="text-xs text-gray-400 italic">&quot;{point.description}&quot;</p>
          )}
        </div>
        <span
          className={`inline-flex items-center gap-1 shrink-0 px-2 py-1 rounded-full text-[11px] font-semibold ${
            done ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
          }`}
        >
          {done ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
          {done ? 'Entregado' : 'Pendiente'}
        </span>
      </div>

      {!done && (
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => openWaze(point.address)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#00d4b1] text-white text-sm font-bold rounded-xl active:scale-95 transition-transform"
          >
            <Navigation className="h-4 w-4" /> Waze
          </button>
          {point.contact_phone && (
            <a
              href={`tel:${point.contact_phone}`}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl active:scale-95"
            >
              <Phone className="h-4 w-4 text-gray-600" />
            </a>
          )}
        </div>
      )}

      {!done && (
        <button
          onClick={onRegister}
          disabled={loading}
          className="w-full py-3 bg-emerald-600 text-white text-sm font-bold rounded-xl active:scale-[0.98] transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="h-4 w-4" /> Registrar entrega (foto + firma)
        </button>
      )}
    </div>
  )
}

function ActionButton({
  label, icon, color, loading, onClick,
}: {
  label: string
  icon: React.ReactNode
  color: string
  loading: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`w-full py-4 ${color} text-white text-base font-bold rounded-2xl active:scale-[0.98] transition-transform disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm`}
    >
      {loading
        ? <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        : <>{icon} {label}</>
      }
    </button>
  )
}
