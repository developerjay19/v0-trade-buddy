"use client"

import { useState } from "react"
import { useTrading } from "@/lib/trading-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Pagination } from "@/components/pagination"
import { BarChart3, TrendingUp, TrendingDown, Target, Shield, X } from "lucide-react"
import { format } from "date-fns"

export default function OrderBookPage() {
  const { user, stocks, cancelOrder } = useTrading()
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 20

  const getStockName = (stockId: string) => {
    const stock = stocks.find((s) => s.id === stockId)
    return stock?.name || "Unknown Stock"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "filled":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "open":
        return "bg-blue-100 text-blue-800"
      case "cancelled":
        return "bg-gray-100 text-gray-800"
      case "triggered":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getOrderTypeIcon = (orderType: string) => {
    switch (orderType) {
      case "buy":
        return <TrendingUp className="h-3 w-3" />
      case "sell":
        return <TrendingDown className="h-3 w-3" />
      case "stoploss":
        return <Shield className="h-3 w-3" />
      case "take_profit":
        return <Target className="h-3 w-3" />
      default:
        return null
    }
  }

  // Filter orders by type
  const buyOrders = user.orders.filter((order) => order.orderType === "buy")
  const sellOrders = user.orders.filter((order) => order.orderType === "sell")
  const stopLossTargetOrders = user.orders.filter(
    (order) => order.orderType === "stoploss" || order.orderType === "take_profit",
  )

  // Pagination logic for different tabs
  const getPaginatedOrders = (orders: typeof user.orders) => {
    const totalPages = Math.ceil(orders.length / ITEMS_PER_PAGE)
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    return {
      orders: orders.slice().reverse().slice(startIndex, endIndex),
      totalPages,
    }
  }

  const renderOrderTable = (orders: typeof user.orders, showActions = true) => {
    const { orders: paginatedOrders, totalPages } = getPaginatedOrders(orders)

    return (
      <>
        {paginatedOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Date & Time</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Symbol</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Type</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Execution</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Quantity</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Order Price</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Executed Price</th>
                  {showActions && <th className="text-center py-3 px-4 font-semibold text-gray-700">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.map((order, index) => (
                  <tr
                    key={order.id}
                    className={`border-b hover:bg-gray-50 ${index % 2 === 0 ? "bg-white" : "bg-gray-25"}`}
                  >
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {format(new Date(order.createdAt), "MMM dd, yyyy HH:mm:ss")}
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900">{order.symbol}</td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant="outline" className="flex items-center gap-1 w-fit mx-auto">
                        {getOrderTypeIcon(order.orderType)}
                        {order.orderType.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant="secondary">{order.executionType.toUpperCase()}</Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <Badge className={getStatusColor(order.status)}>{order.status.toUpperCase()}</Badge>
                        {order.status === "executed" && order.executedAt && (
                          <span className="text-xs text-gray-500">
                            {format(new Date(order.executedAt), "HH:mm:ss")}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-medium">{order.quantity}</td>
                    <td className="py-3 px-4 text-right font-medium">
                      {order.limitPrice
                        ? `₹${order.limitPrice.toFixed(2)}`
                        : order.price
                          ? `₹${order.price.toFixed(2)}`
                          : "Market"}
                    </td>
                    <td className="py-3 px-4 text-right font-medium">
                      {order.executedPrice ? `₹${order.executedPrice.toFixed(2)}` : "-"}
                    </td>
                    {showActions && (
                      <td className="py-3 px-4 text-center">
                        {(order.status === "pending" || order.status === "open") && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => cancelOrder(order.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-3 w-3 mr-1" />
                            Cancel
                          </Button>
                        )}
                        {order.executedAt && (
                          <span className="text-xs text-gray-500">
                            Executed: {format(new Date(order.executedAt), "HH:mm:ss")}
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              className="mt-6"
            />
          </div>
        ) : (
          <div className="text-center py-12">
            <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Orders Found</h3>
            <p className="text-gray-600">No orders of this type have been placed yet</p>
          </div>
        )}
      </>
    )
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="container py-6 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Book</h1>
          <p className="text-gray-600">Complete history and management of your trading orders</p>
        </div>

        <Tabs defaultValue="all" className="space-y-6" onValueChange={() => setCurrentPage(1)}>
          <TabsList className="bg-white shadow-sm">
            <TabsTrigger value="all" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              All Orders ({user.orders.length})
            </TabsTrigger>
            <TabsTrigger value="buy" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
              Buy Orders ({buyOrders.length})
            </TabsTrigger>
            <TabsTrigger value="sell" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
              Sell Orders ({sellOrders.length})
            </TabsTrigger>
            <TabsTrigger
              value="stoploss-target"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
            >
              Stop-Loss/Target ({stopLossTargetOrders.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <Card className="shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                <CardTitle>All Orders</CardTitle>
                <CardDescription className="text-indigo-100">Complete order history and management</CardDescription>
              </CardHeader>
              <CardContent className="p-0">{renderOrderTable(user.orders)}</CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="buy">
            <Card className="shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                <CardTitle>Buy Orders</CardTitle>
                <CardDescription className="text-green-100">All your purchase orders</CardDescription>
              </CardHeader>
              <CardContent className="p-0">{renderOrderTable(buyOrders)}</CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sell">
            <Card className="shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-red-500 to-rose-600 text-white">
                <CardTitle>Sell Orders</CardTitle>
                <CardDescription className="text-red-100">All your sale orders</CardDescription>
              </CardHeader>
              <CardContent className="p-0">{renderOrderTable(sellOrders)}</CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stoploss-target">
            <Card className="shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
                <CardTitle>Stop-Loss & Take-Profit Orders</CardTitle>
                <CardDescription className="text-purple-100">Risk management and profit-taking orders</CardDescription>
              </CardHeader>
              <CardContent className="p-0">{renderOrderTable(stopLossTargetOrders)}</CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
