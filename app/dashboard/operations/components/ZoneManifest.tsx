'use client'

import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer'
import type { ZoneService } from '../actions'

// Estilos del PDF
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottom: '2px solid #333',
    paddingBottom: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  metaItem: {
    fontSize: 9,
    color: '#888',
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderBottom: '1px solid #d1d5db',
    padding: 8,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #e5e7eb',
    padding: 8,
    minHeight: 35,
  },
  tableRowAlt: {
    backgroundColor: '#fafafa',
  },
  colCheck: {
    width: '5%',
    textAlign: 'center',
  },
  colNumber: {
    width: '10%',
  },
  colAddress: {
    width: '40%',
  },
  colRecipient: {
    width: '25%',
  },
  colPhone: {
    width: '20%',
  },
  checkbox: {
    width: 12,
    height: 12,
    border: '1px solid #333',
    marginTop: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    borderTop: '1px solid #ddd',
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 8,
    color: '#888',
  },
  signature: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  signatureBox: {
    width: '40%',
    textAlign: 'center',
  },
  signatureLine: {
    borderTop: '1px solid #333',
    marginTop: 40,
    paddingTop: 5,
  },
  signatureLabel: {
    fontSize: 9,
    color: '#666',
  },
  summary: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
  },
  summaryText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
})

interface ManifestPDFProps {
  zoneLabel: string
  services: ZoneService[]
  driverName?: string
}

// Componente del documento PDF
function ManifestDocument({ zoneLabel, services, driverName }: ManifestPDFProps) {
  const today = new Date().toLocaleDateString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>MANIFIESTO DE CARGA</Text>
          <Text style={styles.subtitle}>{zoneLabel}</Text>
          <View style={styles.meta}>
            <Text style={styles.metaItem}>Fecha: {today}</Text>
            <Text style={styles.metaItem}>Total envíos: {services.length}</Text>
            {driverName && <Text style={styles.metaItem}>Conductor: {driverName}</Text>}
          </View>
        </View>

        {/* Tabla */}
        <View style={styles.table}>
          {/* Header de tabla */}
          <View style={styles.tableHeader}>
            <Text style={styles.colCheck}>✓</Text>
            <Text style={styles.colNumber}># Guía</Text>
            <Text style={styles.colAddress}>Dirección de Entrega</Text>
            <Text style={styles.colRecipient}>Destinatario</Text>
            <Text style={styles.colPhone}>Teléfono</Text>
          </View>

          {/* Filas */}
          {services.map((service, index) => (
            <View 
              key={service.id} 
              style={[styles.tableRow, index % 2 === 1 && styles.tableRowAlt]}
            >
              <View style={styles.colCheck}>
                <View style={styles.checkbox} />
              </View>
              <Text style={styles.colNumber}>
                {service.service_number ? `#${service.service_number}` : '—'}
              </Text>
              <Text style={styles.colAddress}>{service.delivery_address || '—'}</Text>
              <Text style={styles.colRecipient}>{service.recipient_name || '—'}</Text>
              <Text style={styles.colPhone}>{service.recipient_phone || '—'}</Text>
            </View>
          ))}
        </View>

        {/* Resumen */}
        <View style={styles.summary}>
          <Text style={styles.summaryText}>
            Total de paquetes a entregar: {services.length}
          </Text>
        </View>

        {/* Firmas */}
        <View style={styles.signature}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine}>
              <Text style={styles.signatureLabel}>Firma Despachador</Text>
            </View>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine}>
              <Text style={styles.signatureLabel}>Firma Conductor</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>SupportLogistic - Sistema de Gestión</Text>
          <Text style={styles.footerText}>Generado: {new Date().toLocaleString('es-CO')}</Text>
        </View>
      </Page>
    </Document>
  )
}

interface ZoneManifestProps {
  zoneLabel: string
  services: ZoneService[]
  driverName?: string
  onClose: () => void
}

export function ZoneManifest({ zoneLabel, services, driverName, onClose }: ZoneManifestProps) {
  const fileName = `Manifiesto_${zoneLabel.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          Manifiesto de Zona
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          {zoneLabel} - {services.length} envíos
        </p>

        {/* Vista previa mini */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4 max-h-60 overflow-y-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b">
                <th className="text-left py-1">Guía</th>
                <th className="text-left py-1">Destinatario</th>
                <th className="text-left py-1">Dirección</th>
              </tr>
            </thead>
            <tbody>
              {services.slice(0, 10).map((s) => (
                <tr key={s.id} className="border-b border-gray-200">
                  <td className="py-1">#{s.service_number || '—'}</td>
                  <td className="py-1 truncate max-w-[100px]">{s.recipient_name || '—'}</td>
                  <td className="py-1 truncate max-w-[150px]">{s.delivery_address || '—'}</td>
                </tr>
              ))}
              {services.length > 10 && (
                <tr>
                  <td colSpan={3} className="py-2 text-center text-gray-500">
                    ... y {services.length - 10} más
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
          
          <PDFDownloadLink
            document={<ManifestDocument zoneLabel={zoneLabel} services={services} driverName={driverName} />}
            fileName={fileName}
            className="flex-1 py-2.5 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors text-center"
          >
            {({ loading }) => (loading ? 'Generando...' : 'Descargar PDF')}
          </PDFDownloadLink>
        </div>
      </div>
    </div>
  )
}
