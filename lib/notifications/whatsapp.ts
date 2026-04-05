/**
 * lib/notifications/whatsapp.ts
 * Envío de mensajes WhatsApp via Twilio Sandbox.
 * Para producción: reemplazar número sandbox por número verificado.
 */

const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN
const FROM = process.env.TWILIO_WHATSAPP_FROM ?? 'whatsapp:+14155238886'

// Números que reciben notificaciones WhatsApp
const ADMIN_PHONE = 'whatsapp:+573144619967'  // jefedeoperaciones + soporteit

// ─── Helper: enviar mensaje ───────────────────────────────────────────────────

async function sendWhatsApp(to: string, body: string) {
  if (!TWILIO_SID || !TWILIO_TOKEN) {
    console.warn('[WhatsApp] Twilio no configurado — saltando notificación')
    return
  }

  try {
    const credentials = Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString('base64')
    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ From: FROM, To: to, Body: body }).toString(),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('[WhatsApp] Error Twilio:', error)
    } else {
      console.log('[WhatsApp] Mensaje enviado a:', to)
    }
  } catch (err) {
    console.error('[WhatsApp] Error inesperado:', err)
  }
}

// ─── Notificaciones ───────────────────────────────────────────────────────────

export async function whatsappServiceCreated(
  serviceNumber: number | string,
  clientName: string,
  deliveryAddress: string
) {
  const msg =
    `🚚 *NUEVO SERVICIO #${serviceNumber}*\n\n` +
    `👤 Cliente: ${clientName}\n` +
    `📍 Entrega: ${deliveryAddress}\n\n` +
    `Ver en: https://app.supportlogistic.co/dashboard/services`

  await sendWhatsApp(ADMIN_PHONE, msg)
}

export async function whatsappServiceDelivered(
  serviceNumber: number | string,
  clientName: string
) {
  const msg =
    `✅ *SERVICIO #${serviceNumber} ENTREGADO*\n\n` +
    `👤 Cliente: ${clientName}\n\n` +
    `Ver evidencia: https://app.supportlogistic.co/dashboard/services`

  await sendWhatsApp(ADMIN_PHONE, msg)
}

export async function whatsappNovedad(
  serviceNumber: number | string,
  clientName: string,
  descripcion: string
) {
  const msg =
    `⚠️ *NOVEDAD EN SERVICIO #${serviceNumber}*\n\n` +
    `👤 Cliente: ${clientName}\n` +
    `📝 Novedad: ${descripcion}\n\n` +
    `Gestionar: https://app.supportlogistic.co/dashboard/services`

  await sendWhatsApp(ADMIN_PHONE, msg)
}
