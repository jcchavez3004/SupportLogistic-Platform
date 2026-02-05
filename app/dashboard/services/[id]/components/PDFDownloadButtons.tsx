'use client'

import { useState } from 'react'
import { FileText, Package, Loader2 } from 'lucide-react'
import dynamic from 'next/dynamic'

// Importación dinámica para evitar errores de SSR
const PDFGenerator = dynamic(() => import('./PDFGenerator'), {
  ssr: false,
  loading: () => null,
})

interface ServiceData {
  id: string
  pickup_address: string
  pickup_contact_name: string | null
  pickup_phone: string | null
  delivery_address: string
  delivery_contact_name: string | null
  delivery_phone: string | null
  observations: string | null
  status: string
  created_at: string
  clients: {
    company_name: string
    nit: string | null
    address: string | null
  } | null
  driver: {
    full_name: string | null
    phone: string | null
    vehicle_plate: string | null
  } | null
}

interface PDFDownloadButtonsProps {
  service: ServiceData
  serviceNumber: string
}

export function PDFDownloadButtons({
  service,
  serviceNumber,
}: PDFDownloadButtonsProps) {
  const [generating, setGenerating] = useState<'delivery' | 'transport' | null>(
    null
  )
  const [pdfType, setPdfType] = useState<'delivery' | 'transport' | null>(null)

  const handleGeneratePDF = (type: 'delivery' | 'transport') => {
    setGenerating(type)
    setPdfType(type)
  }

  const handlePDFReady = () => {
    setGenerating(null)
    setPdfType(null)
  }

  return (
    <>
      <button
        onClick={() => handleGeneratePDF('delivery')}
        disabled={generating !== null}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
      >
        {generating === 'delivery' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileText className="h-4 w-4" />
        )}
        Nota de Entrega
      </button>

      <button
        onClick={() => handleGeneratePDF('transport')}
        disabled={generating !== null}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
      >
        {generating === 'transport' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Package className="h-4 w-4" />
        )}
        Guía de Transporte
      </button>

      {pdfType && (
        <PDFGenerator
          type={pdfType}
          service={service}
          serviceNumber={serviceNumber}
          onReady={handlePDFReady}
        />
      )}
    </>
  )
}
