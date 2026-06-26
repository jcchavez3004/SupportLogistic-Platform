'use server'

import { createClient } from '@/utils/supabase/server'
import { getCurrentProfile } from '@/utils/supabase/getCurrentProfile'

const AUDIFARMA_CLIENT_ID = '1024edc4-7f95-40e0-a9fc-a56bd8b75c77'

export type PaqueteRuta = {
  id: number
  tracking_number: string | null
  nombre_cliente: string | null
  direccion: string | null
  entregado: boolean | null
  hora_entrega: string | null
  bultos: number | null
  domiciliario: string | null
  sesion_id: number | string | null
  evidence_photo_1: string | null
  evidence_photo_2: string | null
  evidence_photo_3: string | null
  evidence_photo_4: string | null
  evidence_signature: string | null
  domiciliario_label: string | null
}

export async function searchPaquete(
  trackingNumber: string
): Promise<{ data: PaqueteRuta | null; error?: string }> {
  const profile = await getCurrentProfile()
  if (!profile) return { data: null, error: 'No autenticado' }

  const isStaff = ['super_admin', 'operador'].includes(profile.role)
  const isAudifarma = profile.client_id === AUDIFARMA_CLIENT_ID
  if (!isStaff && !isAudifarma) return { data: null, error: 'Sin permisos' }

  if (!trackingNumber.trim()) return { data: null, error: 'Ingresa un número de documento' }

  const supabase = await createClient()

  const { data, error } = await supabase
    .schema('enrutador')
    .from('paquetes_ruta')
    .select('id, tracking_number, nombre_cliente, direccion, entregado, hora_entrega, bultos, domiciliario, sesion_id, evidence_photo_1, evidence_photo_2, evidence_photo_3, evidence_photo_4, evidence_signature')
    .eq('tracking_number', trackingNumber.trim())
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('[searchPaquete]', error)
    return { data: null, error: 'Error al buscar el paquete' }
  }

  if (!data) return { data: null, error: 'No se encontró ningún paquete con ese número' }

  const paquete = data as PaqueteRuta

  // Construir etiqueta del domiciliario: "Domiciliario 4" o "Domiciliario 4 — Carlos"
  let domiciliarioLabel: string | null = null
  if (paquete.domiciliario) {
    const numeroStr = paquete.domiciliario.match(/\d+/)?.[0] ?? null
    domiciliarioLabel = `Domiciliario ${numeroStr ?? paquete.domiciliario}`

    if (numeroStr && paquete.sesion_id != null) {
      const { data: conductorData } = await supabase
        .schema('enrutador')
        .from('domiciliarios_sesion')
        .select('nombre')
        .eq('sesion_id', paquete.sesion_id)
        .eq('numero', parseInt(numeroStr, 10))
        .maybeSingle()

      if (conductorData?.nombre) {
        domiciliarioLabel = `Domiciliario ${numeroStr} — ${conductorData.nombre}`
      }
    }
  }

  paquete.domiciliario_label = domiciliarioLabel

  return { data: paquete }
}
