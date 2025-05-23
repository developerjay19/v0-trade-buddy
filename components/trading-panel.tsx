"use client"

import { useState, useEffect } from "react"
import { useTrading } from "@/lib/trading-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TrendingUp, TrendingDown } from "lucide-react"

export function TradingPanel() {
  const { stocks, user, selectedStock, margin, setMargin, selectStock, buyStock, sellStock } = useTrading()

  const [buyQuantity, setBuyQuantity] = useState<number>(1)
  const [sellQuantity, setSellQuantity] = useState<number>(1)
  const [buyPrice, setBuyPrice] = useState<number>(0)
  const [sellPrice, setSellPrice] = useState<number>(0)

  // Update prices when selected stock changes
  useEffect(() => {
    if (selectedStock) {
      setBuyPrice(selectedStock.currentValue)
      setSellPrice(selectedStock.currentValue)
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
      ? (pnl / (currentHolding.quantity * currentHolding.averageBuyPrice)) * 100
      : 0

  // Calculate margin used
  const buyMarginUsed = (buyQuantity * buyPrice) / margin
  const maxBuyQuantity = Math.floor((user.balance * margin) / (selectedStock?.currentValue || 1))

  // Handle buy
  const handleBuy = () => {
    if (!selectedStock) return
    buyStock(selectedStock.id, buyQuantity, buyPrice)
  }

  // Handle sell
  const handleSell = () => {
    if (!selectedStock) return
    sellStock(selectedStock.id, sellQuantity, sellPrice)
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Trading Panel</CardTitle>
        <CardDescription>Buy and sell stocks</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Account Info */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Account</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted p-3 rounded-md">
                <div className="text-sm text-muted-foreground">Balance</div>
                <div className="text-xl font-bold">₹{user.balance.toFixed(2)}</div>
              </div>
              <div className="bg-muted p-3 rounded-md">
                <div className="text-sm text-muted-foreground">Margin</div>
                <div className="text-xl font-bold">{margin}x</div>
              </div>
            </div>
            <div className="pt-2">
              <Label htmlFor="margin-slider" className="text-sm">
                Margin Multiplier: {margin}x
              </Label>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-sm">1x</span>
                <Slider
                  id="margin-slider"
                  min={1}
                  max={10}
                  step={1}
                  value={[margin]}
                  onValueChange={(value) => setMargin(value[0])}
                  className="flex-1"
                />
                <span className="text-sm">10x</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Higher margin increases buying power but also increases risk.
              </p>
            </div>
          </div>

          {/* Stock Selection */}
          <div className="space-y-2">
            <Label htmlFor="stock-select">Select Stock</Label>
            <Select value={selectedStock?.id || ""} onValueChange={(value) => selectStock(value)}>
              <SelectTrigger id="stock-select">
                <SelectValue placeholder="Select a stock" />
              </SelectTrigger>
              <SelectContent>
                {stocks.map((stock) => (
                  <SelectItem key={stock.id} value={stock.id}>
                    {stock.name} - ₹{stock.currentValue.toFixed(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Current Holding */}
          {selectedStock && (
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Current Position</h3>
              {currentHolding ? (
                <div className="bg-muted p-3 rounded-md space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-sm text-muted-foreground">Quantity</div>
                      <div className="font-medium">{currentHolding.quantity} shares</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Avg. Buy Price</div>
                      <div className="font-medium">₹{currentHolding.averageBuyPrice.toFixed(2)}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-sm text-muted-foreground">Current Value</div>
                      <div className="font-medium">
                        ₹{(currentHolding.quantity * selectedStock.currentValue).toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Profit/Loss</div>
                      <div className={`font-medium flex items-center ${pnl >= 0 ? "text-green-500" : "text-red-500"}`}>
                        {pnl >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                        ₹{pnl.toFixed(2)} ({pnlPercentage.toFixed(2)}%)
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Margin Used</div>
                    <div className="font-medium">{currentHolding.margin}x</div>
                  </div>
                </div>
              ) : (
                <div className="bg-muted p-3 rounded-md">
                  <p className="text-muted-foreground">No holdings for this stock</p>
                </div>
              )}
            </div>
          )}

          {/* Trading Interface */}
          {selectedStock && (
            <Tabs defaultValue="buy" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="buy">Buy</TabsTrigger>
                <TabsTrigger value="sell">Sell</TabsTrigger>
              </TabsList>
              <TabsContent value="buy" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="buy-quantity">Quantity</Label>
                  <Input
                    id="buy-quantity"
                    type="number"
                    min={1}
                    max={maxBuyQuantity}
                    value={buyQuantity}
                    onChange={(e) => setBuyQuantity(Math.min(Number.parseInt(e.target.value) || 1, maxBuyQuantity))}
                  />
                  <p className="text-xs text-muted-foreground">Max: {maxBuyQuantity} shares with current margin</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="buy-price">Price (₹)</Label>
                  <Input
                    id="buy-price"
                    type="number"
                    min={0.01}
                    step={0.01}
                    value={buyPrice}
                    onChange={(e) => setBuyPrice(Number.parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="bg-muted p-3 rounded-md space-y-1">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Cost:</span>
                    <span className="font-medium">₹{(buyQuantity * buyPrice).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Margin Used:</span>
                    <span className="font-medium">₹{buyMarginUsed.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Available Balance:</span>
                    <span className="font-medium">₹{user.balance.toFixed(2)}</span>
                  </div>
                </div>
                <Button
                  className="w-full"
                  onClick={handleBuy}
                  disabled={buyQuantity <= 0 || buyPrice <= 0 || buyMarginUsed > user.balance || !selectedStock}
                >
                  Buy {buyQuantity} Shares
                </Button>
              </TabsContent>
              <TabsContent value="sell" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="sell-quantity">Quantity</Label>
                  <Input
                    id="sell-quantity"
                    type="number"
                    min={1}
                    max={currentHolding?.quantity || 0}
                    value={sellQuantity}
                    onChange={(e) =>
                      setSellQuantity(Math.min(Number.parseInt(e.target.value) || 1, currentHolding?.quantity || 0))
                    }
                    disabled={!currentHolding}
                  />
                  {currentHolding && (
                    <p className="text-xs text-muted-foreground">Available: {currentHolding.quantity} shares</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sell-price">Price (₹)</Label>
                  <Input
                    id="sell-price"
                    type="number"
                    min={0.01}
                    step={0.01}
                    value={sellPrice}
                    onChange={(e) => setSellPrice(Number.parseFloat(e.target.value) || 0)}
                    disabled={!currentHolding}
                  />
                </div>
                <div className="bg-muted p-3 rounded-md space-y-1">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Value:</span>
                    <span className="font-medium">₹{(sellQuantity * sellPrice).toFixed(2)}</span>
                  </div>
                  {currentHolding && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Profit/Loss:</span>
                      <span
                        className={`font-medium ${
                          sellPrice > currentHolding.averageBuyPrice ? "text-green-500" : "text-red-500"
                        }`}
                      >
                        ₹{((sellPrice - currentHolding.averageBuyPrice) * sellQuantity).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
                <Button
                  className="w-full"
                  onClick={handleSell}
                  disabled={
                    !currentHolding ||
                    sellQuantity <= 0 ||
                    sellQuantity > (currentHolding?.quantity || 0) ||
                    sellPrice <= 0
                  }
                >
                  Sell {sellQuantity} Shares
                </Button>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
