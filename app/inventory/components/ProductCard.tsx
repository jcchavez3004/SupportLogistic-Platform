import Link from 'next/link'
import Image from 'next/image'
import { Package, ArrowRight } from 'lucide-react'
import { StockIndicator } from './StockIndicator'
import type { InventoryProduct } from '../actions'

interface ProductCardProps {
  product: InventoryProduct
  isStaff: boolean
}

export function ProductCard({ product, isStaff }: ProductCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="aspect-square bg-gray-50 relative">
        {product.photo_url ? (
          <Image
            src={product.photo_url}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Package className="h-16 w-16 text-gray-200" />
          </div>
        )}
        {product.category && (
          <span className="absolute top-2 left-2 bg-white/90 backdrop-blur text-xs font-medium text-gray-600 px-2 py-0.5 rounded-full border border-gray-200">
            {product.category}
          </span>
        )}
      </div>

      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">
            {product.name}
          </h3>
          {(product.brand || product.model) && (
            <p className="text-xs text-gray-400 mt-0.5">
              {[product.brand, product.model].filter(Boolean).join(' · ')}
            </p>
          )}
          {product.sku && (
            <p className="text-[10px] text-gray-400 font-mono mt-0.5">SKU: {product.sku}</p>
          )}
        </div>

        <StockIndicator
          current={product.stock_current}
          minimum={product.stock_minimum}
          unit={product.unit}
        />

        {product.location && (
          <p className="text-[10px] text-gray-400">📍 {product.location}</p>
        )}

        <Link
          href={`/inventory/products/${product.id}`}
          className="flex items-center justify-center gap-1.5 w-full py-2 text-xs font-semibold text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
        >
          {isStaff ? 'Ver historial' : 'Ver detalle'} <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  )
}
