"use client"

import type React from "react"

import { useState } from "react"
import { useTrading } from "@/lib/trading-context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { PlusCircle, TrendingUp } from "lucide-react"

export function CreateStockModal() {
  const { createStock } = useTrading()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [initialValue, setInitialValue] = useState<number>(1000)
  const [totalShares, setTotalShares] = useState<number>(1000)
  const [priceEvolution, setPriceEvolution] = useState<number>(10)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    createStock({
      name,
      initialValue,
      totalShares,
      priceEvolution: priceEvolution / 100, // Convert percentage to decimal
    })

    // Reset form
    setName("")
    setInitialValue(1000)
    setTotalShares(1000)
    setPriceEvolution(10)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
          <PlusCircle className="h-4 w-4 mr-2" />
          Create New Stock
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Create New Stock
          </DialogTitle>
          <DialogDescription>Create a new stock that will be available for trading in the simulator.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Company Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., TechCorp, FinanceHub"
              required
              className="h-11"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="initial-value" className="text-sm font-medium">
                Initial Value (₹)
              </Label>
              <Input
                id="initial-value"
                type="number"
                min={1}
                step={1}
                value={initialValue}
                onChange={(e) => setInitialValue(Number.parseInt(e.target.value) || 0)}
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="total-shares" className="text-sm font-medium">
                Total Shares
              </Label>
              <Input
                id="total-shares"
                type="number"
                min={100}
                step={100}
                value={totalShares}
                onChange={(e) => setTotalShares(Number.parseInt(e.target.value) || 0)}
                required
                className="h-11"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Price Evolution: {priceEvolution}%</Label>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">0%</span>
              <Slider
                value={[priceEvolution]}
                onValueChange={(value) => setPriceEvolution(value[0])}
                min={0}
                max={100}
                step={1}
                className="flex-1"
              />
              <span className="text-sm text-gray-500">100%</span>
            </div>
            <p className="text-xs text-gray-500">
              The percentage of company value that the price changes per 100 shares traded.
            </p>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Stock Preview</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Market Cap:</span>
                <span className="font-semibold ml-2">₹{(initialValue * totalShares).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-gray-600">Price per Share:</span>
                <span className="font-semibold ml-2">₹{initialValue}</span>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold"
            disabled={!name || initialValue <= 0 || totalShares < 100}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Create Stock
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
