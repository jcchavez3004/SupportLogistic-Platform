import { ExternalLink, Download, FileWarning, CheckCircle2, Clock } from 'lucide-react'
import type { DriverDoc } from '@/app/dashboard/drivers/actions'

const DOC_ICONS: Record<DriverDoc['key'], string> = {
  doc_cedula: '🪪',
  doc_licencia: '🚗',
  doc_arl: '🛡️',
}

interface DriverDocsViewerProps {
  docs: DriverDoc[]
  driverName: string | null
}

export function DriverDocsViewer({ docs, driverName }: DriverDocsViewerProps) {
  const hasAnyDoc = docs.some((d) => d.exists)

  if (!hasAnyDoc) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <FileWarning className="h-10 w-10 text-gray-300 mb-3" />
        <p className="text-sm text-gray-500">
          El conductor aún no tiene documentos registrados
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {driverName && (
        <p className="text-xs text-gray-400">
          Documentos de <span className="font-medium text-gray-600">{driverName}</span>
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {docs.map((doc) => (
          <div
            key={doc.key}
            className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5"
          >
            <span className="text-base" role="img" aria-label={doc.label}>
              {DOC_ICONS[doc.key]}
            </span>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-700 truncate">
                {doc.label}
              </p>
              {doc.exists ? (
                <span className="inline-flex items-center gap-1 text-xs text-green-600">
                  <CheckCircle2 className="h-3 w-3" />
                  Disponible
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="h-3 w-3" />
                  Pendiente
                </span>
              )}
            </div>

            {doc.exists && doc.url && (
              <div className="flex items-center gap-1">
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                  title="Ver"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <a
                  href={doc.url}
                  download
                  className="p-1.5 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-md transition-colors"
                  title="Descargar"
                >
                  <Download className="h-3.5 w-3.5" />
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
