'use client'

import { useCallback, useState } from 'react'
import { Upload, FileSpreadsheet, X, AlertCircle } from 'lucide-react'
import * as XLSX from 'xlsx'

export interface ParsedRow {
  // Nuevas columnas principales del Excel
  origen: string
  destino: string
  fecha: string
  tipo_vehiculo: string
  descripcion: string
  referencia: string
  // Campos opcionales heredados del formato anterior
  destinatario: string
  direccion: string
  telefono: string
  localidad: string
  observaciones: string
}

interface FileDropzoneProps {
  onDataParsed: (data: ParsedRow[]) => void
  onError: (error: string) => void
}

function normalizeHeader(header: string): string {
  return header
    // Eliminar BOM y caracteres invisibles que Excel inyecta
    .replace(/[\uFEFF\u200B\u200C\u200D\u00A0]/g, '')
    // Normalizar unicode y eliminar tildes/diacríticos
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Lowercase y trim
    .toLowerCase()
    .trim()
    // Puntuación y separadores → espacio
    .replace(/[\.\,\;\:\(\)\[\]\{\}\-_\/\\]/g, ' ')
    // Colapsar espacios múltiples
    .replace(/\s+/g, ' ')
    .trim()
}

// Mapeo de nombres de columnas (flexibilidad para variaciones)
const COLUMN_MAPPINGS: Record<string, keyof ParsedRow> = {
  // Origen
  'origen': 'origen',
  'origin': 'origen',
  'ciudad origen': 'origen',
  'direccion origen': 'origen',
  'dir origen': 'origen',
  // Destino
  'destino': 'destino',
  'destination': 'destino',
  'ciudad destino': 'destino',
  // Fecha
  'fecha': 'fecha',
  'date': 'fecha',
  'fecha servicio': 'fecha',
  'fecha programada': 'fecha',
  'fecha de servicio': 'fecha',
  // Tipo de vehículo — variantes críticas
  'tipo vehiculo': 'tipo_vehiculo',
  'tipo de vehiculo': 'tipo_vehiculo',
  'vehiculo': 'tipo_vehiculo',
  'vehicle type': 'tipo_vehiculo',
  'vehicle': 'tipo_vehiculo',
  'tipo de vehiculo requerido': 'tipo_vehiculo',
  // Descripción
  'descripcion': 'descripcion',
  'description': 'descripcion',
  'detalle': 'descripcion',
  'detalles': 'descripcion',
  'contenido': 'descripcion',
  // Referencia
  'referencia': 'referencia',
  'reference': 'referencia',
  'ref': 'referencia',
  'pedido': 'referencia',
  'orden': 'referencia',
  'numero referencia': 'referencia',
  // Destinatario
  'destinatario': 'destinatario',
  'nombre': 'destinatario',
  'nombre destinatario': 'destinatario',
  'cliente': 'destinatario',
  'recipient': 'destinatario',
  'nombre receptor': 'destinatario',
  // Dirección
  'direccion': 'direccion',
  'direccion entrega': 'direccion',
  'direccion de entrega': 'direccion',
  'address': 'direccion',
  // Teléfono (legado)
  'telefono': 'telefono',
  'celular': 'telefono',
  'phone': 'telefono',
  'tel': 'telefono',
  // Localidad (legado — se usa para zone_label automático)
  'localidad': 'localidad',
  'zona': 'localidad',
  'barrio': 'localidad',
  'sector': 'localidad',
  // Observaciones (legado)
  'observaciones': 'observaciones',
  'observacion': 'observaciones',
  'notas': 'observaciones',
  'comentarios': 'observaciones',
  'notes': 'observaciones',
}

export function FileDropzone({ onDataParsed, onError }: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const processFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      onError('Solo se permiten archivos Excel (.xlsx, .xls)')
      return
    }

    setIsProcessing(true)
    setFileName(file.name)

    try {
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })
      
      // Tomar la primera hoja
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      
      // Convertir a JSON
      const rawData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { 
        defval: '',
        raw: false,
      })

      if (rawData.length === 0) {
        onError('El archivo está vacío o no tiene datos válidos')
        setIsProcessing(false)
        return
      }

      // Mapear columnas
      const headers = Object.keys(rawData[0])
      const columnMap: Record<string, keyof ParsedRow> = {}

      console.log('[bulk-import] Headers detectadas:', headers)

      headers.forEach((header) => {
        const normalized = normalizeHeader(header)
        if (COLUMN_MAPPINGS[normalized]) {
          columnMap[header] = COLUMN_MAPPINGS[normalized]
        }
      })

      console.log('[bulk-import] Mapeo de columnas:', columnMap)

      // Verificar columnas requeridas (por NOMBRE de cabecera normalizado).
      // Solo se exigen: Origen, Destino y Fecha. La columna de Tipo de Vehiculo
      // se mapea si existe, pero ya no es obligatoria.
      const normalizedHeaders = headers.map((h) => normalizeHeader(h))
      const requiredHeaderNames = ['origen', 'destino', 'fecha']
      const missingRequired = requiredHeaderNames.filter(
        (req) => !normalizedHeaders.includes(req)
      )

      // DEBUG TEMPORAL — remover tras confirmar fix
      console.log('[FileDropzone debug]', {
        rawHeaders: headers,
        normalizedHeaders: headers.map(normalizeHeader),
        columnMapResult: columnMap,
      })

      if (missingRequired.length > 0) {
        console.log('[bulk-import] Columnas requeridas faltantes (por nombre):', missingRequired)
        onError(
          'Faltan columnas requeridas: Origen, Destino y Fecha. ' +
            `Columnas encontradas: ${headers.join(', ')}`
        )
        setIsProcessing(false)
        return
      }

      // Transformar datos
      const parsedData: ParsedRow[] = rawData.map((row) => {
        const parsed: ParsedRow = {
          origen: '',
          destino: '',
          fecha: '',
          tipo_vehiculo: '',
          descripcion: '',
          referencia: '',
          destinatario: '',
          direccion: '',
          telefono: '',
          localidad: '',
          observaciones: '',
        }

        Object.entries(row).forEach(([key, value]) => {
          const mappedKey = columnMap[key]
          if (mappedKey) {
            parsed[mappedKey] = String(value || '').trim()
          }
        })

        return parsed
      })

      // Filtrar filas vacías
      const validData = parsedData.filter(row => 
        row.destino || row.direccion || row.origen
      )

      if (validData.length === 0) {
        onError('No se encontraron filas con datos válidos')
        setIsProcessing(false)
        return
      }

      onDataParsed(validData)
    } catch (err) {
      console.error('Error processing file:', err)
      onError('Error al procesar el archivo. Verifica que sea un Excel válido.')
    } finally {
      setIsProcessing(false)
    }
  }, [onDataParsed, onError])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      processFile(file)
    }
  }, [processFile])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processFile(file)
    }
  }, [processFile])

  const clearFile = useCallback(() => {
    setFileName(null)
    onDataParsed([])
  }, [onDataParsed])

  if (isProcessing) {
    return (
      <div className="border-2 border-dashed border-indigo-300 rounded-2xl p-12 bg-indigo-50">
        <div className="flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent" />
          <p className="mt-4 text-sm font-medium text-indigo-700">
            Procesando {fileName}...
          </p>
        </div>
      </div>
    )
  }

  if (fileName) {
    return (
      <div className="border-2 border-green-300 rounded-2xl p-6 bg-green-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <FileSpreadsheet className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-green-900">{fileName}</p>
              <p className="text-sm text-green-600">Archivo cargado correctamente</p>
            </div>
          </div>
          <button
            onClick={clearFile}
            className="p-2 rounded-lg hover:bg-green-100 text-green-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-2xl p-12 transition-all cursor-pointer ${
        isDragging
          ? 'border-indigo-500 bg-indigo-50 scale-[1.02]'
          : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
      }`}
    >
      <label className="flex flex-col items-center justify-center cursor-pointer">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors ${
          isDragging ? 'bg-indigo-500' : 'bg-gray-100'
        }`}>
          <Upload className={`h-8 w-8 ${isDragging ? 'text-white' : 'text-gray-400'}`} />
        </div>
        
        <p className="text-lg font-medium text-gray-900 mb-1">
          {isDragging ? '¡Suelta el archivo aquí!' : 'Arrastra tu archivo Excel'}
        </p>
        <p className="text-sm text-gray-500 mb-4">
          o haz clic para seleccionar
        </p>
        
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <FileSpreadsheet className="h-4 w-4" />
          <span>Formatos soportados: .xlsx, .xls</span>
        </div>

        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileSelect}
          className="sr-only"
        />
      </label>

      {/* Columnas esperadas */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-start gap-2 text-xs text-gray-500">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-gray-600 mb-1">Columnas esperadas:</p>
            <p>Origen, Destino, Fecha, Tipo de Vehiculo, Descripcion, Referencia</p>
          </div>
        </div>
      </div>
    </div>
  )
}
