'use client'

import { useEffect } from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from '@react-pdf/renderer'

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

interface PDFGeneratorProps {
  type: 'delivery' | 'transport'
  service: ServiceData
  serviceNumber: string
  onReady: () => void
}

// Estilos compartidos
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#1e40af',
  },
  logo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  logoSub: {
    color: '#f59e0b',
  },
  headerRight: {
    textAlign: 'right',
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  serviceNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e40af',
    marginTop: 4,
  },
  date: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 10,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  label: {
    width: 100,
    color: '#64748b',
    fontSize: 9,
  },
  value: {
    flex: 1,
    color: '#1e293b',
  },
  twoColumns: {
    flexDirection: 'row',
    gap: 20,
  },
  column: {
    flex: 1,
  },
  box: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 4,
    flexDirection: 'column',
    marginBottom: 10,
  },
  boxTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#475569',
    marginBottom: 2,
    marginTop: 6,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 10,
  },
  signatureArea: {
    flexDirection: 'row',
    marginTop: 40,
    gap: 40,
  },
  signatureBox: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingTop: 8,
    textAlign: 'center',
  },
  signatureLabel: {
    fontSize: 9,
    color: '#64748b',
  },
  status: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    padding: '4 8',
    borderRadius: 4,
    fontSize: 9,
    alignSelf: 'flex-start',
  },
  observations: {
    backgroundColor: '#fefce8',
    padding: 12,
    borderRadius: 4,
    marginTop: 10,
  },
  observationsTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#854d0e',
    marginBottom: 4,
  },
  observationsText: {
    fontSize: 9,
    color: '#713f12',
  },
})

// Documento: Nota de Entrega
function DeliveryNotePDF({
  service,
  serviceNumber,
}: {
  service: ServiceData
  serviceNumber: string
}) {
  const createdDate = new Date(service.created_at).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>
              Support<Text style={styles.logoSub}>Logistic</Text>
            </Text>
            <Text style={{ fontSize: 8, color: '#64748b', marginTop: 4 }}>
              Plataforma de Logística Integral
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.title}>NOTA DE ENTREGA</Text>
            <Text style={styles.serviceNumber}>{serviceNumber}</Text>
            <Text style={styles.date}>Fecha: {createdDate}</Text>
          </View>
        </View>

        {/* Cliente */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DATOS DEL CLIENTE</Text>
          <View style={styles.box}>
            <View style={styles.row}>
              <Text style={styles.label}>Empresa:</Text>
              <Text style={styles.value}>
                {service.clients?.company_name || '—'}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>NIT:</Text>
              <Text style={styles.value}>{service.clients?.nit || '—'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Dirección:</Text>
              <Text style={styles.value}>
                {service.clients?.address || '—'}
              </Text>
            </View>
          </View>
        </View>

        {/* Origen y Destino */}
        <View style={styles.twoColumns}>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>ORIGEN (RECOGIDA)</Text>
            <View style={styles.box}>
              <View style={styles.row}>
                <Text style={styles.label}>Dirección:</Text>
                <Text style={styles.value}>{service.pickup_address}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Contacto:</Text>
                <Text style={styles.value}>
                  {service.pickup_contact_name || '—'}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Teléfono:</Text>
                <Text style={styles.value}>{service.pickup_phone || '—'}</Text>
              </View>
            </View>
          </View>

          <View style={styles.column}>
            <Text style={styles.sectionTitle}>DESTINO (ENTREGA)</Text>
            <View style={styles.box}>
              <View style={styles.row}>
                <Text style={styles.label}>Dirección:</Text>
                <Text style={styles.value}>{service.delivery_address}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Contacto:</Text>
                <Text style={styles.value}>
                  {service.delivery_contact_name || '—'}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Teléfono:</Text>
                <Text style={styles.value}>
                  {service.delivery_phone || '—'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Observaciones */}
        {service.observations && (
          <View style={styles.observations}>
            <Text style={styles.observationsTitle}>OBSERVACIONES:</Text>
            <Text style={styles.observationsText}>{service.observations}</Text>
          </View>
        )}

        {/* Firmas */}
        <View style={styles.signatureArea}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Firma del Remitente</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Firma del Destinatario</Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          SupportLogistic © {new Date().getFullYear()} | Documento generado
          automáticamente | {serviceNumber}
        </Text>
      </Page>
    </Document>
  )
}

// Documento: Guía de Transporte
function TransportGuidePDF({
  service,
  serviceNumber,
}: {
  service: ServiceData
  serviceNumber: string
}) {
  const createdDate = new Date(service.created_at).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>
              Support<Text style={styles.logoSub}>Logistic</Text>
            </Text>
            <Text style={{ fontSize: 8, color: '#64748b', marginTop: 4 }}>
              Guía de Transporte Terrestre
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.title}>GUÍA DE TRANSPORTE</Text>
            <Text style={styles.serviceNumber}>{serviceNumber}</Text>
            <Text style={styles.date}>Fecha: {createdDate}</Text>
          </View>
        </View>

        {/* Info del Servicio */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>INFORMACIÓN DEL SERVICIO</Text>
          <View style={styles.box}>
            <View style={styles.row}>
              <Text style={styles.label}>N° Servicio:</Text>
              <Text style={[styles.value, { fontWeight: 'bold' }]}>
                {serviceNumber}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Estado:</Text>
              <Text style={styles.status}>{service.status.toUpperCase()}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Cliente:</Text>
              <Text style={styles.value}>
                {service.clients?.company_name || '—'}
              </Text>
            </View>
          </View>
        </View>

        {/* Conductor */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DATOS DEL CONDUCTOR</Text>
          <View style={styles.box}>
            <View style={styles.row}>
              <Text style={styles.label}>Nombre:</Text>
              <Text style={styles.value}>
                {service.driver?.full_name || 'Sin asignar'}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Teléfono:</Text>
              <Text style={styles.value}>{service.driver?.phone || '—'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Placa:</Text>
              <Text style={styles.value}>
                {service.driver?.vehicle_plate || '—'}
              </Text>
            </View>
          </View>
        </View>

        {/* Ruta */}
        <View style={styles.twoColumns}>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>PUNTO DE RECOGIDA</Text>
            <View style={styles.box}>
              <Text style={styles.boxTitle}>Dirección:</Text>
              <Text style={[styles.value, { marginBottom: 10 }]}>
                {service.pickup_address}
              </Text>
              <Text style={styles.boxTitle}>Contacto:</Text>
              <Text style={[styles.value, { marginBottom: 4 }]}>
                {service.pickup_contact_name || '—'}
              </Text>
              <Text style={styles.boxTitle}>Teléfono:</Text>
              <Text style={styles.value}>{service.pickup_phone || '—'}</Text>
            </View>
          </View>

          <View style={styles.column}>
            <Text style={styles.sectionTitle}>PUNTO DE ENTREGA</Text>
            <View style={styles.box}>
              <Text style={styles.boxTitle}>Dirección:</Text>
              <Text style={[styles.value, { marginBottom: 10 }]}>
                {service.delivery_address}
              </Text>
              <Text style={styles.boxTitle}>Contacto:</Text>
              <Text style={[styles.value, { marginBottom: 4 }]}>
                {service.delivery_contact_name || '—'}
              </Text>
              <Text style={styles.boxTitle}>Teléfono:</Text>
              <Text style={styles.value}>{service.delivery_phone || '—'}</Text>
            </View>
          </View>
        </View>

        {/* Observaciones */}
        {service.observations && (
          <View style={styles.observations}>
            <Text style={styles.observationsTitle}>
              INSTRUCCIONES ESPECIALES:
            </Text>
            <Text style={styles.observationsText}>{service.observations}</Text>
          </View>
        )}

        {/* Confirmación */}
        <View style={styles.signatureArea}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Firma del Conductor</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Sello de Recibido</Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          SupportLogistic © {new Date().getFullYear()} | Guía de Transporte
          Terrestre | {serviceNumber}
        </Text>
      </Page>
    </Document>
  )
}

// Componente principal que genera y abre el PDF
export default function PDFGenerator({
  type,
  service,
  serviceNumber,
  onReady,
}: PDFGeneratorProps) {
  useEffect(() => {
    const generateAndOpen = async () => {
      try {
        const doc =
          type === 'delivery' ? (
            <DeliveryNotePDF service={service} serviceNumber={serviceNumber} />
          ) : (
            <TransportGuidePDF service={service} serviceNumber={serviceNumber} />
          )

        const blob = await pdf(doc).toBlob()
        const url = URL.createObjectURL(blob)
        window.open(url, '_blank')

        // Limpiar URL después de un tiempo
        setTimeout(() => URL.revokeObjectURL(url), 10000)
      } catch (error) {
        console.error('Error generating PDF:', error)
      } finally {
        onReady()
      }
    }

    generateAndOpen()
  }, [type, service, serviceNumber, onReady])

  return null
}
