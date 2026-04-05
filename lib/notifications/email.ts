/**
 * lib/notifications/email.ts
 * Envío de emails transaccionales via Resend.
 * Dominio verificado: supportlogistic.co
 */

import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = process.env.NOTIFICATIONS_FROM_EMAIL ?? 'notificaciones@supportlogistic.co'
const ADMIN_EMAIL = process.env.NOTIFICATIONS_ADMIN_EMAIL ?? 'soporteit@supportlogistic.co'
const OPS_EMAIL = process.env.NOTIFICATIONS_OPS_EMAIL ?? 'jefedeoperaciones@supportlogistic.co'

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface ServiceNotificationData {
  serviceNumber: number | string
  clientName: string
  pickupAddress: string
  deliveryAddress: string
  deliveryContact?: string | null
  observations?: string | null
  serviceId: string
  clientEmail?: string | null
}

// ─── Helper: URL del servicio ─────────────────────────────────────────────────

function serviceUrl(serviceId: string) {
  return `https://app.supportlogistic.co/dashboard/services/${serviceId}`
}

// ─── Helper: enviar con manejo de errores ────────────────────────────────────

async function sendEmail(params: {
  to: string | string[]
  subject: string
  html: string
}) {
  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: params.to,
      subject: params.subject,
      html: params.html,
    })
    if (error) {
      console.error('[Email] Error enviando:', error)
    }
  } catch (err) {
    console.error('[Email] Error inesperado:', err)
  }
}

// ─── Template base ────────────────────────────────────────────────────────────

function baseTemplate(content: string, title: string) {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background:#f8fafc;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
        <tr><td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
            <!-- Header -->
            <tr>
              <td style="background:#1e40af;border-radius:12px 12px 0 0;padding:24px 32px;">
                <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">
                  SupportLogistic
                </h1>
                <p style="margin:4px 0 0;color:#bfdbfe;font-size:13px;">
                  Plataforma de Gestión Logística
                </p>
              </td>
            </tr>
            <!-- Content -->
            <tr>
              <td style="background:#ffffff;padding:32px;border-radius:0 0 12px 12px;
                         box-shadow:0 4px 6px rgba(0,0,0,0.07);">
                ${content}
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="padding:16px 0;text-align:center;">
                <p style="margin:0;color:#94a3b8;font-size:12px;">
                  © 2026 SupportLogistic · app.supportlogistic.co
                </p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
  `
}

function infoRow(label: string, value: string) {
  return `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;">
        <span style="color:#64748b;font-size:13px;">${label}</span><br>
        <span style="color:#1e293b;font-size:14px;font-weight:600;">${value}</span>
      </td>
    </tr>
  `
}

function actionButton(text: string, url: string, color = '#1e40af') {
  return `
    <div style="text-align:center;margin:24px 0 8px;">
      <a href="${url}"
         style="display:inline-block;background:${color};color:#ffffff;
                text-decoration:none;padding:12px 28px;border-radius:8px;
                font-size:14px;font-weight:600;">
        ${text}
      </a>
    </div>
  `
}

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICACIONES — SERVICIO CREADO
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Al operador y admin cuando se crea un nuevo servicio.
 */
export async function notifyServiceCreatedToStaff(data: ServiceNotificationData) {
  const html = baseTemplate(`
    <h2 style="margin:0 0 8px;color:#1e293b;font-size:20px;">
      🚚 Nuevo servicio solicitado
    </h2>
    <p style="margin:0 0 20px;color:#64748b;font-size:14px;">
      Se ha creado el servicio <strong>#${data.serviceNumber}</strong> y requiere gestión inmediata.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0">
      ${infoRow('Cliente', data.clientName)}
      ${infoRow('Dirección de recogida', data.pickupAddress)}
      ${infoRow('Dirección de entrega', data.deliveryAddress)}
      ${data.deliveryContact ? infoRow('Contacto entrega', data.deliveryContact) : ''}
      ${data.observations ? infoRow('Observaciones', data.observations) : ''}
    </table>
    ${actionButton('Ver servicio →', serviceUrl(data.serviceId))}
  `, `Nuevo servicio #${data.serviceNumber}`)

  await sendEmail({
    to: [OPS_EMAIL, ADMIN_EMAIL],
    subject: `🚚 Nuevo servicio #${data.serviceNumber} — ${data.clientName}`,
    html,
  })
}

/**
 * Al cliente cuando su servicio es creado.
 */
export async function notifyServiceCreatedToClient(data: ServiceNotificationData) {
  if (!data.clientEmail) return

  const html = baseTemplate(`
    <h2 style="margin:0 0 8px;color:#1e293b;font-size:20px;">
      ✅ Tu servicio fue registrado
    </h2>
    <p style="margin:0 0 20px;color:#64748b;font-size:14px;">
      Hemos recibido tu solicitud de servicio <strong>#${data.serviceNumber}</strong>.
      Nuestro equipo lo gestionará a la brevedad.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0">
      ${infoRow('Número de servicio', `#${data.serviceNumber}`)}
      ${infoRow('Dirección de recogida', data.pickupAddress)}
      ${infoRow('Dirección de entrega', data.deliveryAddress)}
      ${data.observations ? infoRow('Observaciones', data.observations) : ''}
    </table>
    ${actionButton('Rastrear mi servicio →', serviceUrl(data.serviceId), '#059669')}
  `, `Tu servicio #${data.serviceNumber} fue registrado`)

  await sendEmail({
    to: data.clientEmail,
    subject: `✅ Servicio #${data.serviceNumber} registrado — SupportLogistic`,
    html,
  })
}

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICACIONES — SERVICIO ENTREGADO
// ═══════════════════════════════════════════════════════════════════════════════

export async function notifyServiceDelivered(data: ServiceNotificationData) {
  const html = baseTemplate(`
    <h2 style="margin:0 0 8px;color:#059669;font-size:20px;">
      🎉 Servicio entregado exitosamente
    </h2>
    <p style="margin:0 0 20px;color:#64748b;font-size:14px;">
      El servicio <strong>#${data.serviceNumber}</strong> ha sido entregado.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0">
      ${infoRow('Cliente', data.clientName)}
      ${infoRow('Dirección de entrega', data.deliveryAddress)}
      ${data.deliveryContact ? infoRow('Recibido por', data.deliveryContact) : ''}
    </table>
    ${actionButton('Ver evidencia →', serviceUrl(data.serviceId), '#059669')}
  `, `Servicio #${data.serviceNumber} entregado`)

  const recipients: string[] = [ADMIN_EMAIL]
  if (data.clientEmail) recipients.push(data.clientEmail)

  await sendEmail({
    to: recipients,
    subject: `🎉 Servicio #${data.serviceNumber} entregado — ${data.clientName}`,
    html,
  })
}

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICACIONES — NOVEDAD
// ═══════════════════════════════════════════════════════════════════════════════

export async function notifyServiceNovedad(
  data: ServiceNotificationData,
  novedadDescripcion: string
) {
  const html = baseTemplate(`
    <h2 style="margin:0 0 8px;color:#dc2626;font-size:20px;">
      ⚠️ Novedad reportada en servicio
    </h2>
    <p style="margin:0 0 20px;color:#64748b;font-size:14px;">
      Se ha reportado una novedad en el servicio <strong>#${data.serviceNumber}</strong>.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0">
      ${infoRow('Cliente', data.clientName)}
      ${infoRow('Dirección de entrega', data.deliveryAddress)}
      ${infoRow('Descripción de la novedad', novedadDescripcion)}
    </table>
    ${actionButton('Gestionar novedad →', serviceUrl(data.serviceId), '#dc2626')}
  `, `⚠️ Novedad en servicio #${data.serviceNumber}`)

  await sendEmail({
    to: [OPS_EMAIL, ADMIN_EMAIL],
    subject: `⚠️ Novedad en servicio #${data.serviceNumber} — ${data.clientName}`,
    html,
  })
}
