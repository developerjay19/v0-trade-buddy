"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { useTrading } from "@/lib/trading-context"
import { TradingSheet } from "@/components/trading-sheet"
import { StockListSheet } from "@/components/stock-list-sheet"
import { HoldingsSheet } from "@/components/holdings-sheet"
import { CreateStockModal } from "@/components/create-stock-modal"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Pagination } from "@/components/pagination"
import { TrendingUp, TrendingDown, BarChart3, Users, DollarSign, Target, ArrowRight } from "lucide-react"

const STOCKS_PER_PAGE = 6

export default function HomePage() {
  const { stocks, selectedStock, updatePrices, selectStock, user } = useTrading()
  const searchParams = useSearchParams()
  const [currentPage, setCurrentPage] = useState(1)

  // Select stock from URL parameter
  useEffect(() => {
    const stockId = searchParams.get("stock")
    if (stockId) {
      selectStock(stockId)
    }
  }, [searchParams, selectStock])

  // Update prices based on settings
  useEffect(() => {
    const getSettings = () => {
      const savedSettings = localStorage.getItem("marketSettings")
      if (savedSettings) {
        const settings = JSON.parse(savedSettings)
        return {
          updateInterval: (settings.updateInterval || 5) * 1000,
          autoUpdate: settings.autoUpdate !== false,
        }
      }
      return { updateInterval: 5000, autoUpdate: true }
    }

    const settings = getSettings()
    let interval: NodeJS.Timeout

    if (settings.autoUpdate) {
      interval = setInterval(() => {
        updatePrices()
      }, settings.updateInterval)
    }

    // Listen for settings changes
    const handleSettingsChange = (event: CustomEvent) => {
      if (interval) clearInterval(interval)
      const newSettings = event.detail
      if (newSettings.autoUpdate) {
        interval = setInterval(() => {
          updatePrices()
        }, newSettings.updateInterval * 1000)
      }
    }

    window.addEventListener("settingsChanged", handleSettingsChange as EventListener)

    return () => {
      if (interval) clearInterval(interval)
      window.removeEventListener("settingsChanged", handleSettingsChange as EventListener)
    }
  }, [updatePrices])

  // Check for stop loss and target price triggers
  useEffect(() => {
    const checkOrderTriggers = () => {
      const pendingOrders = localStorage.getItem("pendingOrders")
      if (!pendingOrders) return

      const orders = JSON.parse(pendingOrders)
      const triggeredOrders = []
      const remainingOrders = []

      for (const order of orders) {
        const stock = stocks.find((s) => s.id === order.stockId)
        if (!stock) {
          remainingOrders.push(order)
          continue
        }

        let triggered = false

        // Check stop loss
        if (order.stopLoss !== null) {
          if (
            (order.type === "buy" && stock.currentValue <= order.stopLoss) ||
            (order.type === "sell" && stock.currentValue >= order.stopLoss)
          ) {
            triggeredOrders.push({ ...order, triggerType: "stop_loss", currentPrice: stock.currentValue })
            triggered = true
          }
        }

        // Check target price
        if (!triggered && order.target !== null) {
          if (
            (order.type === "buy" && stock.currentValue >= order.target) ||
            (order.type === "sell" && stock.currentValue <= order.target)
          ) {
            triggeredOrders.push({ ...order, triggerType: "target", currentPrice: stock.currentValue })
            triggered = true
          }
        }

        if (!triggered) {
          remainingOrders.push(order)
        }
      }

      // Execute triggered orders
      if (triggeredOrders.length > 0) {
        // Save remaining orders
        localStorage.setItem("pendingOrders", JSON.stringify(remainingOrders))

        // Execute each triggered order
        for (const order of triggeredOrders) {
          if (order.type === "buy") {
            // For buy orders, execute sell at current price
            const { sellStock } = useTrading.getState()
            sellStock(order.stockId, order.quantity, order.currentPrice)
          } else {
            // For sell orders, execute buy at current price
            const { buyStock } = useTrading.getState()
            buyStock(order.stockId, order.quantity, order.currentPrice)
          }

          // Show notification (in a real app)
          console.log(
            `Order triggered: ${order.triggerType} for ${order.stockId}, ${order.quantity} shares at ${order.currentPrice}`,
          )
        }
      }
    }

    // Check triggers whenever stocks update
    checkOrderTriggers()
  }, [stocks])

  const calculatePriceChange = (stock: any) => {
    if (stock.history.length < 2) return { change: 0, percentage: 0 }

    const current = stock.currentValue
    const previous = stock.history[stock.history.length - 2]?.price || stock.initialValue
    const change = current - previous
    const percentage = (change / previous) * 100

    return { change, percentage }
  }

  // Pagination logic
  const totalPages = Math.ceil(stocks.length / STOCKS_PER_PAGE)
  const startIndex = (currentPage - 1) * STOCKS_PER_PAGE
  const endIndex = startIndex + STOCKS_PER_PAGE
  const currentStocks = stocks.slice(startIndex, endIndex)

  const totalMarketCap = stocks.reduce((sum, stock) => sum + stock.currentValue * stock.totalShares, 0)
  const totalStocks = stocks.length
  const activeTraders = 1 // Simulated

  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 text-white py-16">
        <div className="container px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Learn Trading with{" "}
              <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                Dummy Account
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8 leading-relaxed">
              Master the art of stock trading in a risk-free environment. Practice with real market dynamics without
              losing real money.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <CreateStockModal />
              <Link href="/stocks">
                <Button
                  variant="outline"
                  className="bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm"
                >
                  View All Stocks
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Market Stats */}
      <section className="py-8 bg-white/50 backdrop-blur-sm border-b">
        <div className="container px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <DollarSign className="h-6 w-6 text-green-600 mr-2" />
                <span className="text-2xl font-bold text-gray-900">₹{totalMarketCap.toLocaleString()}</span>
              </div>
              <p className="text-gray-600">Total Market Cap</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <BarChart3 className="h-6 w-6 text-blue-600 mr-2" />
                <span className="text-2xl font-bold text-gray-900">{totalStocks}</span>
              </div>
              <p className="text-gray-600">Listed Stocks</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-6 w-6 text-purple-600 mr-2" />
                <span className="text-2xl font-bold text-gray-900">{activeTraders}</span>
              </div>
              <p className="text-gray-600">Active Traders</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Target className="h-6 w-6 text-orange-600 mr-2" />
                <span className="text-2xl font-bold text-gray-900">₹{user.balance.toFixed(0)}</span>
              </div>
              <p className="text-gray-600">Your Balance</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stock Overview */}
      <section className="py-8">
        <div className="container px-4">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Market Overview</h2>
              <p className="text-gray-600">Live stock prices and market movements</p>
            </div>
            <Link href="/stocks">
              <Button variant="outline" className="hidden md:flex">
                View All Stocks
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>

          {currentStocks.length > 0 ? (
            <>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
                {currentStocks.map((stock) => {
                  const priceChange = calculatePriceChange(stock)
                  const overallChange = {
                    change: stock.currentValue - stock.initialValue,
                    percentage: ((stock.currentValue - stock.initialValue) / stock.initialValue) * 100,
                  }

                  return (
                    <Card
                      key={stock.id}
                      className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white cursor-pointer"
                      onClick={() => selectStock(stock.id)}
                    >
                      <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white pb-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-xl font-bold">{stock.name}</CardTitle>
                            <CardDescription className="text-indigo-100">
                              {stock.name.toUpperCase().slice(0, 4)} • {stock.availableShares.toLocaleString()}{" "}
                              available
                            </CardDescription>
                          </div>
                          <Badge
                            variant={priceChange.change >= 0 ? "secondary" : "destructive"}
                            className={
                              priceChange.change >= 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                            }
                          >
                            {priceChange.change >= 0 ? "+" : ""}
                            {priceChange.percentage.toFixed(2)}%
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6 space-y-4">
                        {/* Current Price */}
                        <div className="text-center border-b pb-4">
                          <div className="text-3xl font-bold text-gray-900">₹{stock.currentValue.toFixed(2)}</div>
                          <div
                            className={`flex items-center justify-center gap-1 text-sm ${
                              priceChange.change >= 0 ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {priceChange.change >= 0 ? (
                              <TrendingUp className="h-4 w-4" />
                            ) : (
                              <TrendingDown className="h-4 w-4" />
                            )}
                            ₹{Math.abs(priceChange.change).toFixed(2)} ({Math.abs(priceChange.percentage).toFixed(2)}%)
                          </div>
                        </div>

                        {/* Key Metrics */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="text-xs text-gray-500 uppercase tracking-wide">Initial</div>
                            <div className="text-lg font-semibold text-gray-900">₹{stock.initialValue.toFixed(2)}</div>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="text-xs text-gray-500 uppercase tracking-wide">Market Cap</div>
                            <div className="text-lg font-semibold text-gray-900">
                              ₹{(stock.currentValue * stock.totalShares).toLocaleString()}
                            </div>
                          </div>
                        </div>

                        {/* Overall Performance */}
                        <div
                          className={`p-3 rounded-lg ${
                            overallChange.change >= 0
                              ? "bg-green-50 border border-green-200"
                              : "bg-red-50 border border-red-200"
                          }`}
                        >
                          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Since IPO</div>
                          <div
                            className={`flex items-center gap-2 ${
                              overallChange.change >= 0 ? "text-green-700" : "text-red-700"
                            }`}
                          >
                            {overallChange.change >= 0 ? (
                              <TrendingUp className="h-4 w-4" />
                            ) : (
                              <TrendingDown className="h-4 w-4" />
                            )}
                            <span className="font-semibold">
                              ₹{Math.abs(overallChange.change).toFixed(2)} (
                              {Math.abs(overallChange.percentage).toFixed(2)}%)
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* Pagination */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                className="mt-8"
              />
            </>
          ) : (
            <div className="text-center py-12">
              <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Stocks Available</h3>
              <p className="text-gray-600 mb-6">Create your first stock to start trading</p>
              <CreateStockModal />
            </div>
          )}
        </div>
      </section>

      {/* Trading Sheets */}
      <TradingSheet />
      <StockListSheet />
      <HoldingsSheet />
    </div>
  )
}
