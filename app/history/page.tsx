"use client"
import { useState } from "react"
import { useTrading } from "@/lib/trading-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, TrendingDown, History, ArrowUp, ArrowDown } from "lucide-react"
import { format } from "date-fns"
import { Pagination } from "@/components/pagination"

export default function HistoryPage() {
  const { user, stocks } = useTrading()
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 20

  // Group transactions by stock
  const stockTransactions = user.transactions.reduce(
    (acc, transaction) => {
      if (!acc[transaction.stockId]) {
        acc[transaction.stockId] = []
      }
      acc[transaction.stockId].push(transaction)
      return acc
    },
    {} as Record<string, typeof user.transactions>,
  )

  // Calculate statistics for each stock
  const stockStats = Object.entries(stockTransactions)
    .map(([stockId, transactions]) => {
      const stock = stocks.find((s) => s.id === stockId)
      if (!stock) return null

      const buyTransactions = transactions.filter((t) => t.type === "buy")
      const sellTransactions = transactions.filter((t) => t.type === "sell")

      const totalBuyQuantity = buyTransactions.reduce((sum, t) => sum + t.quantity, 0)
      const totalSellQuantity = sellTransactions.reduce((sum, t) => sum + t.quantity, 0)
      const availableQuantity = totalBuyQuantity - totalSellQuantity

      const totalBuyValue = buyTransactions.reduce((sum, t) => sum + t.total, 0)
      const totalSellValue = sellTransactions.reduce((sum, t) => sum + t.total, 0)

      const avgBuyPrice = totalBuyQuantity > 0 ? totalBuyValue / totalBuyQuantity : 0
      const avgSellPrice = totalSellQuantity > 0 ? totalSellValue / totalSellQuantity : 0

      // Calculate realized P&L
      const realizedPnL = totalSellValue - (totalSellQuantity / totalBuyQuantity) * totalBuyValue

      // Calculate unrealized P&L
      const unrealizedPnL = availableQuantity > 0 ? availableQuantity * (stock.currentValue - avgBuyPrice) : 0

      // Calculate total P&L
      const totalPnL = realizedPnL + unrealizedPnL

      // Calculate growth percentage
      const initialInvestment = totalBuyValue - totalSellValue
      const growthPercentage = initialInvestment > 0 ? (totalPnL / initialInvestment) * 100 : 0

      // Find first buy and last sell dates
      const firstBuyDate = buyTransactions.length > 0 ? Math.min(...buyTransactions.map((t) => t.timestamp)) : 0

      const lastSellDate = sellTransactions.length > 0 ? Math.max(...sellTransactions.map((t) => t.timestamp)) : 0

      return {
        stockId,
        stockName: stock.name,
        totalBuyQuantity,
        totalSellQuantity,
        availableQuantity,
        avgBuyPrice,
        avgSellPrice,
        realizedPnL,
        unrealizedPnL,
        totalPnL,
        growthPercentage,
        firstBuyDate,
        lastSellDate,
        currentPrice: stock.currentValue,
      }
    })
    .filter(Boolean)

  // Sort by total P&L
  stockStats.sort((a, b) => (b?.totalPnL || 0) - (a?.totalPnL || 0))

  // Calculate overall account statistics
  const accountStats = {
    totalInvested: stockStats.reduce((sum, stat) => sum + (stat?.totalBuyQuantity || 0) * (stat?.avgBuyPrice || 0), 0),
    totalRealized: stockStats.reduce((sum, stat) => sum + (stat?.realizedPnL || 0), 0),
    totalUnrealized: stockStats.reduce((sum, stat) => sum + (stat?.unrealizedPnL || 0), 0),
    totalPnL: stockStats.reduce((sum, stat) => sum + (stat?.totalPnL || 0), 0),
    growthPercentage: 0,
  }

  accountStats.growthPercentage =
    accountStats.totalInvested > 0 ? (accountStats.totalPnL / accountStats.totalInvested) * 100 : 0

  // Pagination for transactions
  const paginatedTransactions = user.transactions
    .slice()
    .reverse()
    .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="container py-6 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Trading History</h1>
          <p className="text-gray-600">Complete analysis of your trading performance</p>
        </div>

        {/* Account Summary */}
        <Card className="mb-6 shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardTitle>Account Summary</CardTitle>
            <CardDescription className="text-blue-100">Overall trading performance</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="text-sm text-blue-600">Total Invested</div>
                <div className="text-2xl font-bold text-blue-800">₹{accountStats.totalInvested.toFixed(2)}</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="text-sm text-green-600">Realized P&L</div>
                <div
                  className={`text-2xl font-bold ${accountStats.totalRealized >= 0 ? "text-green-700" : "text-red-700"}`}
                >
                  {accountStats.totalRealized >= 0 ? "+" : ""}₹{accountStats.totalRealized.toFixed(2)}
                </div>
              </div>
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                <div className="text-sm text-amber-600">Unrealized P&L</div>
                <div
                  className={`text-2xl font-bold ${accountStats.totalUnrealized >= 0 ? "text-green-700" : "text-red-700"}`}
                >
                  {accountStats.totalUnrealized >= 0 ? "+" : ""}₹{accountStats.totalUnrealized.toFixed(2)}
                </div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <div className="text-sm text-purple-600">Account Growth</div>
                <div
                  className={`text-2xl font-bold flex items-center ${accountStats.totalPnL >= 0 ? "text-green-700" : "text-red-700"}`}
                >
                  {accountStats.totalPnL >= 0 ? (
                    <ArrowUp className="h-5 w-5 mr-1" />
                  ) : (
                    <ArrowDown className="h-5 w-5 mr-1" />
                  )}
                  {accountStats.growthPercentage.toFixed(2)}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="stocks" className="space-y-6">
          <TabsList className="bg-white shadow-sm">
            <TabsTrigger value="stocks" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Stock Performance
            </TabsTrigger>
            <TabsTrigger
              value="transactions"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
            >
              Transaction History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stocks">
            <div className="space-y-4">
              {stockStats.map((stat) => (
                <Card key={stat?.stockId} className="shadow-lg border-0">
                  <CardHeader
                    className={`${stat?.totalPnL && stat.totalPnL >= 0 ? "bg-gradient-to-r from-green-500 to-emerald-600" : "bg-gradient-to-r from-red-500 to-rose-600"} text-white`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>{stat?.stockName}</CardTitle>
                        <CardDescription className="text-white/80">
                          Current Price: ₹{stat?.currentPrice.toFixed(2)}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-white/80">Total P&L</div>
                        <div className="text-2xl font-bold flex items-center justify-end">
                          {stat?.totalPnL && stat.totalPnL >= 0 ? (
                            <TrendingUp className="h-5 w-5 mr-1" />
                          ) : (
                            <TrendingDown className="h-5 w-5 mr-1" />
                          )}
                          {stat?.totalPnL && stat.totalPnL >= 0 ? "+" : ""}₹{stat?.totalPnL.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <div className="text-sm text-gray-500">Avg. Buy Price</div>
                        <div className="text-lg font-semibold">₹{stat?.avgBuyPrice.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Avg. Sell Price</div>
                        <div className="text-lg font-semibold">
                          {stat?.avgSellPrice > 0 ? `₹${stat.avgSellPrice.toFixed(2)}` : "N/A"}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Total Quantity</div>
                        <div className="text-lg font-semibold">{stat?.totalBuyQuantity} shares</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Available Quantity</div>
                        <div className="text-lg font-semibold">{stat?.availableQuantity} shares</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                        <div className="text-sm text-green-600">Realized P&L</div>
                        <div
                          className={`text-lg font-semibold ${stat?.realizedPnL && stat.realizedPnL >= 0 ? "text-green-700" : "text-red-700"}`}
                        >
                          {stat?.realizedPnL && stat.realizedPnL >= 0 ? "+" : ""}₹{stat?.realizedPnL.toFixed(2)}
                        </div>
                      </div>
                      <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                        <div className="text-sm text-amber-600">Unrealized P&L</div>
                        <div
                          className={`text-lg font-semibold ${stat?.unrealizedPnL && stat.unrealizedPnL >= 0 ? "text-green-700" : "text-red-700"}`}
                        >
                          {stat?.unrealizedPnL && stat.unrealizedPnL >= 0 ? "+" : ""}₹{stat?.unrealizedPnL.toFixed(2)}
                        </div>
                      </div>
                      <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                        <div className="text-sm text-purple-600">Growth</div>
                        <div
                          className={`text-lg font-semibold flex items-center ${stat?.growthPercentage && stat.growthPercentage >= 0 ? "text-green-700" : "text-red-700"}`}
                        >
                          {stat?.growthPercentage && stat.growthPercentage >= 0 ? (
                            <ArrowUp className="h-4 w-4 mr-1" />
                          ) : (
                            <ArrowDown className="h-4 w-4 mr-1" />
                          )}
                          {stat?.growthPercentage.toFixed(2)}%
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <div className="text-sm text-gray-500">First Buy Date</div>
                        <div className="text-base font-medium">
                          {stat?.firstBuyDate ? format(new Date(stat.firstBuyDate), "MMM dd, yyyy HH:mm:ss") : "N/A"}
                        </div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <div className="text-sm text-gray-500">Last Sell Date</div>
                        <div className="text-base font-medium">
                          {stat?.lastSellDate ? format(new Date(stat.lastSellDate), "MMM dd, yyyy HH:mm:ss") : "N/A"}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {stockStats.length === 0 && (
                <Card className="shadow-lg border-0">
                  <CardContent className="text-center py-12">
                    <History className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Trading History</h3>
                    <p className="text-gray-600">Start trading to see your performance statistics</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="transactions">
            <Card className="shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                <CardTitle>Transaction History</CardTitle>
                <CardDescription className="text-indigo-100">Complete record of all your trades</CardDescription>
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
                        {paginatedTransactions.map((transaction, index) => (
                          <tr
                            key={transaction.id}
                            className={`border-b hover:bg-gray-50 ${index % 2 === 0 ? "bg-white" : "bg-gray-25"}`}
                          >
                            <td className="py-3 px-4 text-sm text-gray-600">
                              {format(new Date(transaction.timestamp), "MMM dd, yyyy HH:mm:ss")}
                            </td>
                            <td className="py-3 px-4 font-medium text-gray-900">{transaction.stockName}</td>
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
                    <Pagination
                      currentPage={currentPage}
                      totalPages={Math.ceil(user.transactions.length / ITEMS_PER_PAGE)}
                      onPageChange={setCurrentPage}
                      className="mt-6"
                    />
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <History className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Transactions Yet</h3>
                    <p className="text-gray-600">Start trading to see your transaction history</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
