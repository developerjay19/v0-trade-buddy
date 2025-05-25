"use client"

import { useSearchParams } from "next/navigation"
import { useEffect } from "react"
import { useTrading } from "@/lib/trading-context"
import { EnhancedGraphPanel } from "@/components/enhanced-graph-panel"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart3 } from "lucide-react"

export default function ChartsPage() {
  const { stocks, selectedStock, selectStock } = useTrading()
  const searchParams = useSearchParams()

  useEffect(() => {
    const stockId = searchParams.get("stock")
    if (stockId) {
      selectStock(stockId)
    } else if (stocks.length > 0 && !selectedStock) {
      selectStock(stocks[0].id)
    }
  }, [searchParams, selectStock, stocks, selectedStock])

  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="container py-6 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Stock Charts</h1>
          <p className="text-gray-600">Real-time price charts and technical analysis</p>
        </div>

        {/* Stock Selection */}
        <Card className="mb-6 shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
            <CardTitle>Select Stock</CardTitle>
            <CardDescription className="text-indigo-100">Choose a stock to view its detailed chart</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Select value={selectedStock?.id || ""} onValueChange={(value) => selectStock(value)}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Choose a stock to analyze" />
              </SelectTrigger>
              <SelectContent>
                {stocks.map((stock) => (
                  <SelectItem key={stock.id} value={stock.id}>
                    <div className="flex justify-between items-center w-full">
                      <span className="font-medium">{stock.name}</span>
                      <span className="text-blue-600 font-bold ml-4">₹{stock.currentValue.toFixed(2)}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Chart Panel */}
        {selectedStock ? (
          <EnhancedGraphPanel stock={selectedStock} />
        ) : (
          <Card className="shadow-lg border-0">
            <CardContent className="flex items-center justify-center h-[600px]">
              <div className="text-center">
                <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Stock Selected</h3>
                <p className="text-gray-600">Select a stock from the dropdown above to view its chart</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
