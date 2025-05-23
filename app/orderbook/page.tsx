"use client"
import Link from "next/link"
import { useTrading } from "@/lib/trading-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart3, Home, PlusCircle, Package, TrendingUp, TrendingDown } from "lucide-react"
import { format } from "date-fns"

export default function OrderBookPage() {
  const { user, stocks } = useTrading()

  const getStockName = (stockId: string) => {
    const stock = stocks.find((s) => s.id === stockId)
    return stock?.name || "Unknown Stock"
  }

  const groupedTransactions = user.transactions.reduce(
    (acc, transaction) => {
      const date = format(new Date(transaction.timestamp), "yyyy-MM-dd")
      if (!acc[date]) {
        acc[date] = []
      }
      acc[date].push(transaction)
      return acc
    },
    {} as Record<string, typeof user.transactions>,
  )

  const sortedDates = Object.keys(groupedTransactions).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

  const calculateDayPnL = (transactions: typeof user.transactions) => {
    return transactions.reduce((total, transaction) => {
      if (transaction.type === "sell") {
        return total + transaction.total
      } else {
        return total - transaction.total
      }
    }, 0)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl">
              <BarChart3 className="h-6 w-6" />
              <span>Trade Buddy</span>
            </Link>
            <nav className="hidden md:flex gap-6">
              <Link href="/" className="flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white">
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
              <Link href="/orderbook" className="flex items-center gap-2 text-sm font-medium text-white">
                <BarChart3 className="h-4 w-4" />
                Order Book
              </Link>
            </nav>
          </div>
        </div>
      </header>
      <main className="flex-1 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="container py-6 px-4">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Book</h1>
            <p className="text-gray-600">Complete history of your trading activities</p>
          </div>

          <Tabs defaultValue="all" className="space-y-6">
            <TabsList className="bg-white shadow-sm">
              <TabsTrigger value="all" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                All Orders
              </TabsTrigger>
              <TabsTrigger value="buy" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
                Buy Orders
              </TabsTrigger>
              <TabsTrigger value="sell" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
                Sell Orders
              </TabsTrigger>
              <TabsTrigger value="daily" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                Daily Summary
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <Card className="shadow-lg border-0">
                <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                  <CardTitle>All Transactions</CardTitle>
                  <CardDescription className="text-indigo-100">Complete trading history</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {user.transactions.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Date & Time</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Stock</th>
                            <th className="text-center py-3 px-4 font-semibold text-gray-700">Type</th>
                            <th className="text-right py-3 px-4 font-semibold text-gray-700">Quantity</th>
                            <th className="text-right py-3 px-4 font-semibold text-gray-700">Price</th>
                            <th className="text-right py-3 px-4 font-semibold text-gray-700">Total</th>
                            <th className="text-center py-3 px-4 font-semibold text-gray-700">Margin</th>
                          </tr>
                        </thead>
                        <tbody>
                          {user.transactions
                            .slice()
                            .reverse()
                            .map((transaction, index) => (
                              <tr
                                key={transaction.id}
                                className={`border-b hover:bg-gray-50 ${index % 2 === 0 ? "bg-white" : "bg-gray-25"}`}
                              >
                                <td className="py-3 px-4 text-sm text-gray-600">
                                  {format(new Date(transaction.timestamp), "MMM dd, yyyy HH:mm:ss")}
                                </td>
                                <td className="py-3 px-4 font-medium text-gray-900">
                                  {getStockName(transaction.stockId)}
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <Badge
                                    variant={transaction.type === "buy" ? "default" : "destructive"}
                                    className={`${
                                      transaction.type === "buy"
                                        ? "bg-green-100 text-green-800 hover:bg-green-200"
                                        : "bg-red-100 text-red-800 hover:bg-red-200"
                                    }`}
                                  >
                                    {transaction.type === "buy" ? (
                                      <TrendingUp className="h-3 w-3 mr-1" />
                                    ) : (
                                      <TrendingDown className="h-3 w-3 mr-1" />
                                    )}
                                    {transaction.type.toUpperCase()}
                                  </Badge>
                                </td>
                                <td className="py-3 px-4 text-right font-medium">{transaction.quantity}</td>
                                <td className="py-3 px-4 text-right font-medium">₹{transaction.price.toFixed(2)}</td>
                                <td className="py-3 px-4 text-right font-bold">₹{transaction.total.toFixed(2)}</td>
                                <td className="py-3 px-4 text-center">
                                  <Badge variant="outline">{transaction.margin}x</Badge>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">No Transactions Yet</h3>
                      <p className="text-gray-600">Start trading to see your order history</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="buy">
              <Card className="shadow-lg border-0">
                <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                  <CardTitle>Buy Orders</CardTitle>
                  <CardDescription className="text-green-100">All your purchase transactions</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {user.transactions.filter((t) => t.type === "buy").length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-green-50">
                          <tr>
                            <th className="text-left py-3 px-4 font-semibold text-green-700">Date & Time</th>
                            <th className="text-left py-3 px-4 font-semibold text-green-700">Stock</th>
                            <th className="text-right py-3 px-4 font-semibold text-green-700">Quantity</th>
                            <th className="text-right py-3 px-4 font-semibold text-green-700">Price</th>
                            <th className="text-right py-3 px-4 font-semibold text-green-700">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {user.transactions
                            .filter((t) => t.type === "buy")
                            .slice()
                            .reverse()
                            .map((transaction, index) => (
                              <tr
                                key={transaction.id}
                                className={`border-b hover:bg-green-25 ${index % 2 === 0 ? "bg-white" : "bg-green-25"}`}
                              >
                                <td className="py-3 px-4 text-sm text-gray-600">
                                  {format(new Date(transaction.timestamp), "MMM dd, yyyy HH:mm:ss")}
                                </td>
                                <td className="py-3 px-4 font-medium text-gray-900">
                                  {getStockName(transaction.stockId)}
                                </td>
                                <td className="py-3 px-4 text-right font-medium">{transaction.quantity}</td>
                                <td className="py-3 px-4 text-right font-medium">₹{transaction.price.toFixed(2)}</td>
                                <td className="py-3 px-4 text-right font-bold text-green-600">
                                  ₹{transaction.total.toFixed(2)}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">No Buy Orders</h3>
                      <p className="text-gray-600">You haven't made any purchases yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sell">
              <Card className="shadow-lg border-0">
                <CardHeader className="bg-gradient-to-r from-red-500 to-rose-600 text-white">
                  <CardTitle>Sell Orders</CardTitle>
                  <CardDescription className="text-red-100">All your sale transactions</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {user.transactions.filter((t) => t.type === "sell").length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-red-50">
                          <tr>
                            <th className="text-left py-3 px-4 font-semibold text-red-700">Date & Time</th>
                            <th className="text-left py-3 px-4 font-semibold text-red-700">Stock</th>
                            <th className="text-right py-3 px-4 font-semibold text-red-700">Quantity</th>
                            <th className="text-right py-3 px-4 font-semibold text-red-700">Price</th>
                            <th className="text-right py-3 px-4 font-semibold text-red-700">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {user.transactions
                            .filter((t) => t.type === "sell")
                            .slice()
                            .reverse()
                            .map((transaction, index) => (
                              <tr
                                key={transaction.id}
                                className={`border-b hover:bg-red-25 ${index % 2 === 0 ? "bg-white" : "bg-red-25"}`}
                              >
                                <td className="py-3 px-4 text-sm text-gray-600">
                                  {format(new Date(transaction.timestamp), "MMM dd, yyyy HH:mm:ss")}
                                </td>
                                <td className="py-3 px-4 font-medium text-gray-900">
                                  {getStockName(transaction.stockId)}
                                </td>
                                <td className="py-3 px-4 text-right font-medium">{transaction.quantity}</td>
                                <td className="py-3 px-4 text-right font-medium">₹{transaction.price.toFixed(2)}</td>
                                <td className="py-3 px-4 text-right font-bold text-red-600">
                                  ₹{transaction.total.toFixed(2)}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <TrendingDown className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">No Sell Orders</h3>
                      <p className="text-gray-600">You haven't made any sales yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="daily">
              <div className="space-y-4">
                {sortedDates.map((date) => {
                  const dayTransactions = groupedTransactions[date]
                  const dayPnL = calculateDayPnL(dayTransactions)

                  return (
                    <Card key={date} className="shadow-lg border-0">
                      <CardHeader className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
                        <div className="flex justify-between items-center">
                          <div>
                            <CardTitle>{format(new Date(date), "EEEE, MMMM dd, yyyy")}</CardTitle>
                            <CardDescription className="text-purple-100">
                              {dayTransactions.length} transaction{dayTransactions.length !== 1 ? "s" : ""}
                            </CardDescription>
                          </div>
                          <div className={`text-right ${dayPnL >= 0 ? "text-green-200" : "text-red-200"}`}>
                            <div className="text-sm">Day P&L</div>
                            <div className="text-xl font-bold">
                              {dayPnL >= 0 ? "+" : ""}₹{dayPnL.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-purple-50">
                              <tr>
                                <th className="text-left py-3 px-4 font-semibold text-purple-700">Time</th>
                                <th className="text-left py-3 px-4 font-semibold text-purple-700">Stock</th>
                                <th className="text-center py-3 px-4 font-semibold text-purple-700">Type</th>
                                <th className="text-right py-3 px-4 font-semibold text-purple-700">Quantity</th>
                                <th className="text-right py-3 px-4 font-semibold text-purple-700">Price</th>
                                <th className="text-right py-3 px-4 font-semibold text-purple-700">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {dayTransactions.map((transaction, index) => (
                                <tr
                                  key={transaction.id}
                                  className={`border-b hover:bg-purple-25 ${index % 2 === 0 ? "bg-white" : "bg-purple-25"}`}
                                >
                                  <td className="py-3 px-4 text-sm text-gray-600">
                                    {format(new Date(transaction.timestamp), "HH:mm:ss")}
                                  </td>
                                  <td className="py-3 px-4 font-medium text-gray-900">
                                    {getStockName(transaction.stockId)}
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <Badge
                                      variant={transaction.type === "buy" ? "default" : "destructive"}
                                      className={`${
                                        transaction.type === "buy"
                                          ? "bg-green-100 text-green-800"
                                          : "bg-red-100 text-red-800"
                                      }`}
                                    >
                                      {transaction.type.toUpperCase()}
                                    </Badge>
                                  </td>
                                  <td className="py-3 px-4 text-right font-medium">{transaction.quantity}</td>
                                  <td className="py-3 px-4 text-right font-medium">₹{transaction.price.toFixed(2)}</td>
                                  <td className="py-3 px-4 text-right font-bold">₹{transaction.total.toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
                {sortedDates.length === 0 && (
                  <Card className="shadow-lg border-0">
                    <CardContent className="text-center py-12">
                      <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">No Trading History</h3>
                      <p className="text-gray-600">Start trading to see your daily summaries</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <div className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-white">
        <div className="grid grid-cols-5 gap-1 p-2">
          <Link href="/" className="flex flex-col items-center justify-center py-2 text-gray-600">
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
          <Link href="/orderbook" className="flex flex-col items-center justify-center py-2 text-blue-600">
            <BarChart3 className="h-5 w-5" />
            <span className="text-xs">Orders</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
