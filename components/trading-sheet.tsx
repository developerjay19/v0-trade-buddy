"use client"

import { useState, useEffect } from "react"
import { useTrading } from "@/lib/trading-context"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { TrendingUp, TrendingDown, BarChart3, AlertTriangle } from "lucide-react"

export function TradingSheet() {
  const { stocks, user, selectedStock, margin, setMargin, selectStock, createOrder } = useTrading()

  const [buyQuantity, setBuyQuantity] = useState<number>(1)
  const [sellQuantity, setSellQuantity] = useState<number>(1)
  const [buyPrice, setBuyPrice] = useState<number>(0)
  const [sellPrice, setSellPrice] = useState<number>(0)
  const [isOpen, setIsOpen] = useState(false)

  // Stop loss and target price
  const [useStopLoss, setUseStopLoss] = useState(false)
  const [stopLossPrice, setStopLossPrice] = useState<number>(0)
  const [useTarget, setUseTarget] = useState(false)
  const [targetPrice, setTargetPrice] = useState<number>(0)

  // Add state for order execution type
  const [buyExecutionType, setBuyExecutionType] = useState<"market" | "limit">("market")
  const [sellExecutionType, setSellExecutionType] = useState<"market" | "limit">("market")
  const [buyLimitPrice, setBuyLimitPrice] = useState<number>(0)
  const [sellLimitPrice, setSellLimitPrice] = useState<number>(0)

  // Update prices when selected stock changes
  useEffect(() => {
    if (selectedStock) {
      setBuyPrice(selectedStock.currentValue)
      setSellPrice(selectedStock.currentValue)
      setBuyLimitPrice(selectedStock.currentValue)
      setSellLimitPrice(selectedStock.currentValue)

      // Set default stop loss and target prices
      setStopLossPrice(selectedStock.currentValue * 0.95) // 5% below current price
      setTargetPrice(selectedStock.currentValue * 1.05) // 5% above current price
    }
  }, [selectedStock])

  // Calculate holdings for the selected stock
  const currentHolding = selectedStock ? user.holdings.find((h) => h.stockId === selectedStock.id) : null

  // Calculate profit/loss for the current holding
  const calculatePnL = () => {
    if (!selectedStock || !currentHolding) return 0

    const currentValue = currentHolding.quantity * selectedStock.currentValue
    const investedValue = currentHolding.quantity * currentHolding.averageBuyPrice

    return currentValue - investedValue
  }

  const pnl = calculatePnL()
  const pnlPercentage =
    currentHolding && currentHolding.averageBuyPrice > 0
      ? (pnl / Math.abs(currentHolding.quantity * currentHolding.averageBuyPrice)) * 100
      : 0

  // Calculate margin used
  const buyMarginUsed = (buyQuantity * buyPrice) / margin
  const maxBuyQuantity = Math.floor((user.balance * margin) / (selectedStock?.currentValue || 1))

  // Handle buy
  const handleBuy = () => {
    if (!selectedStock) return

    createOrder({
      stockId: selectedStock.id,
      symbol: selectedStock.name.toUpperCase().slice(0, 4),
      orderType: "buy",
      executionType: buyExecutionType,
      quantity: buyQuantity,
      price: buyExecutionType === "market" ? undefined : buyLimitPrice,
      limitPrice: buyExecutionType === "limit" ? buyLimitPrice : undefined,
    })

    // Create stop loss order if enabled
    if (useStopLoss && stopLossPrice > 0) {
      createOrder({
        stockId: selectedStock.id,
        symbol: selectedStock.name.toUpperCase().slice(0, 4),
        orderType: "stoploss",
        executionType: "market",
        quantity: buyQuantity,
        stopPrice: stopLossPrice,
      })
    }

    // Create take profit order if enabled
    if (useTarget && targetPrice > 0) {
      createOrder({
        stockId: selectedStock.id,
        symbol: selectedStock.name.toUpperCase().slice(0, 4),
        orderType: "take_profit",
        executionType: "market",
        quantity: buyQuantity,
        takeProfitPrice: targetPrice,
      })
    }
  }

  // Handle sell
  const handleSell = () => {
    if (!selectedStock) return

    createOrder({
      stockId: selectedStock.id,
      symbol: selectedStock.name.toUpperCase().slice(0, 4),
      orderType: "sell",
      executionType: sellExecutionType,
      quantity: sellQuantity,
      price: sellExecutionType === "market" ? undefined : sellLimitPrice,
      limitPrice: sellExecutionType === "limit" ? sellLimitPrice : undefined,
    })

    // Create stop loss order if enabled
    if (useStopLoss && stopLossPrice > 0) {
      createOrder({
        stockId: selectedStock.id,
        symbol: selectedStock.name.toUpperCase().slice(0, 4),
        orderType: "stoploss",
        executionType: "market",
        quantity: sellQuantity,
        stopPrice: stopLossPrice,
      })
    }

    // Create take profit order if enabled
    if (useTarget && targetPrice > 0) {
      createOrder({
        stockId: selectedStock.id,
        symbol: selectedStock.name.toUpperCase().slice(0, 4),
        orderType: "take_profit",
        executionType: "market",
        quantity: sellQuantity,
        takeProfitPrice: targetPrice,
      })
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button className="fixed bottom-4 right-4 z-50 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg">
          <BarChart3 className="h-4 w-4 mr-2" />
          Trade
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:w-[600px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Trading Panel
          </SheetTitle>
          <SheetDescription>Buy and sell stocks with advanced trading features</SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Account Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Account Overview</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                <div className="text-sm text-green-600 font-medium">Cash Balance</div>
                <div className="text-2xl font-bold text-green-700">₹{user.balance.toFixed(2)}</div>
              </div>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                <div className="text-sm text-blue-600 font-medium">Margin</div>
                <div className="text-2xl font-bold text-blue-700">{margin}x</div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <Label htmlFor="margin-slider" className="text-sm font-medium text-gray-700">
                Margin Multiplier: {margin}x
              </Label>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-sm text-gray-500">1x</span>
                <Slider
                  id="margin-slider"
                  min={1}
                  max={10}
                  step={1}
                  value={[margin]}
                  onValueChange={(value) => setMargin(value[0])}
                  className="flex-1"
                />
                <span className="text-sm text-gray-500">10x</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Higher margin increases buying power but also increases risk.
              </p>
            </div>
          </div>

          {/* Stock Selection */}
          <div className="space-y-3">
            <Label htmlFor="stock-select" className="text-lg font-semibold text-gray-900">
              Select Stock
            </Label>
            <Select value={selectedStock?.id || ""} onValueChange={(value) => selectStock(value)}>
              <SelectTrigger id="stock-select" className="h-12">
                <SelectValue placeholder="Choose a stock to trade" />
              </SelectTrigger>
              <SelectContent>
                {stocks.map((stock) => (
                  <SelectItem key={stock.id} value={stock.id}>
                    <div className="flex justify-between items-center w-full">
                      <span className="font-medium">{stock.name}</span>
                      <span className="text-blue-600 font-bold">₹{stock.currentValue.toFixed(2)}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Current Position */}
          {selectedStock && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">Current Position</h3>
              {currentHolding ? (
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-lg border border-purple-200 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-purple-600 font-medium">Quantity</div>
                      <div className="text-lg font-bold text-purple-700">
                        {currentHolding.quantity} shares
                        {currentHolding.quantity < 0 && (
                          <Badge variant="destructive" className="ml-2">
                            SHORT
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-purple-600 font-medium">Avg. Price</div>
                      <div className="text-lg font-bold text-purple-700">
                        ₹{currentHolding.averageBuyPrice.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-purple-600 font-medium">Current Value</div>
                      <div className="text-lg font-bold text-purple-700">
                        ₹{Math.abs(currentHolding.quantity * selectedStock.currentValue).toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-purple-600 font-medium">Profit/Loss</div>
                      <div
                        className={`text-lg font-bold flex items-center ${pnl >= 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {pnl >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                        ₹{pnl.toFixed(2)} ({pnlPercentage.toFixed(2)}%)
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-purple-600 font-medium">Margin Used</div>
                    <Badge variant="outline" className="text-purple-700 border-purple-300">
                      {currentHolding.margin}x
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-gray-600">No position in this stock</p>
                </div>
              )}
            </div>
          )}

          {/* Trading Interface */}
          {selectedStock && (
            <Tabs defaultValue="buy" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-gray-100">
                <TabsTrigger value="buy" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
                  Buy Order
                </TabsTrigger>
                <TabsTrigger value="sell" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
                  Sell Order
                </TabsTrigger>
              </TabsList>

              <TabsContent value="buy" className="space-y-4 pt-4">
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Order Type</Label>
                  <Select
                    value={buyExecutionType}
                    onValueChange={(value: "market" | "limit") => setBuyExecutionType(value)}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="market">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>Market Order</span>
                          <span className="text-xs text-gray-500">(Execute immediately)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="limit">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span>Limit Order</span>
                          <span className="text-xs text-gray-500">(Execute at specific price)</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {buyExecutionType === "limit" && (
                  <div className="space-y-3">
                    <Label htmlFor="buy-limit-price" className="text-sm font-medium">
                      Limit Price (₹)
                    </Label>
                    <Input
                      id="buy-limit-price"
                      type="number"
                      min={0.01}
                      step={0.01}
                      value={buyLimitPrice}
                      onChange={(e) => setBuyLimitPrice(Number.parseFloat(e.target.value) || 0)}
                      className="h-12"
                    />
                    <p className="text-xs text-blue-600">
                      Order will execute when market price reaches ₹{buyLimitPrice.toFixed(2)} or better
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  <Label htmlFor="buy-quantity" className="text-sm font-medium">
                    Quantity
                  </Label>
                  <Input
                    id="buy-quantity"
                    type="number"
                    min={1}
                    max={maxBuyQuantity}
                    value={buyQuantity}
                    onChange={(e) => setBuyQuantity(Math.min(Number.parseInt(e.target.value) || 1, maxBuyQuantity))}
                    className="h-12"
                  />
                  <p className="text-xs text-gray-500">
                    Max: {maxBuyQuantity.toLocaleString()} shares with current margin
                  </p>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="buy-price" className="text-sm font-medium">
                    Price (₹)
                  </Label>
                  <Input
                    id="buy-price"
                    type="number"
                    min={0.01}
                    step={0.01}
                    value={buyPrice}
                    onChange={(e) => setBuyPrice(Number.parseFloat(e.target.value) || 0)}
                    className="h-12"
                  />
                </div>

                {/* Stop Loss & Target Price */}
                <div className="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="font-medium flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Risk Management
                  </h4>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="use-stop-loss" className="text-sm font-medium cursor-pointer">
                        Stop Loss
                      </Label>
                      <Switch id="use-stop-loss" checked={useStopLoss} onCheckedChange={setUseStopLoss} />
                    </div>

                    {useStopLoss && (
                      <div className="pl-6 border-l-2 border-red-200">
                        <Label htmlFor="stop-loss-price" className="text-sm text-gray-600">
                          Stop Loss Price (₹)
                        </Label>
                        <Input
                          id="stop-loss-price"
                          type="number"
                          min={0.01}
                          step={0.01}
                          value={stopLossPrice}
                          onChange={(e) => setStopLossPrice(Number.parseFloat(e.target.value) || 0)}
                          className="h-10 mt-1"
                        />
                        <p className="text-xs text-red-600 mt-1">
                          Will sell if price falls below ₹{stopLossPrice.toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="use-target" className="text-sm font-medium cursor-pointer">
                        Target Price
                      </Label>
                      <Switch id="use-target" checked={useTarget} onCheckedChange={setUseTarget} />
                    </div>

                    {useTarget && (
                      <div className="pl-6 border-l-2 border-green-200">
                        <Label htmlFor="target-price" className="text-sm text-gray-600">
                          Target Price (₹)
                        </Label>
                        <Input
                          id="target-price"
                          type="number"
                          min={0.01}
                          step={0.01}
                          value={targetPrice}
                          onChange={(e) => setTargetPrice(Number.parseFloat(e.target.value) || 0)}
                          className="h-10 mt-1"
                        />
                        <p className="text-xs text-green-600 mt-1">
                          Will sell if price rises above ₹{targetPrice.toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg border border-green-200 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-green-700 font-medium">Order Type:</span>
                    <span className="font-bold text-green-800">{buyExecutionType.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-green-700 font-medium">
                      {buyExecutionType === "market" ? "Estimated Cost:" : "Total Cost (if executed):"}
                    </span>
                    <span className="font-bold text-green-800">
                      ₹{(buyQuantity * (buyExecutionType === "market" ? buyPrice : buyLimitPrice)).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-green-700 font-medium">Margin Used:</span>
                    <span className="font-bold text-green-800">
                      ₹
                      {((buyQuantity * (buyExecutionType === "market" ? buyPrice : buyLimitPrice)) / margin).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-green-700 font-medium">Available Balance:</span>
                    <span className="font-bold text-green-800">₹{user.balance.toFixed(2)}</span>
                  </div>
                  {buyExecutionType === "limit" && (
                    <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                      💡 Limit order will wait until market price reaches your limit price
                    </div>
                  )}
                </div>

                <Button
                  className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold"
                  onClick={handleBuy}
                  disabled={
                    buyQuantity <= 0 ||
                    (buyExecutionType === "limit" ? buyLimitPrice <= 0 : buyPrice <= 0) ||
                    (buyQuantity * (buyExecutionType === "market" ? buyPrice : buyLimitPrice)) / margin >
                      user.balance ||
                    !selectedStock
                  }
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  {buyExecutionType === "market" ? "Buy Now" : "Place Limit Order"} - {buyQuantity} Shares
                </Button>
              </TabsContent>

              <TabsContent value="sell" className="space-y-4 pt-4">
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Order Type</Label>
                  <Select
                    value={sellExecutionType}
                    onValueChange={(value: "market" | "limit") => setSellExecutionType(value)}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="market">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          <span>Market Order</span>
                          <span className="text-xs text-gray-500">(Execute immediately)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="limit">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span>Limit Order</span>
                          <span className="text-xs text-gray-500">(Execute at specific price)</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {sellExecutionType === "limit" && (
                  <div className="space-y-3">
                    <Label htmlFor="sell-limit-price" className="text-sm font-medium">
                      Limit Price (₹)
                    </Label>
                    <Input
                      id="sell-limit-price"
                      type="number"
                      min={0.01}
                      step={0.01}
                      value={sellLimitPrice}
                      onChange={(e) => setSellLimitPrice(Number.parseFloat(e.target.value) || 0)}
                      className="h-12"
                    />
                    <p className="text-xs text-blue-600">
                      Order will execute when market price reaches ₹{sellLimitPrice.toFixed(2)} or better
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  <Label htmlFor="sell-quantity" className="text-sm font-medium">
                    Quantity
                  </Label>
                  <Input
                    id="sell-quantity"
                    type="number"
                    min={1}
                    value={sellQuantity}
                    onChange={(e) => setSellQuantity(Number.parseInt(e.target.value) || 1)}
                    className="h-12"
                  />
                  {currentHolding && currentHolding.quantity > 0 && (
                    <p className="text-xs text-gray-500">Available: {currentHolding.quantity} shares</p>
                  )}
                  {(!currentHolding || currentHolding.quantity <= 0) && (
                    <p className="text-xs text-orange-600">Short selling: You don't own this stock</p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="sell-price" className="text-sm font-medium">
                    Price (₹)
                  </Label>
                  <Input
                    id="sell-price"
                    type="number"
                    min={0.01}
                    step={0.01}
                    value={sellPrice}
                    onChange={(e) => setSellPrice(Number.parseFloat(e.target.value) || 0)}
                    className="h-12"
                  />
                </div>

                {/* Stop Loss & Target Price for Sell Orders */}
                <div className="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="font-medium flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Risk Management
                  </h4>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="use-stop-loss-sell" className="text-sm font-medium cursor-pointer">
                        Stop Loss
                      </Label>
                      <Switch id="use-stop-loss-sell" checked={useStopLoss} onCheckedChange={setUseStopLoss} />
                    </div>

                    {useStopLoss && (
                      <div className="pl-6 border-l-2 border-red-200">
                        <Label htmlFor="stop-loss-price-sell" className="text-sm text-gray-600">
                          Stop Loss Price (₹)
                        </Label>
                        <Input
                          id="stop-loss-price-sell"
                          type="number"
                          min={0.01}
                          step={0.01}
                          value={stopLossPrice}
                          onChange={(e) => setStopLossPrice(Number.parseFloat(e.target.value) || 0)}
                          className="h-10 mt-1"
                        />
                        <p className="text-xs text-red-600 mt-1">
                          Will buy if price rises above ₹{stopLossPrice.toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="use-target-sell" className="text-sm font-medium cursor-pointer">
                        Target Price
                      </Label>
                      <Switch id="use-target-sell" checked={useTarget} onCheckedChange={setUseTarget} />
                    </div>

                    {useTarget && (
                      <div className="pl-6 border-l-2 border-green-200">
                        <Label htmlFor="target-price-sell" className="text-sm text-gray-600">
                          Target Price (₹)
                        </Label>
                        <Input
                          id="target-price-sell"
                          type="number"
                          min={0.01}
                          step={0.01}
                          value={targetPrice}
                          onChange={(e) => setTargetPrice(Number.parseFloat(e.target.value) || 0)}
                          className="h-10 mt-1"
                        />
                        <p className="text-xs text-green-600 mt-1">
                          Will buy if price falls below ₹{targetPrice.toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-red-50 p-4 rounded-lg border border-red-200 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-red-700 font-medium">Total Value:</span>
                    <span className="font-bold text-red-800">₹{(sellQuantity * sellPrice).toFixed(2)}</span>
                  </div>
                  {currentHolding && currentHolding.quantity > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-red-700 font-medium">Profit/Loss:</span>
                      <span
                        className={`font-bold ${
                          sellPrice > currentHolding.averageBuyPrice ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        ₹{((sellPrice - currentHolding.averageBuyPrice) * sellQuantity).toFixed(2)}
                      </span>
                    </div>
                  )}
                  {(!currentHolding || currentHolding.quantity <= 0) && (
                    <div className="flex justify-between">
                      <span className="text-sm text-red-700 font-medium">Short Position:</span>
                      <span className="font-bold text-orange-600">₹{(sellQuantity * sellPrice).toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <Button
                  className="w-full h-12 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-semibold"
                  onClick={handleSell}
                  disabled={sellQuantity <= 0 || sellPrice <= 0}
                >
                  <TrendingDown className="w-4 h-4 mr-2" />
                  Sell {sellQuantity} Shares
                </Button>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
