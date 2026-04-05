/**
 * lib/notifications/index.ts
 * Orquestador central. Llama a email y WhatsApp en paralelo.
 * Nunca lanza errores — las notificaciones son fire-and-forget.
 */

import {
  notifyServiceCreatedToStaff,
  notifyServiceCreatedToClient,
  notifyServiceDelivered,
  notifyServiceNovedad,
  type ServiceNotificationData,
} from './email'

import {
  whatsappServiceCreated,
  whatsappServiceDelivered,
  whatsappNovedad,
} from './whatsapp'

export type { ServiceNotificationData }

/**
 * Servicio creado — notifica a staff (email + WhatsApp) y cliente (solo email)
 */
export async function sendServiceCreatedNotifications(
  data: ServiceNotificationData
) {
  await Promise.allSettled([
    notifyServiceCreatedToStaff(data),
    notifyServiceCreatedToClient(data),
    whatsappServiceCreated(data.serviceNumber, data.clientName, data.deliveryAddress),
  ])
}

/**
 * Servicio entregado — notifica a admin y cliente
 */
export async function sendServiceDeliveredNotifications(
  data: ServiceNotificationData
) {
  await Promise.allSettled([
    notifyServiceDelivered(data),
    whatsappServiceDelivered(data.serviceNumber, data.clientName),
  ])
}

/**
 * Novedad reportada — notifica solo a staff
 */
export async function sendNovedadNotifications(
  data: ServiceNotificationData,
  descripcion: string
) {
  await Promise.allSettled([
    notifyServiceNovedad(data, descripcion),
    whatsappNovedad(data.serviceNumber, data.clientName, descripcion),
  ])
}
