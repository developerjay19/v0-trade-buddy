"use client"

import { useState } from "react"
import Link from "next/link"
import { useTrading } from "@/lib/trading-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart3, Home, PlusCircle, TrendingDown, TrendingUp } from "lucide-react"
import { format } from "date-fns"

export default function PortfolioPage() {
  const { stocks, user } = useTrading()
  const [activeTab, setActiveTab] = useState("holdings")

  // Calculate total portfolio value
  const calculatePortfolioValue = () => {
    return user.holdings.reduce((total, holding) => {
      const stock = stocks.find((s) => s.id === holding.stockId)
      if (stock) {
        return total + holding.quantity * stock.currentValue
      }
      return total
    }, 0)
  }

  // Calculate total profit/loss
  const calculateTotalPnL = () => {
    return user.holdings.reduce((total, holding) => {
      const stock = stocks.find((s) => s.id === holding.stockId)
      if (stock) {
        const currentValue = holding.quantity * stock.currentValue
        const investedValue = holding.quantity * holding.averageBuyPrice
        return total + (currentValue - investedValue)
      }
      return total
    }, 0)
  }

  const portfolioValue = calculatePortfolioValue()
  const totalPnL = calculateTotalPnL()
  const totalInvested = portfolioValue - totalPnL
  const pnlPercentage = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0

  // Get stock details for a holding
  const getStockDetails = (stockId: string) => {
    return stocks.find((s) => s.id === stockId)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl">
              <BarChart3 className="h-6 w-6" />
              <span>Trade Buddy</span>
            </Link>
            <nav className="hidden md:flex gap-6">
              <Link
                href="/"
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary"
              >
                <Home className="h-4 w-4" />
                Trading
              </Link>
              <Link
                href="/create-stock"
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary"
              >
                <PlusCircle className="h-4 w-4" />
                Create Stock
              </Link>
              <Link href="/portfolio" className="flex items-center gap-2 text-sm font-medium text-primary">
                <BarChart3 className="h-4 w-4" />
                Portfolio
              </Link>
            </nav>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="container py-6 px-4">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Portfolio Summary</CardTitle>
                <CardDescription>Your current holdings and performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="text-sm text-muted-foreground">Cash Balance</div>
                    <div className="text-2xl font-bold">₹{user.balance.toFixed(2)}</div>
                  </div>
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="text-sm text-muted-foreground">Portfolio Value</div>
                    <div className="text-2xl font-bold">₹{portfolioValue.toFixed(2)}</div>
                  </div>
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="text-sm text-muted-foreground">Total Profit/Loss</div>
                    <div
                      className={`text-2xl font-bold flex items-center ${totalPnL >= 0 ? "text-green-500" : "text-red-500"}`}
                    >
                      {totalPnL >= 0 ? (
                        <TrendingUp className="w-5 h-5 mr-1" />
                      ) : (
                        <TrendingDown className="w-5 h-5 mr-1" />
                      )}
                      ₹{totalPnL.toFixed(2)} ({pnlPercentage.toFixed(2)}%)
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="holdings">Holdings</TabsTrigger>
                <TabsTrigger value="transactions">Transaction History</TabsTrigger>
              </TabsList>
              <TabsContent value="holdings">
                <Card>
                  <CardHeader>
                    <CardTitle>Your Holdings</CardTitle>
                    <CardDescription>Stocks currently in your portfolio</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {user.holdings.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-3 px-2">Stock</th>
                              <th className="text-right py-3 px-2">Quantity</th>
                              <th className="text-right py-3 px-2">Avg. Buy</th>
                              <th className="text-right py-3 px-2">Current</th>
                              <th className="text-right py-3 px-2">Value</th>
                              <th className="text-right py-3 px-2">P&L</th>
                            </tr>
                          </thead>
                          <tbody>
                            {user.holdings.map((holding) => {
                              const stock = getStockDetails(holding.stockId)
                              if (!stock) return null

                              const currentValue = holding.quantity * stock.currentValue
                              const investedValue = holding.quantity * holding.averageBuyPrice
                              const pnl = currentValue - investedValue
                              const pnlPercentage = (pnl / investedValue) * 100

                              return (
                                <tr key={holding.stockId} className="border-b">
                                  <td className="py-3 px-2">
                                    <Link href="/" className="font-medium hover:underline">
                                      {stock.name}
                                    </Link>
                                  </td>
                                  <td className="text-right py-3 px-2">{holding.quantity}</td>
                                  <td className="text-right py-3 px-2">₹{holding.averageBuyPrice.toFixed(2)}</td>
                                  <td className="text-right py-3 px-2">₹{stock.currentValue.toFixed(2)}</td>
                                  <td className="text-right py-3 px-2">₹{currentValue.toFixed(2)}</td>
                                  <td
                                    className={`text-right py-3 px-2 ${pnl >= 0 ? "text-green-500" : "text-red-500"}`}
                                  >
                                    ₹{pnl.toFixed(2)} ({pnlPercentage.toFixed(2)}%)
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-muted-foreground">You don't have any holdings yet.</p>
                        <Button asChild className="mt-4">
                          <Link href="/">Start Trading</Link>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="transactions">
                <Card>
                  <CardHeader>
                    <CardTitle>Transaction History</CardTitle>
                    <CardDescription>Record of your trades</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {user.transactions.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-3 px-2">Date</th>
                              <th className="text-left py-3 px-2">Stock</th>
                              <th className="text-left py-3 px-2">Type</th>
                              <th className="text-right py-3 px-2">Quantity</th>
                              <th className="text-right py-3 px-2">Price</th>
                              <th className="text-right py-3 px-2">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {user.transactions
                              .slice()
                              .reverse()
                              .map((transaction) => (
                                <tr key={transaction.id} className="border-b">
                                  <td className="py-3 px-2">
                                    {format(new Date(transaction.timestamp), "MMM dd, HH:mm")}
                                  </td>
                                  <td className="py-3 px-2">{transaction.stockName}</td>
                                  <td className="py-3 px-2">
                                    <span
                                      className={`inline-block px-2 py-1 rounded-full text-xs ${
                                        transaction.type === "buy"
                                          ? "bg-green-100 text-green-800"
                                          : "bg-red-100 text-red-800"
                                      }`}
                                    >
                                      {transaction.type === "buy" ? "Buy" : "Sell"}
                                    </span>
                                  </td>
                                  <td className="text-right py-3 px-2">{transaction.quantity}</td>
                                  <td className="text-right py-3 px-2">₹{transaction.price.toFixed(2)}</td>
                                  <td className="text-right py-3 px-2">₹{transaction.total.toFixed(2)}</td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-muted-foreground">No transactions yet.</p>
                        <Button asChild className="mt-4">
                          <Link href="/">Start Trading</Link>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
      <div className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-background">
        <div className="grid grid-cols-3 gap-1 p-2">
          <Link href="/" className="flex flex-col items-center justify-center py-2 text-muted-foreground">
            <Home className="h-5 w-5" />
            <span className="text-xs">Trading</span>
          </Link>
          <Link href="/create-stock" className="flex flex-col items-center justify-center py-2 text-muted-foreground">
            <PlusCircle className="h-5 w-5" />
            <span className="text-xs">Create</span>
          </Link>
          <Link href="/portfolio" className="flex flex-col items-center justify-center py-2 text-primary">
            <BarChart3 className="h-5 w-5" />
            <span className="text-xs">Portfolio</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
