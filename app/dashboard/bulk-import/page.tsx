'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FileSpreadsheet, Upload, ArrowLeft, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { FileDropzone, type ParsedRow } from './components/FileDropzone'
import { DataPreview } from './components/DataPreview'
import { ImportProgress } from './components/ImportProgress'
import { processBulkImport, checkZoneServiceEnabled } from './actions'

type ImportStatus = 'idle' | 'importing' | 'success' | 'error'

export default function BulkImportPage() {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)
  const [parsedData, setParsedData] = useState<ParsedRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [importStatus, setImportStatus] = useState<ImportStatus>('idle')
  const [importProgress, setImportProgress] = useState(0)
  const [importMessage, setImportMessage] = useState('')

  // Verificar autorización al cargar
  useEffect(() => {
    async function checkAuth() {
      try {
        const { enabled } = await checkZoneServiceEnabled()
        setIsAuthorized(enabled)
      } catch {
        setIsAuthorized(false)
      }
    }
    checkAuth()
  }, [])

  const handleDataParsed = useCallback((data: ParsedRow[]) => {
    setParsedData(data)
    setError(null)
    setImportStatus('idle')
  }, [])

  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage)
    setParsedData([])
  }, [])

  const handleImport = useCallback(async () => {
    if (parsedData.length === 0) return

    setImportStatus('importing')
    setImportProgress(0)
    setImportMessage('Preparando importación...')

    try {
      // Simular progreso visual mientras se procesa
      const progressInterval = setInterval(() => {
        setImportProgress(prev => Math.min(prev + Math.random() * 10, 90))
      }, 200)

      const result = await processBulkImport(parsedData)

      clearInterval(progressInterval)

      if (result.success) {
        setImportProgress(result.count)
        setImportStatus('success')
        setImportMessage(`Se han creado ${result.count} servicios. Puedes verlos en la sección de Servicios.`)
      } else {
        setImportStatus('error')
        setImportMessage(result.error || 'Error desconocido')
      }
    } catch (err) {
      setImportStatus('error')
      setImportMessage(err instanceof Error ? err.message : 'Error al procesar la importación')
    }
  }, [parsedData])

  const handleReset = useCallback(() => {
    setParsedData([])
    setError(null)
    setImportStatus('idle')
    setImportProgress(0)
    setImportMessage('')
  }, [])

  // Loading state
  if (isAuthorized === null) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent" />
      </div>
    )
  }

  // No autorizado
  if (!isAuthorized) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-amber-600" />
          </div>
          <h2 className="text-xl font-bold text-amber-900 mb-2">
            Acceso Restringido
          </h2>
          <p className="text-amber-700 mb-6">
            Esta funcionalidad solo está disponible para clientes con el 
            <span className="font-semibold"> Servicio por Zonas </span>
            habilitado.
          </p>
          <Link
            href="/dashboard/services"
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Servicios
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <FileSpreadsheet className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Importador Masivo</h1>
          </div>
          <p className="text-sm text-gray-500">
            Carga tu archivo Excel con los servicios a crear. Zonificación automática incluida.
          </p>
        </div>
        
        <Link
          href="/dashboard/services"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Servicios
        </Link>
      </div>

      {/* Progreso de importación */}
      <ImportProgress
        status={importStatus}
        progress={importProgress}
        total={parsedData.length}
        message={importMessage}
        onReset={handleReset}
      />

      {/* Zona de Drag & Drop */}
      {importStatus !== 'success' && (
        <FileDropzone onDataParsed={handleDataParsed} onError={handleError} />
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-800">Error al procesar el archivo</p>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Vista Previa */}
      {parsedData.length > 0 && importStatus !== 'success' && (
        <>
          <DataPreview data={parsedData} maxRows={50} />

          {/* Botón de Importar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-xl border border-gray-200 p-4">
            <div>
              <p className="font-medium text-gray-900">
                ¿Todo listo para importar?
              </p>
              <p className="text-sm text-gray-500">
                Se crearán {parsedData.length} servicios con estado &quot;Solicitado&quot;
              </p>
            </div>
            <button
              onClick={handleImport}
              disabled={importStatus === 'importing'}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/25"
            >
              <Upload className="h-5 w-5" />
              {importStatus === 'importing' ? 'Importando...' : `Importar ${parsedData.length} Servicios`}
            </button>
          </div>
        </>
      )}

      {/* Instrucciones */}
      {parsedData.length === 0 && importStatus !== 'success' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">📋 Instrucciones</h3>
          <ol className="space-y-3 text-sm text-gray-600">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-bold">1</span>
              <span>Prepara tu archivo Excel con las columnas: <strong>Destinatario, Direccion, Telefono, Localidad, Observaciones</strong></span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-bold">2</span>
              <span>Arrastra el archivo a la zona de carga o haz clic para seleccionarlo</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-bold">3</span>
              <span>Revisa la vista previa y verifica que la zonificación automática sea correcta</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-bold">4</span>
              <span>Haz clic en &quot;Importar&quot; para crear todos los servicios</span>
            </li>
          </ol>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-800 mb-2">🗺️ Zonas Automáticas</h4>
            <p className="text-sm text-gray-600 mb-2">
              El sistema asigna automáticamente la zona según la localidad:
            </p>
            <div className="flex flex-wrap gap-2">
              {['Suba', 'Usaquén', 'Chapinero', 'Kennedy', 'Bosa', 'Engativá', 'Fontibón', 'Teusaquillo'].map((loc) => (
                <span key={loc} className="px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-600">
                  {loc}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
