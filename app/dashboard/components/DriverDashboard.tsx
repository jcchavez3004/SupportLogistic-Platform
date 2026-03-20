'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
  MapPin, Navigation, Package, CheckCircle2,
  AlertTriangle, Phone, Clock, ChevronRight,
  Bell, Truck, ArrowRight,
} from 'lucide-react'
import { LocationTracker } from './LocationTracker'
import { EvidenceCapture, type EvidenceResult } from './EvidenceCapture'
import { updateServiceStatus } from '../actions'

// ─── Tipo Service (columnas del schema real) ──────────────────────────────────
export interface Service {
  id: string
  service_number: number | null
  status: string
  pickup_address: string
  pickup_contact_name: string | null
  pickup_phone: string | null
  delivery_address: string
  delivery_contact_name: string | null
  delivery_phone: string | null
  observations: string | null
  zone_label: string | null
  driver_lat: number | null
  driver_lng: number | null
  created_at: string
}

interface DriverDashboardProps {
  driverId: string
  initialServices: Service[]
}

// ─── Config visual por estado ─────────────────────────────────────────────────
const S: Record<string, { label: string; color: string; bg: string; border: string; dot: string }> = {
  asignado:          { label: 'Asignado',    color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200',   dot: 'bg-blue-500'    },
  en_curso_recogida: { label: 'En recogida', color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200',  dot: 'bg-amber-500'   },
  recogido:          { label: 'Recogido',    color: 'text-purple-700',  bg: 'bg-purple-50',  border: 'border-purple-200', dot: 'bg-purple-500'  },
  en_curso_entrega:  { label: 'En entrega',  color: 'text-indigo-700',  bg: 'bg-indigo-50',  border: 'border-indigo-200', dot: 'bg-indigo-500'  },
  entregado:         { label: 'Entregado',   color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200',dot: 'bg-emerald-500' },
  novedad:           { label: 'Novedad',     color: 'text-red-700',     bg: 'bg-red-50',     border: 'border-red-200',    dot: 'bg-red-500'     },
  solicitado:        { label: 'Solicitado',  color: 'text-slate-700',   bg: 'bg-slate-50',   border: 'border-slate-200',  dot: 'bg-slate-400'   },
}

const ACTIVE = new Set(['asignado', 'en_curso_recogida', 'recogido', 'en_curso_entrega'])

// ─── Utilidades ───────────────────────────────────────────────────────────────
function openWaze(address: string) {
  const q = encodeURIComponent(address)
  window.open(`waze://?q=${q}&navigate=yes`, '_blank')
  setTimeout(() => window.open(`https://waze.com/ul?q=${q}&navigate=yes`, '_blank'), 500)
}

// ─── Componente principal ─────────────────────────────────────────────────────
export function DriverDashboard({ driverId, initialServices }: DriverDashboardProps) {
  const supabase = createClient()
  const [services, setServices] = useState<Service[]>(initialServices)
  const [loading, setLoading] = useState(false)
  const [showEvidence, setShowEvidence] = useState(false)
  const [notification, setNotification] = useState<string | null>(null)
  const [novedadText, setNovedadText] = useState('')
  const [showNovedad, setShowNovedad] = useState(false)

  const active = services.find((s) => ACTIVE.has(s.status)) ?? null
  const isTracking = active
    ? ['en_curso_recogida', 'en_curso_entrega'].includes(active.status)
    : false

  // ── Realtime: escuchar cambios del conductor ──────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel(`driver-${driverId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'services', filter: `driver_id=eq.${driverId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const svc = payload.new as Service
            setServices((prev) => [svc, ...prev])
            setNotification(`🔔 Nuevo servicio asignado #${svc.service_number ?? ''}`)
            setTimeout(() => setNotification(null), 6000)
          }
          if (payload.eventType === 'UPDATE') {
            setServices((prev) =>
              prev.map((s) => s.id === payload.new.id ? { ...s, ...payload.new } as Service : s)
            )
          }
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [driverId, supabase])

  // ── Cambiar estado ────────────────────────────────────────────────────────
  const changeStatus = useCallback(async (
    id: string,
    status: string,
    extra?: Record<string, unknown>
  ) => {
    setLoading(true)
    try {
      await updateServiceStatus(id, status, extra)
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Evidencia completa → finalizar servicio ───────────────────────────────
  const handleEvidenceComplete = useCallback(async (data: EvidenceResult) => {
    if (!active) return
    await changeStatus(active.id, 'entregado', {
      evidence_photo_url:     data.photo1Url,
      evidence_photo_url_2:   data.photo2Url,
      evidence_signature_url: data.signatureUrl,
      completed_at:           new Date().toISOString(),
    })
    setShowEvidence(false)
  }, [active, changeStatus])

  // ── Novedad ───────────────────────────────────────────────────────────────
  const handleNovedad = useCallback(async () => {
    if (!active || !novedadText.trim()) return
    await changeStatus(active.id, 'novedad', { novedad_descripcion: novedadText.trim() })
    setShowNovedad(false)
    setNovedadText('')
  }, [active, novedadText, changeStatus])

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = {
    asignados:  services.filter((s) => s.status === 'asignado').length,
    enCurso:    services.filter((s) => ACTIVE.has(s.status) && s.status !== 'asignado').length,
    entregados: services.filter((s) => s.status === 'entregado').length,
    novedades:  services.filter((s) => s.status === 'novedad').length,
  }

  const cfg = active ? S[active.status] : null

  return (
    <>
      {active && <LocationTracker serviceId={active.id} active={isTracking} />}

      {showEvidence && active && (
        <EvidenceCapture
          serviceId={active.id}
          onComplete={handleEvidenceComplete}
          onCancel={() => setShowEvidence(false)}
        />
      )}

      <div className="min-h-screen bg-gray-50 pb-10">

        {/* Toast notificación */}
        {notification && (
          <div className="fixed top-4 inset-x-4 z-50 bg-blue-600 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3">
            <Bell className="h-5 w-5 flex-shrink-0 animate-bounce" />
            <p className="text-sm font-semibold">{notification}</p>
          </div>
        )}

        <div className="max-w-lg mx-auto px-4 pt-5 space-y-4">

          {/* Stats */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Asignados',  value: stats.asignados,  color: 'text-blue-600'    },
              { label: 'En curso',   value: stats.enCurso,    color: 'text-amber-600'   },
              { label: 'Entregados', value: stats.entregados, color: 'text-emerald-600' },
              { label: 'Novedades',  value: stats.novedades,  color: 'text-red-600'     },
            ].map((st) => (
              <div key={st.label} className="bg-white rounded-2xl p-3 text-center shadow-sm border border-gray-100">
                <p className={`text-2xl font-bold ${st.color}`}>{st.value}</p>
                <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{st.label}</p>
              </div>
            ))}
          </div>

          {/* Servicio activo */}
          {active && cfg ? (
            <div className={`rounded-3xl border-2 ${cfg.border} ${cfg.bg} p-5 space-y-4`}>

              {/* Cabecera */}
              <div className="flex items-start justify-between">
                <div>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                    <span className={`w-2 h-2 rounded-full ${cfg.dot} animate-pulse`} />
                    {cfg.label}
                  </span>
                  <h2 className="mt-2 text-xl font-bold text-gray-900">
                    Servicio #{active.service_number ?? '—'}
                  </h2>
                  {active.zone_label && (
                    <p className="text-xs text-gray-400 mt-0.5">{active.zone_label}</p>
                  )}
                </div>
                <Truck className="h-8 w-8 text-gray-200 flex-shrink-0" />
              </div>

              {/* Dirección según estado */}
              {['asignado', 'en_curso_recogida'].includes(active.status) && (
                <div className="bg-white/80 rounded-2xl p-4 space-y-2">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">📦 Recogida</p>
                  <p className="text-sm font-semibold text-gray-900">{active.pickup_address}</p>
                  {active.pickup_contact_name && (
                    <p className="text-xs text-gray-500">Contacto: {active.pickup_contact_name}</p>
                  )}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => openWaze(active.pickup_address)}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#00d4b1] text-white text-sm font-bold rounded-xl active:scale-95 transition-transform"
                    >
                      <Navigation className="h-4 w-4" /> Abrir en Waze
                    </button>
                    {active.pickup_phone && (
                      <a href={`tel:${active.pickup_phone}`}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl active:scale-95"
                      >
                        <Phone className="h-4 w-4 text-gray-600" />
                      </a>
                    )}
                  </div>
                </div>
              )}

              {['recogido', 'en_curso_entrega'].includes(active.status) && (
                <div className="bg-white/80 rounded-2xl p-4 space-y-2">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">🎯 Entrega</p>
                  <p className="text-sm font-semibold text-gray-900">{active.delivery_address}</p>
                  {active.delivery_contact_name && (
                    <p className="text-xs text-gray-500">Contacto: {active.delivery_contact_name}</p>
                  )}
                  {active.observations && (
                    <p className="text-xs text-gray-400 italic">"{active.observations}"</p>
                  )}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => openWaze(active.delivery_address)}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#00d4b1] text-white text-sm font-bold rounded-xl active:scale-95 transition-transform"
                    >
                      <Navigation className="h-4 w-4" /> Abrir en Waze
                    </button>
                    {active.delivery_phone && (
                      <a href={`tel:${active.delivery_phone}`}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl active:scale-95"
                      >
                        <Phone className="h-4 w-4 text-gray-600" />
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Botones de acción */}
              <div className="space-y-2">
                {active.status === 'asignado' && (
                  <ActionButton
                    label="Iniciar recogida"
                    icon={<MapPin className="h-5 w-5" />}
                    color="bg-amber-500"
                    loading={loading}
                    onClick={() => changeStatus(active.id, 'en_curso_recogida', {
                      started_at: new Date().toISOString()
                    })}
                  />
                )}
                {active.status === 'en_curso_recogida' && (
                  <ActionButton
                    label="Confirmar recogida"
                    icon={<Package className="h-5 w-5" />}
                    color="bg-purple-600"
                    loading={loading}
                    onClick={() => changeStatus(active.id, 'recogido', {
                      picked_up_at: new Date().toISOString()
                    })}
                  />
                )}
                {active.status === 'recogido' && (
                  <ActionButton
                    label="Ir a entregar"
                    icon={<ArrowRight className="h-5 w-5" />}
                    color="bg-indigo-600"
                    loading={loading}
                    onClick={() => changeStatus(active.id, 'en_curso_entrega')}
                  />
                )}
                {active.status === 'en_curso_entrega' && (
                  <ActionButton
                    label="Registrar entrega (foto + firma)"
                    icon={<CheckCircle2 className="h-5 w-5" />}
                    color="bg-emerald-600"
                    loading={loading}
                    onClick={() => setShowEvidence(true)}
                  />
                )}

                {/* Botón novedad */}
                {['en_curso_recogida', 'recogido', 'en_curso_entrega'].includes(active.status) && (
                  showNovedad ? (
                    <div className="space-y-2 pt-1">
                      <textarea
                        value={novedadText}
                        onChange={(e) => setNovedadText(e.target.value)}
                        placeholder="Describe la novedad..."
                        rows={3}
                        className="w-full px-4 py-3 border border-red-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none bg-white"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowNovedad(false)}
                          className="flex-1 py-3 border border-gray-200 text-gray-600 font-semibold rounded-xl text-sm"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleNovedad}
                          disabled={!novedadText.trim() || loading}
                          className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl text-sm disabled:opacity-40"
                        >
                          Reportar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowNovedad(true)}
                      className="w-full py-3 border-2 border-red-200 text-red-600 text-sm font-semibold rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                      <AlertTriangle className="h-4 w-4" /> Reportar novedad
                    </button>
                  )
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-gray-200 p-10 text-center shadow-sm">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-gray-300" />
              </div>
              <p className="font-bold text-gray-700 text-lg">Sin servicio activo</p>
              <p className="text-sm text-gray-400 mt-1">
                Cuando te asignen un servicio aparecerá aquí al instante.
              </p>
            </div>
          )}

          {/* Próximos servicios asignados */}
          {services.filter((s) => s.status === 'asignado' && s.id !== active?.id).length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">Próximos</p>
              {services
                .filter((s) => s.status === 'asignado' && s.id !== active?.id)
                .map((svc) => (
                  <div key={svc.id} className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-3 shadow-sm">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Package className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900">#{svc.service_number ?? '—'}</p>
                      <p className="text-xs text-gray-400 truncate">{svc.delivery_address}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-300 flex-shrink-0" />
                  </div>
                ))}
            </div>
          )}

          {/* Historial */}
          {services.filter((s) => ['entregado', 'novedad'].includes(s.status)).length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">Historial</p>
              {services
                .filter((s) => ['entregado', 'novedad'].includes(s.status))
                .slice(0, 5)
                .map((svc) => {
                  const c = S[svc.status]
                  return (
                    <div key={svc.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 opacity-70">
                      <div className={`w-10 h-10 ${c.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                        {svc.status === 'entregado'
                          ? <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                          : <AlertTriangle className="h-5 w-5 text-red-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-700">
                          #{svc.service_number ?? '—'} · {c.label}
                        </p>
                        <p className="text-xs text-gray-400 truncate">{svc.delivery_address}</p>
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ─── Botón de acción reutilizable ─────────────────────────────────────────────
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
