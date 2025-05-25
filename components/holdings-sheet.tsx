"use client"

import { useState } from "react"
import { useTrading } from "@/lib/trading-context"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { TrendingUp, TrendingDown, Briefcase, X, AlertTriangle, Edit, Target, Shield, BarChart3 } from "lucide-react"
import { format } from "date-fns"

export function HoldingsSheet() {
  const { stocks, user, editHolding, closeHolding, cancelOrder, createOrder } = useTrading()
  const [isOpen, setIsOpen] = useState(false)
  const [editingHolding, setEditingHolding] = useState<string | null>(null)
  const [stopLossPrice, setStopLossPrice] = useState<number>(0)
  const [takeProfitPrice, setTakeProfitPrice] = useState<number>(0)

  // Get stock details for a holding
  const getStockDetails = (stockId: string) => {
    return stocks.find((s) => s.id === stockId)
  }

  // Filter open holdings and active orders
  const openHoldings = user.holdings.filter((h) => h.status === "open")
  const activeOrders = user.orders.filter((o) => o.status === "pending" || o.status === "open")

  // Calculate total portfolio value and PnL
  const totalPortfolioValue = openHoldings.reduce((total, holding) => {
    const stock = getStockDetails(holding.stockId)
    if (stock) {
      return total + Math.abs(holding.quantity * stock.currentValue)
    }
    return total
  }, 0)

  const totalPnL = openHoldings.reduce((total, holding) => {
    return total + holding.unrealizedPnL
  }, 0)

  const totalPnLPercentage = openHoldings.length > 0 ? (totalPnL / totalPortfolioValue) * 100 : 0

  // Handle edit holding
  const handleEditHolding = (holdingId: string) => {
    const holding = openHoldings.find((h) => h.id === holdingId)
    if (holding) {
      setEditingHolding(holdingId)
      setStopLossPrice(holding.stopLossPrice || 0)
      setTakeProfitPrice(holding.takeProfitPrice || 0)
    }
  }

  const saveHoldingEdit = () => {
    if (editingHolding) {
      editHolding(editingHolding, {
        stopLossPrice: stopLossPrice || undefined,
        takeProfitPrice: takeProfitPrice || undefined,
      })
      setEditingHolding(null)
    }
  }

  // Handle buy/sell for a specific stock
  const handleQuickTrade = (stockId: string, type: "buy" | "sell") => {
    const stock = getStockDetails(stockId)
    if (!stock) return

    const quantity = Number.parseInt(prompt(`Enter quantity to ${type}:`) || "0")
    if (quantity > 0) {
      createOrder({
        stockId,
        symbol: stock.name.toUpperCase().slice(0, 4),
        orderType: type,
        executionType: "market",
        quantity,
      })
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 bg-white hover:bg-gray-50 shadow-lg border-2"
        >
          <Briefcase className="h-4 w-4 mr-2" />
          Holdings & Orders ({openHoldings.length + activeOrders.length})
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[80vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Holdings & Orders
          </SheetTitle>
          <SheetDescription>Manage your active holdings and pending orders</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 mt-6">
          {/* Portfolio Summary */}
          <Card className="bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Total Portfolio Value</div>
                  <div className="text-xl font-bold text-gray-900">₹{totalPortfolioValue.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Total P&L</div>
                  <div
                    className={`text-xl font-bold flex items-center ${
                      totalPnL >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {totalPnL >= 0 ? (
                      <TrendingUp className="h-4 w-4 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 mr-1" />
                    )}
                    {totalPnL >= 0 ? "+" : ""}₹{totalPnL.toFixed(2)} ({totalPnLPercentage.toFixed(2)}%)
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="holdings" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-100">
              <TabsTrigger value="holdings" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                Holdings ({openHoldings.length})
              </TabsTrigger>
              <TabsTrigger value="orders" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                Orders ({activeOrders.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="holdings" className="space-y-4 mt-4">
              {openHoldings.length > 0 ? (
                openHoldings.map((holding) => {
                  const stock = getStockDetails(holding.stockId)
                  if (!stock) return null

                  const holdingType = holding.holdingType
                  const isEditing = editingHolding === holding.id

                  return (
                    <Card
                      key={holding.id}
                      className={`border ${
                        holdingType === "long" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-gray-900">{stock.name}</h3>
                              <Badge
                                variant={holdingType === "long" ? "default" : "destructive"}
                                className={
                                  holdingType === "long" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                }
                              >
                                {holdingType.toUpperCase()}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-500">
                              Entry: {format(new Date(holding.createdAt), "MMM dd, yyyy HH:mm")}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditHolding(holding.id)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className={`${
                                    holdingType === "long"
                                      ? "border-green-300 hover:bg-green-100"
                                      : "border-red-300 hover:bg-red-100"
                                  }`}
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Close
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Close Holding</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to close your {holdingType.toLowerCase()} holding in{" "}
                                    {stock.name}? This will {holdingType === "long" ? "sell" : "buy"}{" "}
                                    {Math.abs(holding.quantity)} shares at current market price.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => closeHolding(holding.id)}
                                    className={
                                      holdingType === "long"
                                        ? "bg-green-600 hover:bg-green-700"
                                        : "bg-red-600 hover:bg-red-700"
                                    }
                                  >
                                    Confirm
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>

                        {isEditing ? (
                          <div className="space-y-4 bg-white p-4 rounded-md border border-gray-200">
                            <h4 className="font-medium text-gray-900">Edit Risk Management</h4>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="stop-loss">Stop Loss Price</Label>
                                <Input
                                  id="stop-loss"
                                  type="number"
                                  step="0.01"
                                  value={stopLossPrice}
                                  onChange={(e) => setStopLossPrice(Number.parseFloat(e.target.value) || 0)}
                                  placeholder="Enter stop loss price"
                                />
                              </div>
                              <div>
                                <Label htmlFor="take-profit">Take Profit Price</Label>
                                <Input
                                  id="take-profit"
                                  type="number"
                                  step="0.01"
                                  value={takeProfitPrice}
                                  onChange={(e) => setTakeProfitPrice(Number.parseFloat(e.target.value) || 0)}
                                  placeholder="Enter take profit price"
                                />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button onClick={saveHoldingEdit} size="sm">
                                Save Changes
                              </Button>
                              <Button variant="outline" onClick={() => setEditingHolding(null)} size="sm">
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="grid grid-cols-2 gap-4 mb-3">
                              <div>
                                <div className="text-sm text-gray-500">Quantity</div>
                                <div className="font-semibold text-gray-900">{Math.abs(holding.quantity)} shares</div>
                              </div>
                              <div>
                                <div className="text-sm text-gray-500">Avg. Entry Price</div>
                                <div className="font-semibold text-gray-900">
                                  ₹{holding.averageEntryPrice.toFixed(2)}
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-3">
                              <div>
                                <div className="text-sm text-gray-500">Current Price</div>
                                <div className="font-semibold text-gray-900">₹{stock.currentValue.toFixed(2)}</div>
                              </div>
                              <div>
                                <div className="text-sm text-gray-500">Market Value</div>
                                <div className="font-semibold text-gray-900">
                                  ₹{(Math.abs(holding.quantity) * stock.currentValue).toFixed(2)}
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-3">
                              <div>
                                <div className="text-sm text-gray-500 flex items-center gap-1">
                                  <Shield className="h-3 w-3" />
                                  Stop Loss
                                </div>
                                <div className="font-semibold text-red-600">
                                  {holding.stopLossPrice ? `₹${holding.stopLossPrice.toFixed(2)}` : "Not Set"}
                                </div>
                              </div>
                              <div>
                                <div className="text-sm text-gray-500 flex items-center gap-1">
                                  <Target className="h-3 w-3" />
                                  Take Profit
                                </div>
                                <div className="font-semibold text-green-600">
                                  {holding.takeProfitPrice ? `₹${holding.takeProfitPrice.toFixed(2)}` : "Not Set"}
                                </div>
                              </div>
                            </div>

                            <div className="bg-white p-3 rounded-md border border-gray-200">
                              <div className="flex justify-between items-center mb-2">
                                <div className="text-sm text-gray-500">Unrealized P&L</div>
                                <div
                                  className={`font-bold flex items-center ${
                                    holding.unrealizedPnL >= 0 ? "text-green-600" : "text-red-600"
                                  }`}
                                >
                                  {holding.unrealizedPnL >= 0 ? (
                                    <TrendingUp className="h-4 w-4 mr-1" />
                                  ) : (
                                    <TrendingDown className="h-4 w-4 mr-1" />
                                  )}
                                  {holding.unrealizedPnL >= 0 ? "+" : ""}₹{holding.unrealizedPnL.toFixed(2)}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleQuickTrade(holding.stockId, "buy")}
                                  className="flex-1 text-green-600 hover:text-green-700"
                                >
                                  <TrendingUp className="h-3 w-3 mr-1" />
                                  Buy More
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleQuickTrade(holding.stockId, "sell")}
                                  className="flex-1 text-red-600 hover:text-red-700"
                                >
                                  <TrendingDown className="h-3 w-3 mr-1" />
                                  Sell
                                </Button>
                              </div>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  )
                })
              ) : (
                <div className="text-center py-12">
                  <AlertTriangle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Open Holdings</h3>
                  <p className="text-gray-600 mb-4">You don't have any active holdings.</p>
                  <Button onClick={() => setIsOpen(false)}>Start Trading</Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="orders" className="space-y-4 mt-4">
              {activeOrders.length > 0 ? (
                activeOrders.map((order) => {
                  const stock = getStockDetails(order.stockId)
                  if (!stock) return null

                  return (
                    <Card key={order.id} className="border border-blue-200 bg-blue-50">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-gray-900">{order.symbol}</h3>
                              <Badge variant="outline" className="bg-blue-100 text-blue-800">
                                {order.orderType.toUpperCase()}
                              </Badge>
                              <Badge variant="secondary">{order.executionType.toUpperCase()}</Badge>
                            </div>
                            <p className="text-sm text-gray-500">
                              Created: {format(new Date(order.createdAt), "MMM dd, yyyy HH:mm")}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Badge className="bg-yellow-100 text-yellow-800">{order.status.toUpperCase()}</Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => cancelOrder(order.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="h-4 w-4 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm text-gray-500">Quantity</div>
                            <div className="font-semibold text-gray-900">{order.quantity} shares</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">Price</div>
                            <div className="font-semibold text-gray-900">
                              {order.limitPrice ? `₹${order.limitPrice.toFixed(2)}` : "Market Price"}
                            </div>
                          </div>
                        </div>

                        {(order.stopPrice || order.takeProfitPrice) && (
                          <div className="grid grid-cols-2 gap-4 mt-3">
                            {order.stopPrice && (
                              <div>
                                <div className="text-sm text-gray-500">Stop Price</div>
                                <div className="font-semibold text-red-600">₹{order.stopPrice.toFixed(2)}</div>
                              </div>
                            )}
                            {order.takeProfitPrice && (
                              <div>
                                <div className="text-sm text-gray-500">Take Profit</div>
                                <div className="font-semibold text-green-600">₹{order.takeProfitPrice.toFixed(2)}</div>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })
              ) : (
                <div className="text-center py-12">
                  <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Active Orders</h3>
                  <p className="text-gray-600 mb-4">You don't have any pending orders.</p>
                  <Button onClick={() => setIsOpen(false)}>Place Order</Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  )
}
