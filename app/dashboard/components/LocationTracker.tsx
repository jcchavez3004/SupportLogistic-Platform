'use client'

import { useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'

interface LocationTrackerProps {
  serviceId: string
  /** Solo trackea cuando active=true (en_curso_recogida o en_curso_entrega) */
  active: boolean
}

export function LocationTracker({ serviceId, active }: LocationTrackerProps) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const supabase = createClient()

  const updateLocation = useCallback(async () => {
    if (!navigator.geolocation) return

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        await supabase
          .from('services')
          .update({
            driver_lat: coords.latitude,
            driver_lng: coords.longitude,
            driver_location_updated_at: new Date().toISOString(),
          })
          .eq('id', serviceId)
      },
      (err) => console.warn('[LocationTracker]', err.message),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    )
  }, [serviceId, supabase])

  useEffect(() => {
    if (!active) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }
    updateLocation() // inmediato al activar
    intervalRef.current = setInterval(updateLocation, 15000) // cada 15s
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [active, updateLocation])

  return null // componente invisible
}
