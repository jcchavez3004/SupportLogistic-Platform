'use client'

import { useMemo } from 'react'
import { MapPin, User, Phone, FileText, Tag } from 'lucide-react'
import type { ParsedRow } from './FileDropzone'

// Reglas de zonificación (mismas que en el servidor)
const ZONE_RULES: { pattern: RegExp; zone: string; color: string }[] = [
  { pattern: /suba/i, zone: 'ZONA 1 - SUBA', color: 'bg-blue-100 text-blue-700' },
  { pattern: /usaqu[eé]n/i, zone: 'ZONA 2 - USAQUÉN', color: 'bg-green-100 text-green-700' },
  { pattern: /chapinero/i, zone: 'ZONA 3 - CHAPINERO', color: 'bg-purple-100 text-purple-700' },
  { pattern: /kennedy/i, zone: 'ZONA 4 - KENNEDY', color: 'bg-orange-100 text-orange-700' },
  { pattern: /bosa/i, zone: 'ZONA 5 - BOSA', color: 'bg-red-100 text-red-700' },
  { pattern: /engativ[aá]/i, zone: 'ZONA 6 - ENGATIVÁ', color: 'bg-yellow-100 text-yellow-700' },
  { pattern: /fontib[oó]n/i, zone: 'ZONA 7 - FONTIBÓN', color: 'bg-cyan-100 text-cyan-700' },
  { pattern: /teusaquillo/i, zone: 'ZONA 8 - TEUSAQUILLO', color: 'bg-pink-100 text-pink-700' },
  { pattern: /ciudad bol[ií]var/i, zone: 'ZONA 9 - CIUDAD BOLÍVAR', color: 'bg-amber-100 text-amber-700' },
  { pattern: /rafael uribe/i, zone: 'ZONA 10 - RAFAEL URIBE', color: 'bg-lime-100 text-lime-700' },
]

function getZoneInfo(localidad: string): { zone: string; color: string } {
  if (!localidad) return { zone: 'SIN ASIGNAR', color: 'bg-gray-100 text-gray-600' }
  
  for (const rule of ZONE_RULES) {
    if (rule.pattern.test(localidad)) {
      return { zone: rule.zone, color: rule.color }
    }
  }
  
  return { zone: 'SIN ASIGNAR', color: 'bg-gray-100 text-gray-600' }
}

interface DataPreviewProps {
  data: ParsedRow[]
  maxRows?: number
}

export function DataPreview({ data, maxRows = 50 }: DataPreviewProps) {
  const displayData = useMemo(() => data.slice(0, maxRows), [data, maxRows])
  
  const zoneSummary = useMemo(() => {
    const summary: Record<string, number> = {}
    data.forEach(row => {
      const { zone } = getZoneInfo(row.localidad)
      summary[zone] = (summary[zone] || 0) + 1
    })
    return Object.entries(summary).sort((a, b) => b[1] - a[1])
  }, [data])

  return (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-2xl font-bold text-gray-900">{data.length}</p>
          <p className="text-sm text-gray-500">Total registros</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-2xl font-bold text-green-600">{zoneSummary.filter(([z]) => z !== 'SIN ASIGNAR').length}</p>
          <p className="text-sm text-gray-500">Zonas detectadas</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-2xl font-bold text-blue-600">{data.filter(r => r.telefono).length}</p>
          <p className="text-sm text-gray-500">Con teléfono</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-2xl font-bold text-amber-600">{data.filter(r => r.observaciones).length}</p>
          <p className="text-sm text-gray-500">Con observaciones</p>
        </div>
      </div>

      {/* Distribución por zonas */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
          <Tag className="h-4 w-4" />
          Distribución por Zonas
        </h3>
        <div className="flex flex-wrap gap-2">
          {zoneSummary.map(([zone, count]) => {
            const { color } = ZONE_RULES.find(r => r.zone === zone) || { color: 'bg-gray-100 text-gray-600' }
            return (
              <span
                key={zone}
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${color}`}
              >
                {zone}: {count}
              </span>
            )
          })}
        </div>
      </div>

      {/* Vista previa de datos */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-900">
            Vista Previa {data.length > maxRows && `(mostrando ${maxRows} de ${data.length})`}
          </h3>
        </div>
        
        {/* Vista móvil: Cards */}
        <div className="block md:hidden divide-y divide-gray-100">
          {displayData.map((row, idx) => {
            const { zone, color } = getZoneInfo(row.localidad)
            return (
              <div key={idx} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">#{idx + 1}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${color}`}>
                    {zone}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="font-medium text-gray-900 truncate">{row.destinatario || '—'}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                  <span className="text-sm text-gray-600">{row.direccion || '—'}</span>
                </div>
                {row.telefono && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{row.telefono}</span>
                  </div>
                )}
                {row.observaciones && (
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-gray-400 mt-0.5" />
                    <span className="text-sm text-gray-500 italic">{row.observaciones}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Vista desktop: Tabla */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Destinatario</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dirección</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teléfono</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Localidad</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Zona Asignada</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Observaciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayData.map((row, idx) => {
                const { zone, color } = getZoneInfo(row.localidad)
                return (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-400">{idx + 1}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 max-w-[150px] truncate">
                      {row.destinatario || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px] truncate">
                      {row.direccion || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {row.telefono || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {row.localidad || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${color}`}>
                        {zone}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 max-w-[150px] truncate">
                      {row.observaciones || '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
