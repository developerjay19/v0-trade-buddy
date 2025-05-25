"use client"
import Link from "next/link"
import { useTrading } from "@/lib/trading-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { PlusCircle, TrendingDown, TrendingUp, Trash2, Users, Package } from "lucide-react"
import { CreateStockModal } from "@/components/create-stock-modal"

export default function StocksPage() {
  const { stocks, deleteStock, user } = useTrading()

  const getStockStats = (stockId: string) => {
    const holdings = user.holdings.filter((h) => h.stockId === stockId)
    const totalHeld = holdings.reduce((sum, h) => sum + h.quantity, 0)
    return { totalHeld }
  }

  const calculatePriceChange = (stock: any) => {
    if (stock.history.length < 2) return { change: 0, percentage: 0 }

    const current = stock.currentValue
    const previous = stock.history[stock.history.length - 2]?.price || stock.initialValue
    const change = current - previous
    const percentage = (change / previous) * 100

    return { change, percentage }
  }

  const calculateOverallChange = (stock: any) => {
    const change = stock.currentValue - stock.initialValue
    const percentage = (change / stock.initialValue) * 100
    return { change, percentage }
  }

  return (
    <main className="flex-1 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container py-6 px-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Stock Market Overview</h1>
            <p className="text-gray-600">Monitor all available stocks and their performance</p>
          </div>
          <CreateStockModal />
        </div>

        {stocks.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {stocks.map((stock) => {
              const priceChange = calculatePriceChange(stock)
              const overallChange = calculateOverallChange(stock)
              const stats = getStockStats(stock.id)

              return (
                <Card
                  key={stock.id}
                  className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white"
                >
                  <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white pb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl font-bold">{stock.name}</CardTitle>
                        <CardDescription className="text-indigo-100">
                          Stock Symbol: {stock.name.toUpperCase().slice(0, 4)}
                        </CardDescription>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Stock</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete {stock.name}? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteStock(stock.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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
                        <div className="text-xs text-gray-500 uppercase tracking-wide">Initial Price</div>
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
                      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Overall Performance</div>
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
                          ₹{Math.abs(overallChange.change).toFixed(2)} ({Math.abs(overallChange.percentage).toFixed(2)}
                          %)
                        </span>
                      </div>
                    </div>

                    {/* Stock Availability */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-blue-600" />
                        <div>
                          <div className="text-xs text-gray-500">Available</div>
                          <div className="font-semibold text-blue-600">{stock.availableShares.toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-purple-600" />
                        <div>
                          <div className="text-xs text-gray-500">Held</div>
                          <div className="font-semibold text-purple-600">{stats.totalHeld.toLocaleString()}</div>
                        </div>
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div className="pt-2 border-t">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Total Shares:</span>
                        <span className="font-medium">{stock.totalShares.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm mt-1">
                        <span className="text-gray-500">Price Evolution:</span>
                        <Badge variant="outline">{stock.priceEvolution}%</Badge>
                      </div>
                    </div>

                    {/* Action Button */}
                    <Link href={`/?stock=${stock.id}`} className="block">
                      <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                        Trade Now
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Stocks Available</h3>
            <p className="text-gray-600 mb-6">Create your first stock to start trading</p>
            <Button
              asChild
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Link href="/create-stock">
                <PlusCircle className="h-4 w-4 mr-2" />
                Create Stock
              </Link>
            </Button>
          </div>
        )}
      </div>
    </main>
  )
}
