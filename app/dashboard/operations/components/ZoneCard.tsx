'use client'

import { useState, useTransition } from 'react'
import { Package, Truck, CheckCircle, Clock, AlertCircle, FileText, Loader2 } from 'lucide-react'
import { assignDriverToZone } from '../actions'
import type { ZoneSummary } from '../actions'

type Driver = {
  id: string
  full_name: string | null
  vehicle_plate: string | null
}

interface ZoneCardProps {
  zone: ZoneSummary
  drivers: Driver[]
  onPrintManifest: (zoneLabel: string) => void
}

export function ZoneCard({ zone, drivers, onPrintManifest }: ZoneCardProps) {
  const [selectedDriver, setSelectedDriver] = useState(zone.driver_id || '')
  const [isPending, startTransition] = useTransition()
  const [assignResult, setAssignResult] = useState<{ success: boolean; count: number } | null>(null)

  const handleAssign = () => {
    if (!selectedDriver) return

    startTransition(async () => {
      const result = await assignDriverToZone(zone.zone_label, selectedDriver)
      setAssignResult(result)
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setAssignResult(null), 3000)
    })
  }

  // Colores según estado
  const statusColors = {
    pending: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      header: 'bg-amber-100',
      badge: 'bg-amber-500',
      text: 'text-amber-900',
    },
    partial: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      header: 'bg-blue-100',
      badge: 'bg-blue-500',
      text: 'text-blue-900',
    },
    assigned: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      header: 'bg-green-100',
      badge: 'bg-green-500',
      text: 'text-green-900',
    },
  }

  const colors = statusColors[zone.status]

  const StatusIcon = zone.status === 'assigned' 
    ? CheckCircle 
    : zone.status === 'partial' 
    ? Clock 
    : AlertCircle

  return (
    <div className={`rounded-2xl border-2 ${colors.border} ${colors.bg} overflow-hidden transition-all hover:shadow-lg`}>
      {/* Header */}
      <div className={`px-5 py-4 ${colors.header}`}>
        <div className="flex items-center justify-between">
          <h3 className={`text-lg font-bold ${colors.text}`}>
            {zone.zone_label}
          </h3>
          <div className={`w-8 h-8 rounded-full ${colors.badge} flex items-center justify-center`}>
            <StatusIcon className="h-4 w-4 text-white" />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 space-y-4">
        {/* Contador de envíos */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center">
              <Package className="h-6 w-6 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{zone.total_count}</p>
              <p className="text-sm text-gray-500">Envíos totales</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="flex items-center gap-2 text-sm">
              <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full font-medium">
                {zone.pending_count} pendientes
              </span>
            </div>
            {zone.assigned_count > 0 && (
              <span className="text-xs text-green-600 mt-1 block">
                {zone.assigned_count} asignados
              </span>
            )}
          </div>
        </div>

        {/* Conductor actual */}
        {zone.driver_name && (
          <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-200">
            <Truck className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">Conductor:</span>
            <span className="text-sm font-medium text-gray-900">{zone.driver_name}</span>
          </div>
        )}

        {/* Selector de conductor */}
        {zone.pending_count > 0 && (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Asignar conductor a zona
            </label>
            <select
              value={selectedDriver}
              onChange={(e) => setSelectedDriver(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Seleccionar conductor...</option>
              {drivers.map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.full_name || 'Sin nombre'} {driver.vehicle_plate ? `(${driver.vehicle_plate})` : ''}
                </option>
              ))}
            </select>

            <button
              onClick={handleAssign}
              disabled={!selectedDriver || isPending}
              className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Asignando...
                </>
              ) : (
                <>
                  <Truck className="h-4 w-4" />
                  Asignar Zona Completa ({zone.pending_count})
                </>
              )}
            </button>
          </div>
        )}

        {/* Resultado de asignación */}
        {assignResult && (
          <div className={`p-3 rounded-lg text-sm ${
            assignResult.success 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {assignResult.success 
              ? `✓ ${assignResult.count} envíos asignados correctamente`
              : 'Error al asignar conductor'
            }
          </div>
        )}

        {/* Botón de manifiesto */}
        <button
          onClick={() => onPrintManifest(zone.zone_label)}
          className="w-full py-2.5 px-4 bg-white border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
        >
          <FileText className="h-4 w-4" />
          Imprimir Manifiesto
        </button>
      </div>
    </div>
  )
}
