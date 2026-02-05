'use client'

import { useState, useCallback } from 'react'
import { MapPin, Package, RefreshCw } from 'lucide-react'
import { ZoneCard } from './ZoneCard'
import { ZoneManifest } from './ZoneManifest'
import { getZoneServices, type ZoneSummary, type ZoneService } from '../actions'

type Driver = {
  id: string
  full_name: string | null
  vehicle_plate: string | null
}

interface OperationsClientProps {
  zones: ZoneSummary[]
  drivers: Driver[]
}

export function OperationsClient({ zones, drivers }: OperationsClientProps) {
  const [manifestData, setManifestData] = useState<{
    zoneLabel: string
    services: ZoneService[]
    driverName?: string
  } | null>(null)
  const [isLoadingManifest, setIsLoadingManifest] = useState(false)

  const handlePrintManifest = useCallback(async (zoneLabel: string) => {
    setIsLoadingManifest(true)
    try {
      const services = await getZoneServices(zoneLabel)
      const zone = zones.find(z => z.zone_label === zoneLabel)
      setManifestData({
        zoneLabel,
        services,
        driverName: zone?.driver_name || undefined,
      })
    } catch (error) {
      console.error('Error loading manifest:', error)
      alert('Error al cargar los datos del manifiesto')
    } finally {
      setIsLoadingManifest(false)
    }
  }, [zones])

  const handleCloseManifest = useCallback(() => {
    setManifestData(null)
  }, [])

  if (zones.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <MapPin className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No hay zonas activas
        </h3>
        <p className="text-gray-500 max-w-md mx-auto">
          No se encontraron envíos zonificados pendientes. Los envíos aparecerán aquí cuando 
          se importen con el módulo de Importación Masiva o se creen con tipo &quot;Servicio por Zonas&quot;.
        </p>
      </div>
    )
  }

  // Separar zonas por estado
  const pendingZones = zones.filter(z => z.status === 'pending')
  const partialZones = zones.filter(z => z.status === 'partial')
  const assignedZones = zones.filter(z => z.status === 'assigned')

  return (
    <>
      {/* Loading overlay para manifiesto */}
      {isLoadingManifest && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl p-6 flex items-center gap-3 shadow-xl">
            <RefreshCw className="h-5 w-5 animate-spin text-indigo-600" />
            <span className="font-medium">Cargando manifiesto...</span>
          </div>
        </div>
      )}

      {/* Modal de manifiesto */}
      {manifestData && (
        <ZoneManifest
          zoneLabel={manifestData.zoneLabel}
          services={manifestData.services}
          driverName={manifestData.driverName}
          onClose={handleCloseManifest}
        />
      )}

      {/* Zonas pendientes */}
      {pendingZones.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <h2 className="text-lg font-semibold text-gray-900">
              Zonas Pendientes ({pendingZones.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingZones.map((zone) => (
              <ZoneCard
                key={zone.zone_label}
                zone={zone}
                drivers={drivers}
                onPrintManifest={handlePrintManifest}
              />
            ))}
          </div>
        </section>
      )}

      {/* Zonas parciales */}
      {partialZones.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <h2 className="text-lg font-semibold text-gray-900">
              Zonas Parcialmente Asignadas ({partialZones.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {partialZones.map((zone) => (
              <ZoneCard
                key={zone.zone_label}
                zone={zone}
                drivers={drivers}
                onPrintManifest={handlePrintManifest}
              />
            ))}
          </div>
        </section>
      )}

      {/* Zonas asignadas */}
      {assignedZones.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <h2 className="text-lg font-semibold text-gray-900">
              Zonas Completamente Asignadas ({assignedZones.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assignedZones.map((zone) => (
              <ZoneCard
                key={zone.zone_label}
                zone={zone}
                drivers={drivers}
                onPrintManifest={handlePrintManifest}
              />
            ))}
          </div>
        </section>
      )}

      {/* Leyenda */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-amber-100 border-2 border-amber-300" />
            <span className="text-gray-600">Pendiente de asignación</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-100 border-2 border-blue-300" />
            <span className="text-gray-600">Parcialmente asignado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-100 border-2 border-green-300" />
            <span className="text-gray-600">Completamente asignado</span>
          </div>
        </div>
      </div>
    </>
  )
}
