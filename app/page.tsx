"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { useTrading } from "@/lib/trading-context"
import { EnhancedGraphPanel } from "@/components/enhanced-graph-panel"
import { TradingSheet } from "@/components/trading-sheet"
import { StockTicker } from "@/components/stock-ticker"
import { Button } from "@/components/ui/button"
import { PlusCircle, BarChart3, Home, RefreshCcw, Package } from "lucide-react"

export default function HomePage() {
  const { selectedStock, updatePrices, resetAccount, selectStock } = useTrading()
  const searchParams = useSearchParams()

  // Select stock from URL parameter
  useEffect(() => {
    const stockId = searchParams.get("stock")
    if (stockId) {
      selectStock(stockId)
    }
  }, [searchParams, selectStock])

  // Update prices every 30 seconds to simulate market movement
  useEffect(() => {
    const interval = setInterval(() => {
      updatePrices()
    }, 30000)

    return () => clearInterval(interval)
  }, [updatePrices])

  return (
    <div className="flex min-h-screen flex-col">
      {/* Stock Ticker */}
      <StockTicker />

      <header className="border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl">
              <BarChart3 className="h-6 w-6" />
              <span>Trade Buddy</span>
            </Link>
            <nav className="hidden md:flex gap-6">
              <Link href="/" className="flex items-center gap-2 text-sm font-medium text-white">
                <Home className="h-4 w-4" />
                Trading
              </Link>
              <Link
                href="/create-stock"
                className="flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white"
              >
                <PlusCircle className="h-4 w-4" />
                Create Stock
              </Link>
              <Link
                href="/stocks"
                className="flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white"
              >
                <Package className="h-4 w-4" />
                All Stocks
              </Link>
              <Link
                href="/portfolio"
                className="flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white"
              >
                <BarChart3 className="h-4 w-4" />
                Portfolio
              </Link>
              <Link
                href="/orderbook"
                className="flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white"
              >
                <BarChart3 className="h-4 w-4" />
                Order Book
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={resetAccount}
              className="hidden md:flex text-white border-white/30 hover:bg-white/20"
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              Reset Account
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="container p-4 md:p-6">
          <EnhancedGraphPanel stock={selectedStock} />
        </div>
      </main>

      {/* Trading Sheet */}
      <TradingSheet />

      <div className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-white">
        <div className="grid grid-cols-5 gap-1 p-2">
          <Link href="/" className="flex flex-col items-center justify-center py-2 text-blue-600">
            <Home className="h-5 w-5" />
            <span className="text-xs">Trading</span>
          </Link>
          <Link href="/create-stock" className="flex flex-col items-center justify-center py-2 text-gray-600">
            <PlusCircle className="h-5 w-5" />
            <span className="text-xs">Create</span>
          </Link>
          <Link href="/stocks" className="flex flex-col items-center justify-center py-2 text-gray-600">
            <Package className="h-5 w-5" />
            <span className="text-xs">Stocks</span>
          </Link>
          <Link href="/portfolio" className="flex flex-col items-center justify-center py-2 text-gray-600">
            <BarChart3 className="h-5 w-5" />
            <span className="text-xs">Portfolio</span>
          </Link>
          <Link href="/orderbook" className="flex flex-col items-center justify-center py-2 text-gray-600">
            <BarChart3 className="h-5 w-5" />
            <span className="text-xs">Orders</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
