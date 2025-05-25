"use client"

import { useState } from "react"
import { useTrading } from "@/lib/trading-context"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Package, TrendingUp, TrendingDown, Search } from "lucide-react"

export function StockListSheet() {
  const { stocks, selectStock } = useTrading()
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const calculatePriceChange = (stock: any) => {
    if (stock.history.length < 2) return { change: 0, percentage: 0 }

    const current = stock.currentValue
    const previous = stock.history[stock.history.length - 2]?.price || stock.initialValue
    const change = current - previous
    const percentage = (change / previous) * 100

    return { change, percentage }
  }

  const filteredStocks = stocks.filter((stock) => stock.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const handleStockSelect = (stockId: string) => {
    selectStock(stockId)
    setIsOpen(false)
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="fixed bottom-4 left-4 z-50 bg-white hover:bg-gray-50 shadow-lg border-2">
          <Package className="h-4 w-4 mr-2" />
          Stocks ({stocks.length})
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-full sm:w-[400px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Stock Market
          </SheetTitle>
          <SheetDescription>Browse and select stocks to trade</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 mt-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search stocks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11"
            />
          </div>

          {/* Stock List */}
          <div className="space-y-3">
            {filteredStocks.length > 0 ? (
              filteredStocks.map((stock) => {
                const priceChange = calculatePriceChange(stock)
                return (
                  <div
                    key={stock.id}
                    onClick={() => handleStockSelect(stock.id)}
                    className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors bg-white shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">{stock.name}</h3>
                        <p className="text-sm text-gray-500">
                          {stock.name.toUpperCase().slice(0, 4)} • {stock.availableShares.toLocaleString()} available
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">₹{stock.currentValue.toFixed(2)}</div>
                        <div
                          className={`flex items-center gap-1 text-sm ${
                            priceChange.change >= 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {priceChange.change >= 0 ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          {priceChange.change >= 0 ? "+" : ""}₹{priceChange.change.toFixed(2)} (
                          {priceChange.percentage.toFixed(2)}%)
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex gap-2">
                        <Badge variant="outline" className="text-xs">
                          ₹{stock.initialValue} IPO
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {stock.totalShares.toLocaleString()} shares
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500">
                        Market Cap: ₹{(stock.currentValue * stock.totalShares).toLocaleString()}
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">
                  {searchTerm ? "No stocks found matching your search" : "No stocks available"}
                </p>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
