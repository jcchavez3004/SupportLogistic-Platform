'use client'

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import type { InventoryMovement } from '../../actions'

interface ProductStockChartProps {
  movements: InventoryMovement[]
}

export function ProductStockChart({ movements }: ProductStockChartProps) {
  if (movements.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-8">Sin datos para graficar.</p>
  }

  const chartData = movements
    .slice()
    .reverse()
    .map((m) => ({
      date: new Date(m.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }),
      stock: m.stock_after,
    }))

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="stockGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
          <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
          <Tooltip
            contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '13px' }}
            labelStyle={{ fontWeight: 600 }}
          />
          <Area
            type="monotone"
            dataKey="stock"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="url(#stockGradient)"
            name="Stock"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
