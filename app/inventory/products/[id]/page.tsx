import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { ArrowLeft, Package, MapPin, Tag, Barcode, Calendar } from 'lucide-react'
import { getCurrentProfile } from '@/utils/supabase/getCurrentProfile'
import { getProductById, getMovements } from '../../actions'
import { StockIndicator } from '../../components/StockIndicator'
import { MovementBadge } from '../../components/MovementBadge'
import { ProductStockChart } from './ProductStockChart'

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login')

  const product = await getProductById(id)
  if (!product) redirect('/inventory/products')

  const movements = await getMovements(product.client_id, 30, product.id)

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      {/* Back */}
      <Link href="/inventory/products" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" /> Volver al catálogo
      </Link>

      {/* Product header */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Photo */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="aspect-square bg-gray-50 relative">
            {product.photo_url ? (
              <Image src={product.photo_url} alt={product.name} fill className="object-cover" sizes="400px" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Package className="h-24 w-24 text-gray-200" />
              </div>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
            {product.description && <p className="text-sm text-gray-500 mt-1">{product.description}</p>}
          </div>

          <StockIndicator current={product.stock_current} minimum={product.stock_minimum} unit={product.unit} />

          <div className="grid grid-cols-2 gap-4 text-sm">
            {product.category && (
              <div className="flex items-center gap-2 text-gray-600">
                <Tag className="h-4 w-4 text-gray-400" /> {product.category}
              </div>
            )}
            {product.location && (
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="h-4 w-4 text-gray-400" /> {product.location}
              </div>
            )}
            {(product.barcode || product.internal_code) && (
              <div className="flex items-center gap-2 text-gray-600">
                <Barcode className="h-4 w-4 text-gray-400" />
                <span className="font-mono text-xs">{product.barcode || product.internal_code}</span>
              </div>
            )}
            {product.sku && (
              <div className="flex items-center gap-2 text-gray-600">
                <Tag className="h-4 w-4 text-gray-400" />
                <span className="font-mono text-xs">SKU: {product.sku}</span>
              </div>
            )}
            {(product.brand || product.model) && (
              <div className="flex items-center gap-2 text-gray-600">
                <Package className="h-4 w-4 text-gray-400" />
                {[product.brand, product.model].filter(Boolean).join(' · ')}
              </div>
            )}
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="h-4 w-4 text-gray-400" />
              Registrado: {new Date(product.created_at).toLocaleDateString('es-CO')}
            </div>
          </div>

          {product.notes && (
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1">Notas</p>
              <p className="text-sm text-gray-600">{product.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Stock chart */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-4">Tendencia de stock (últimos 30 movimientos)</h2>
        <ProductStockChart movements={movements} />
      </div>

      {/* Movement history */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-4">Historial de movimientos</h2>
        {movements.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Sin movimientos registrados.</p>
        ) : (
          <div className="space-y-3">
            {movements.map((m) => (
              <div key={m.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <MovementBadge type={m.type} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400">
                    {m.reference ?? '—'} · {m.registered_by_profile?.full_name ?? 'Sistema'}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-bold ${
                    ['ingreso', 'ajuste_positivo', 'devolucion'].includes(m.type) ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {['ingreso', 'ajuste_positivo', 'devolucion'].includes(m.type) ? '+' : '−'}{m.quantity}
                  </span>
                  <p className="text-[10px] text-gray-400">{m.stock_before} → {m.stock_after}</p>
                </div>
                <p className="text-[10px] text-gray-300 w-14 text-right">
                  {new Date(m.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
