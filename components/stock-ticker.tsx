"use client"

import { useTrading } from "@/lib/trading-context"
import { TrendingUp, TrendingDown } from "lucide-react"

export function StockTicker() {
  const { stocks } = useTrading()

  const calculatePriceChange = (stock: any) => {
    if (stock.history.length < 2) return { change: 0, percentage: 0 }

    const current = stock.currentValue
    const previous = stock.history[stock.history.length - 2]?.price || stock.initialValue
    const change = current - previous
    const percentage = (change / previous) * 100

    return { change, percentage }
  }

  return (
    <div className="bg-gray-900 text-white py-2 overflow-hidden">
      <div className="animate-scroll flex gap-8 whitespace-nowrap">
        {stocks.map((stock) => {
          const priceChange = calculatePriceChange(stock)
          return (
            <div key={stock.id} className="flex items-center gap-2 min-w-max">
              <span className="font-semibold">{stock.name.toUpperCase()}</span>
              <span className="text-yellow-400">₹{stock.currentValue.toFixed(2)}</span>
              <span
                className={`flex items-center gap-1 text-sm ${
                  priceChange.change >= 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {priceChange.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {priceChange.change >= 0 ? "+" : ""}₹{priceChange.change.toFixed(2)} (
                {priceChange.percentage.toFixed(2)}%)
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
