'use client'

import { useEffect, useRef, useState } from 'react'
import type { Map as LeafletMap, Marker as LeafletMarker } from 'leaflet'
import { createClient } from '@/utils/supabase/client'

// ⚠️ NO importar 'leaflet/dist/leaflet.css' aquí — causa crash en SSR/Vercel
// El CSS se carga dinámicamente dentro del useEffect (browser only)

interface LiveTrackingMapProps {
  lat: number
  lng: number
  deliveryAddress: string
  pickupAddress: string
  serviceId?: string
}

export function LiveTrackingMap({
  lat: initialLat,
  lng: initialLng,
  deliveryAddress,
  pickupAddress: _pickupAddress,
  serviceId,
}: LiveTrackingMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletMapRef = useRef<LeafletMap | null>(null)
  const markerRef = useRef<LeafletMarker | null>(null)
  const [currentPos, setCurrentPos] = useState({ lat: initialLat, lng: initialLng })
  const [realtimeError, setRealtimeError] = useState(false)

  // ── Inicializar mapa (solo en browser) ───────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return

    const initMap = async () => {
      try {
        // Import dinámico: evita SSR y carga CSS solo en browser
        const L = (await import('leaflet')).default

        // ✅ CSS cargado aquí dinámicamente — nunca en el servidor
        await import('leaflet/dist/leaflet.css')

        // Fix icono por defecto de Leaflet en Next.js
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        })

        if (!mapRef.current) return

        const map = L.map(mapRef.current, {
          center: [initialLat, initialLng],
          zoom: 14,
          zoomControl: true,
          scrollWheelZoom: false,
        })

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map)

        // Icono conductor (azul)
        const driverIcon = L.divIcon({
          html: `
            <div style="
              background:#2563eb;border:3px solid white;border-radius:50%;
              width:20px;height:20px;box-shadow:0 2px 8px rgba(37,99,235,0.6);
              position:relative;
            ">
              <div style="
                position:absolute;top:50%;left:50%;
                transform:translate(-50%,-50%);
                width:8px;height:8px;background:white;border-radius:50%;
              "></div>
            </div>
          `,
          className: '',
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        })

        // Icono destino (rojo)
        const destIcon = L.divIcon({
          html: `
            <div style="
              background:#dc2626;border:3px solid white;
              border-radius:50% 50% 50% 0;transform:rotate(-45deg);
              width:24px;height:24px;box-shadow:0 2px 8px rgba(220,38,38,0.5);
            "></div>
          `,
          className: '',
          iconSize: [24, 24],
          iconAnchor: [12, 24],
        })

        const marker = L.marker([initialLat, initialLng], { icon: driverIcon })
          .addTo(map)
          .bindPopup('🚚 Conductor en ruta')

        L.marker([initialLat, initialLng], { icon: destIcon })
          .addTo(map)
          .bindPopup(`📍 ${deliveryAddress}`)

        leafletMapRef.current = map
        markerRef.current = marker
      } catch (err) {
        console.error('[LiveTrackingMap] Error inicializando mapa:', err)
      }
    }

    void initMap()

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove()
        leafletMapRef.current = null
        markerRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Actualizar marcador cuando cambia posición ────────────────────────────
  useEffect(() => {
    if (!markerRef.current || !leafletMapRef.current) return
    markerRef.current.setLatLng([currentPos.lat, currentPos.lng])
    leafletMapRef.current.panTo([currentPos.lat, currentPos.lng], { animate: true })
  }, [currentPos])

  // ── Suscripción Realtime con manejo de errores ────────────────────────────
  useEffect(() => {
    if (!serviceId) return

    const supabase = createClient()
    let channel: ReturnType<typeof supabase.channel> | null = null

    try {
      channel = supabase
        .channel(`tracking-${serviceId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'services',
            filter: `id=eq.${serviceId}`,
          },
          (payload) => {
            try {
              const updated = payload.new as {
                driver_lat?: number | null
                driver_lng?: number | null
              }
              if (updated.driver_lat != null && updated.driver_lng != null) {
                setCurrentPos({ lat: updated.driver_lat, lng: updated.driver_lng })
              }
            } catch (err) {
              console.warn('[LiveTrackingMap] Error procesando update GPS:', err)
            }
          }
        )
        .subscribe((status, err) => {
          if (err || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.warn('[LiveTrackingMap] Realtime no disponible:', err ?? status)
            setRealtimeError(true)
            // ✅ No lanzar error — el mapa sigue mostrando última posición
          }
          if (status === 'CLOSED') {
            setRealtimeError(true)
          }
        })
    } catch (err) {
      console.warn('[LiveTrackingMap] No se pudo crear canal Realtime:', err)
      setRealtimeError(true)
    }

    return () => {
      if (channel) {
        void supabase.removeChannel(channel)
      }
    }
  }, [serviceId])

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-2">
      <div
        ref={mapRef}
        className="w-full rounded-xl overflow-hidden border border-gray-200"
        style={{ height: '320px' }}
      />

      <div className="flex items-center gap-4 text-xs text-gray-500 px-1">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 bg-blue-600 rounded-full inline-block" />
          Conductor
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 bg-red-600 rounded-full inline-block" />
          Destino
        </span>
        <span className="ml-auto truncate max-w-[180px]">
          📍 {deliveryAddress}
        </span>
      </div>

      {realtimeError && (
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          ⚠️ Actualización en tiempo real no disponible — mostrando última ubicación conocida
        </p>
      )}
    </div>
  )
}
