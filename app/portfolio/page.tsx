"use client"

import { useState } from "react"
import Link from "next/link"
import { useTrading } from "@/lib/trading-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Pagination } from "@/components/pagination"
import { Edit, X, Target, BarChart3, DollarSign, Users, ArrowUp, ArrowDown } from "lucide-react"
import { format } from "date-fns"

export default function PortfolioPage() {
  const { stocks, user, editHolding, closePosition } = useTrading()
  const [activeTab, setActiveTab] = useState("holdings")
  const [holdingsPage, setHoldingsPage] = useState(1)
  const [historyPage, setHistoryPage] = useState(1)
  const [summaryPage, setSummaryPage] = useState(1)
  const ITEMS_PER_PAGE = 10

  // Calculate total portfolio value
  const calculatePortfolioValue = () => {
    return user.holdings
      .filter((h) => h.status === "open")
      .reduce((total, holding) => {
        const stock = stocks.find((s) => s.id === holding.stockId)
        if (stock) {
          return total + Math.abs(holding.quantity * stock.currentValue)
        }
        return total
      }, 0)
  }

  // Calculate total profit/loss
  const calculateTotalPnL = () => {
    const unrealizedPnL = user.holdings
      .filter((h) => h.status === "open")
      .reduce((total, holding) => total + holding.unrealizedPnL, 0)

    const realizedPnL = user.holdings
      .filter((h) => h.status === "closed")
      .reduce((total, holding) => total + holding.realizedPnL, 0)

    return { unrealizedPnL, realizedPnL, totalPnL: unrealizedPnL + realizedPnL }
  }

  const portfolioValue = calculatePortfolioValue()
  const { unrealizedPnL, realizedPnL, totalPnL } = calculateTotalPnL()
  const totalInvested = portfolioValue - unrealizedPnL
  const pnlPercentage = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0

  // Get stock details for a holding
  const getStockDetails = (stockId: string) => {
    return stocks.find((s) => s.id === stockId)
  }

  // Filter holdings
  const openHoldings = user.holdings.filter((h) => h.status === "open")
  const closedHoldings = user.holdings.filter((h) => h.status === "closed")

  // Group transactions by date for daily summary
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

  // Pagination logic
  const getPaginatedHoldings = (holdings: typeof user.holdings, page: number) => {
    const totalPages = Math.ceil(holdings.length / ITEMS_PER_PAGE)
    const startIndex = (page - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    return {
      holdings: holdings.slice(startIndex, endIndex),
      totalPages,
    }
  }

  const getPaginatedDates = (dates: string[], page: number) => {
    const totalPages = Math.ceil(dates.length / ITEMS_PER_PAGE)
    const startIndex = (page - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    return {
      dates: dates.slice(startIndex, endIndex),
      totalPages,
    }
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="container py-6 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Portfolio</h1>
          <p className="text-gray-600">Track your holdings, performance, and trading history</p>
        </div>

        {/* Portfolio Summary */}
        <Card className="mb-6 shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardTitle>Portfolio Summary</CardTitle>
            <CardDescription className="text-blue-100">Your current holdings and performance overview</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                  <span className="text-sm text-blue-600 font-medium">Cash Balance</span>
                </div>
                <div className="text-2xl font-bold text-blue-800">₹{user.balance.toFixed(2)}</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-green-600 font-medium">Portfolio Value</span>
                </div>
                <div className="text-2xl font-bold text-green-800">₹{portfolioValue.toFixed(2)}</div>
              </div>
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-amber-600" />
                  <span className="text-sm text-amber-600 font-medium">Unrealized P&L</span>
                </div>
                <div className={`text-2xl font-bold ${unrealizedPnL >= 0 ? "text-green-700" : "text-red-700"}`}>
                  {unrealizedPnL >= 0 ? "+" : ""}₹{unrealizedPnL.toFixed(2)}
                </div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-5 w-5 text-purple-600" />
                  <span className="text-sm text-purple-600 font-medium">Total P&L</span>
                </div>
                <div
                  className={`text-2xl font-bold flex items-center ${totalPnL >= 0 ? "text-green-700" : "text-red-700"}`}
                >
                  {totalPnL >= 0 ? <ArrowUp className="h-5 w-5 mr-1" /> : <ArrowDown className="h-5 w-5 mr-1" />}
                  {totalPnL >= 0 ? "+" : ""}₹{totalPnL.toFixed(2)} ({pnlPercentage.toFixed(2)}%)
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white shadow-sm">
            <TabsTrigger value="holdings" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Holdings ({openHoldings.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              Holdings History ({closedHoldings.length})
            </TabsTrigger>
            <TabsTrigger value="daily" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
              Daily Summary ({sortedDates.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="holdings">
            <Card className="shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                <CardTitle>Open Holdings</CardTitle>
                <CardDescription className="text-indigo-100">Your current active positions</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {(() => {
                  const { holdings: paginatedHoldings, totalPages } = getPaginatedHoldings(openHoldings, holdingsPage)

                  return paginatedHoldings.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Symbol</th>
                            <th className="text-center py-3 px-4 font-semibold text-gray-700">Status</th>
                            <th className="text-center py-3 px-4 font-semibold text-gray-700">Position Type</th>
                            <th className="text-right py-3 px-4 font-semibold text-gray-700">Quantity</th>
                            <th className="text-right py-3 px-4 font-semibold text-gray-700">Avg Entry</th>
                            <th className="text-right py-3 px-4 font-semibold text-gray-700">Current Price</th>
                            <th className="text-right py-3 px-4 font-semibold text-gray-700">Unrealized P&L</th>
                            <th className="text-right py-3 px-4 font-semibold text-gray-700">Stop Loss</th>
                            <th className="text-right py-3 px-4 font-semibold text-gray-700">Take Profit</th>
                            <th className="text-center py-3 px-4 font-semibold text-gray-700">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedHoldings.map((holding, index) => {
                            const stock = getStockDetails(holding.stockId)
                            if (!stock) return null

                            return (
                              <tr
                                key={holding.id}
                                className={`border-b hover:bg-gray-50 ${index % 2 === 0 ? "bg-white" : "bg-gray-25"}`}
                              >
                                <td className="py-3 px-4 font-medium text-gray-900">{holding.symbol}</td>
                                <td className="py-3 px-4 text-center">
                                  <Badge variant="default" className="bg-green-100 text-green-800">
                                    {holding.status.toUpperCase()}
                                  </Badge>
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <Badge
                                    variant={holding.positionType === "long" ? "default" : "destructive"}
                                    className={
                                      holding.positionType === "long"
                                        ? "bg-blue-100 text-blue-800"
                                        : "bg-red-100 text-red-800"
                                    }
                                  >
                                    {holding.positionType.toUpperCase()}
                                  </Badge>
                                </td>
                                <td className="py-3 px-4 text-right font-medium">{holding.quantity}</td>
                                <td className="py-3 px-4 text-right font-medium">
                                  ₹{holding.averageEntryPrice.toFixed(2)}
                                </td>
                                <td className="py-3 px-4 text-right font-medium">₹{stock.currentValue.toFixed(2)}</td>
                                <td
                                  className={`py-3 px-4 text-right font-bold ${holding.unrealizedPnL >= 0 ? "text-green-600" : "text-red-600"}`}
                                >
                                  {holding.unrealizedPnL >= 0 ? "+" : ""}₹{holding.unrealizedPnL.toFixed(2)}
                                </td>
                                <td className="py-3 px-4 text-right text-sm">
                                  {holding.stopLossPrice ? `₹${holding.stopLossPrice.toFixed(2)}` : "-"}
                                </td>
                                <td className="py-3 px-4 text-right text-sm">
                                  {holding.takeProfitPrice ? `₹${holding.takeProfitPrice.toFixed(2)}` : "-"}
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <div className="flex gap-1 justify-center">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        const stopLoss = prompt(
                                          "Enter Stop Loss Price:",
                                          holding.stopLossPrice?.toString() || "",
                                        )
                                        const takeProfit = prompt(
                                          "Enter Take Profit Price:",
                                          holding.takeProfitPrice?.toString() || "",
                                        )

                                        if (stopLoss !== null || takeProfit !== null) {
                                          editHolding(holding.id, {
                                            stopLossPrice: stopLoss
                                              ? Number.parseFloat(stopLoss)
                                              : holding.stopLossPrice,
                                            takeProfitPrice: takeProfit
                                              ? Number.parseFloat(takeProfit)
                                              : holding.takeProfitPrice,
                                          })
                                        }
                                      }}
                                      className="text-blue-600 hover:text-blue-700"
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => closePosition(holding.id)}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                      <Pagination
                        currentPage={holdingsPage}
                        totalPages={totalPages}
                        onPageChange={setHoldingsPage}
                        className="mt-6"
                      />
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">No Open Holdings</h3>
                      <p className="text-gray-600 mb-6">You don't have any open positions yet.</p>
                      <Button asChild>
                        <Link href="/charts">Start Trading</Link>
                      </Button>
                    </div>
                  )
                })()}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card className="shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
                <CardTitle>Holdings History</CardTitle>
                <CardDescription className="text-purple-100">
                  Your closed positions and realized profits/losses
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {(() => {
                  const { holdings: paginatedHoldings, totalPages } = getPaginatedHoldings(closedHoldings, historyPage)

                  return paginatedHoldings.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Symbol</th>
                            <th className="text-center py-3 px-4 font-semibold text-gray-700">Status</th>
                            <th className="text-center py-3 px-4 font-semibold text-gray-700">Position Type</th>
                            <th className="text-right py-3 px-4 font-semibold text-gray-700">Quantity</th>
                            <th className="text-right py-3 px-4 font-semibold text-gray-700">Avg Entry</th>
                            <th className="text-right py-3 px-4 font-semibold text-gray-700">Avg Exit</th>
                            <th className="text-right py-3 px-4 font-semibold text-gray-700">Realized P&L</th>
                            <th className="text-right py-3 px-4 font-semibold text-gray-700">Leverage</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Closed At</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedHoldings.map((holding, index) => (
                            <tr
                              key={holding.id}
                              className={`border-b hover:bg-gray-50 ${index % 2 === 0 ? "bg-white" : "bg-gray-25"}`}
                            >
                              <td className="py-3 px-4 font-medium text-gray-900">{holding.symbol}</td>
                              <td className="py-3 px-4 text-center">
                                <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                                  {holding.status.toUpperCase()}
                                </Badge>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <Badge
                                  variant={holding.positionType === "long" ? "default" : "destructive"}
                                  className={
                                    holding.positionType === "long"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-red-100 text-red-800"
                                  }
                                >
                                  {holding.positionType.toUpperCase()}
                                </Badge>
                              </td>
                              <td className="py-3 px-4 text-right font-medium">{holding.quantity}</td>
                              <td className="py-3 px-4 text-right font-medium">
                                ₹{holding.averageEntryPrice.toFixed(2)}
                              </td>
                              <td className="py-3 px-4 text-right font-medium">
                                {holding.averageExitPrice ? `₹${holding.averageExitPrice.toFixed(2)}` : "-"}
                              </td>
                              <td
                                className={`py-3 px-4 text-right font-bold ${holding.realizedPnL >= 0 ? "text-green-600" : "text-red-600"}`}
                              >
                                {holding.realizedPnL >= 0 ? "+" : ""}₹{holding.realizedPnL.toFixed(2)}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <Badge variant="outline">{holding.leverage}x</Badge>
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-600">
                                {format(new Date(holding.updatedAt), "MMM dd, yyyy HH:mm")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <Pagination
                        currentPage={historyPage}
                        totalPages={totalPages}
                        onPageChange={setHistoryPage}
                        className="mt-6"
                      />
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">No Closed Positions</h3>
                      <p className="text-gray-600">You haven't closed any positions yet.</p>
                    </div>
                  )
                })()}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="daily">
            <div className="space-y-4">
              {(() => {
                const { dates: paginatedDates, totalPages } = getPaginatedDates(sortedDates, summaryPage)

                return paginatedDates.length > 0 ? (
                  <>
                    {paginatedDates.map((date) => {
                      const dayTransactions = groupedTransactions[date]
                      const dayPnL = calculateDayPnL(dayTransactions)

                      return (
                        <Card key={date} className="shadow-lg border-0">
                          <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                            <div className="flex justify-between items-center">
                              <div>
                                <CardTitle>{format(new Date(date), "EEEE, MMMM dd, yyyy")}</CardTitle>
                                <CardDescription className="text-green-100">
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
                                <thead className="bg-green-50">
                                  <tr>
                                    <th className="text-left py-3 px-4 font-semibold text-green-700">Time</th>
                                    <th className="text-left py-3 px-4 font-semibold text-green-700">Stock</th>
                                    <th className="text-center py-3 px-4 font-semibold text-green-700">Type</th>
                                    <th className="text-right py-3 px-4 font-semibold text-green-700">Quantity</th>
                                    <th className="text-right py-3 px-4 font-semibold text-green-700">Price</th>
                                    <th className="text-right py-3 px-4 font-semibold text-green-700">Total</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {dayTransactions.map((transaction, index) => (
                                    <tr
                                      key={transaction.id}
                                      className={`border-b hover:bg-green-25 ${index % 2 === 0 ? "bg-white" : "bg-green-25"}`}
                                    >
                                      <td className="py-3 px-4 text-sm text-gray-600">
                                        {format(new Date(transaction.timestamp), "HH:mm:ss")}
                                      </td>
                                      <td className="py-3 px-4 font-medium text-gray-900">{transaction.stockName}</td>
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
                                      <td className="py-3 px-4 text-right font-medium">
                                        ₹{transaction.price.toFixed(2)}
                                      </td>
                                      <td className="py-3 px-4 text-right font-bold">
                                        ₹{transaction.total.toFixed(2)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                    <Pagination
                      currentPage={summaryPage}
                      totalPages={totalPages}
                      onPageChange={setSummaryPage}
                      className="mt-6"
                    />
                  </>
                ) : (
                  <Card className="shadow-lg border-0">
                    <CardContent className="text-center py-12">
                      <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">No Trading History</h3>
                      <p className="text-gray-600">Start trading to see your daily summaries</p>
                    </CardContent>
                  </Card>
                )
              })()}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
