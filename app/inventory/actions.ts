'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getCurrentProfile } from '@/utils/supabase/getCurrentProfile'
import { revalidatePath } from 'next/cache'

// ─── Tipos ───────────────────────────────────────────────────────────────────

export type InventoryProduct = {
  id: string
  client_id: string
  name: string
  description: string | null
  category: string | null
  brand: string | null
  model: string | null
  sku: string | null
  barcode: string | null
  internal_code: string | null
  stock_current: number
  stock_minimum: number
  unit: string
  location: string | null
  photo_url: string | null
  is_active: boolean
  notes: string | null
  created_at: string
}

export type InventoryMovement = {
  id: string
  product_id: string
  client_id: string
  type: 'ingreso' | 'salida' | 'ajuste_positivo' | 'ajuste_negativo' | 'devolucion'
  quantity: number
  stock_before: number
  stock_after: number
  reference: string | null
  notes: string | null
  scanned: boolean
  service_id: string | null
  registered_by: string | null
  created_at: string
  product?: { name: string; sku: string | null; barcode: string | null }
  registered_by_profile?: { full_name: string | null }
}

export type InventoryAlert = {
  id: string
  product_id: string
  client_id: string
  type: string
  message: string
  resolved: boolean
  created_at: string
  product?: { name: string; stock_current: number; stock_minimum: number }
}

export type InventoryStats = {
  total_products: number
  total_stock: number
  low_stock_count: number
  out_of_stock_count: number
  movements_today: number
  alerts_active: number
}

// ─── Guard ────────────────────────────────────────────────────────────────────

async function getProfileAndClient() {
  const profile = await getCurrentProfile()
  if (!profile) throw new Error('No autenticado')
  return profile
}

// ─── Dashboard stats ──────────────────────────────────────────────────────────

export async function getInventoryStats(clientId?: string): Promise<InventoryStats> {
  const supabase = await createClient()
  const profile = await getProfileAndClient()

  const targetClientId = clientId ?? profile.client_id ?? null

  if (!targetClientId) {
    return { total_products: 0, total_stock: 0, low_stock_count: 0,
             out_of_stock_count: 0, movements_today: 0, alerts_active: 0 }
  }

  const { data: products } = await supabase
    .from('inventory_products')
    .select('stock_current, stock_minimum')
    .eq('client_id', targetClientId)
    .eq('is_active', true)

  const today = new Date().toISOString().split('T')[0]
  const { count: movementsToday } = await supabase
    .from('inventory_movements')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', targetClientId)
    .gte('created_at', `${today}T00:00:00`)

  const { count: alertsActive } = await supabase
    .from('inventory_alerts')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', targetClientId)
    .eq('resolved', false)

  const prods = products ?? []
  return {
    total_products: prods.length,
    total_stock: prods.reduce((sum, p) => sum + p.stock_current, 0),
    low_stock_count: prods.filter(p => p.stock_current > 0 && p.stock_current <= p.stock_minimum).length,
    out_of_stock_count: prods.filter(p => p.stock_current === 0).length,
    movements_today: movementsToday ?? 0,
    alerts_active: alertsActive ?? 0,
  }
}

// ─── Productos ────────────────────────────────────────────────────────────────

export async function getInventoryProducts(clientId?: string): Promise<InventoryProduct[]> {
  const supabase = await createClient()
  const profile = await getProfileAndClient()
  const targetId = clientId ?? profile.client_id ?? ''

  const { data, error } = await supabase
    .from('inventory_products')
    .select('*')
    .eq('client_id', targetId)
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error) { console.error('[getInventoryProducts]', error); return [] }
  return (data ?? []) as InventoryProduct[]
}

export async function getProductById(productId: string): Promise<InventoryProduct | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('inventory_products')
    .select('*')
    .eq('id', productId)
    .single()

  if (error) { console.error('[getProductById]', error); return null }
  return data as InventoryProduct
}

export async function getProductByBarcode(
  barcode: string,
  clientId: string
): Promise<InventoryProduct | null> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('inventory_products')
    .select('*')
    .eq('client_id', clientId)
    .or(`barcode.eq.${barcode},internal_code.eq.${barcode},sku.eq.${barcode}`)
    .maybeSingle()

  return data as InventoryProduct | null
}

export async function createProduct(
  formData: FormData
): Promise<{ success: boolean; productId?: string; error?: string }> {
  const profile = await getProfileAndClient()
  if (!['super_admin', 'operador'].includes(profile.role)) {
    return { success: false, error: 'Sin permisos' }
  }

  const supabase = await createClient()

  const barcode = (formData.get('barcode') as string)?.trim() || null
  const internalCode = barcode
    ? null
    : `SL-${Date.now().toString(36).toUpperCase()}`

  const clientId = (formData.get('client_id') as string)?.trim()

  const { data, error } = await supabase
    .from('inventory_products')
    .insert({
      client_id:     clientId,
      name:          (formData.get('name') as string)?.trim(),
      description:   (formData.get('description') as string)?.trim() || null,
      category:      (formData.get('category') as string)?.trim() || null,
      brand:         (formData.get('brand') as string)?.trim() || null,
      model:         (formData.get('model') as string)?.trim() || null,
      sku:           (formData.get('sku') as string)?.trim() || null,
      barcode,
      internal_code: internalCode,
      stock_minimum: parseInt(formData.get('stock_minimum') as string) || 0,
      unit:          (formData.get('unit') as string)?.trim() || 'unidad',
      location:      (formData.get('location') as string)?.trim() || null,
      notes:         (formData.get('notes') as string)?.trim() || null,
      created_by:    profile.id,
    })
    .select('id')
    .single()

  if (error) {
    console.error('[createProduct]', error)
    return { success: false, error: error.message }
  }

  const photoFile = formData.get('photo') as File | null
  if (photoFile && photoFile.size > 0 && data?.id) {
    const adminClient = createAdminClient()
    const ext = photoFile.type.includes('png') ? 'png' : 'jpg'
    const path = `${clientId}/${data.id}.${ext}`
    const bytes = await photoFile.arrayBuffer()
    const { error: uploadError } = await adminClient.storage
      .from('inventory-photos')
      .upload(path, bytes, { contentType: photoFile.type, upsert: true })

    if (!uploadError) {
      const { data: urlData } = adminClient.storage
        .from('inventory-photos')
        .getPublicUrl(path)
      await supabase
        .from('inventory_products')
        .update({ photo_url: urlData.publicUrl })
        .eq('id', data.id)
    }
  }

  revalidatePath('/inventory')
  return { success: true, productId: data?.id }
}

// ─── Movimientos ──────────────────────────────────────────────────────────────

export async function registerMovement(params: {
  productId: string
  clientId: string
  type: InventoryMovement['type']
  quantity: number
  reference?: string
  notes?: string
  scanned?: boolean
  serviceId?: string
}): Promise<{ success: boolean; error?: string }> {
  const profile = await getProfileAndClient()
  if (!['super_admin', 'operador'].includes(profile.role)) {
    return { success: false, error: 'Solo el staff de SupportLogistic puede registrar movimientos.' }
  }

  const supabase = await createClient()

  const { data: product } = await supabase
    .from('inventory_products')
    .select('stock_current, name, stock_minimum')
    .eq('id', params.productId)
    .single()

  if (!product) return { success: false, error: 'Producto no encontrado.' }

  const stockBefore = product.stock_current
  let stockAfter: number

  switch (params.type) {
    case 'ingreso':
    case 'ajuste_positivo':
    case 'devolucion':
      stockAfter = stockBefore + params.quantity
      break
    case 'salida':
    case 'ajuste_negativo':
      stockAfter = stockBefore - params.quantity
      if (stockAfter < 0) {
        return { success: false, error: `Stock insuficiente. Disponible: ${stockBefore}` }
      }
      break
    default:
      stockAfter = stockBefore
  }

  const { error } = await supabase
    .from('inventory_movements')
    .insert({
      product_id:    params.productId,
      client_id:     params.clientId,
      type:          params.type,
      quantity:      params.quantity,
      stock_before:  stockBefore,
      stock_after:   stockAfter,
      reference:     params.reference ?? null,
      notes:         params.notes ?? null,
      scanned:       params.scanned ?? false,
      service_id:    params.serviceId ?? null,
      registered_by: profile.id,
    })

  if (error) {
    console.error('[registerMovement]', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/inventory')
  return { success: true }
}

export async function getMovements(
  clientId: string,
  limit = 50,
  productId?: string
): Promise<InventoryMovement[]> {
  const supabase = await createClient()

  let query = supabase
    .from('inventory_movements')
    .select(`
      *,
      product:product_id ( name, sku, barcode ),
      registered_by_profile:registered_by ( full_name )
    `)
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (productId) query = query.eq('product_id', productId)

  const { data, error } = await query
  if (error) { console.error('[getMovements]', error); return [] }
  return (data ?? []) as unknown as InventoryMovement[]
}

export async function getAlerts(clientId: string): Promise<InventoryAlert[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('inventory_alerts')
    .select(`
      *,
      product:product_id ( name, stock_current, stock_minimum )
    `)
    .eq('client_id', clientId)
    .eq('resolved', false)
    .order('created_at', { ascending: false })

  if (error) { console.error('[getAlerts]', error); return [] }
  return (data ?? []) as unknown as InventoryAlert[]
}

export async function resolveAlert(alertId: string): Promise<{ success: boolean }> {
  const supabase = await createClient()
  await supabase
    .from('inventory_alerts')
    .update({ resolved: true })
    .eq('id', alertId)
  revalidatePath('/inventory/alerts')
  return { success: true }
}

export async function getClientsForInventory() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('clients')
    .select('id, company_name')
    .order('company_name')
  return data ?? []
}
