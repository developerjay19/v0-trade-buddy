"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useTrading } from "@/lib/trading-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, BarChart3, Home, PlusCircle } from "lucide-react"

export default function CreateStockPage() {
  const router = useRouter()
  const { createStock } = useTrading()

  const [name, setName] = useState("")
  const [initialValue, setInitialValue] = useState<number>(1000)
  const [totalShares, setTotalShares] = useState<number>(1000)
  const [priceEvolution, setPriceEvolution] = useState<number>(0.1)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    createStock({
      name,
      initialValue,
      totalShares,
      priceEvolution,
    })

    router.push("/")
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
              <Link href="/create-stock" className="flex items-center gap-2 text-sm font-medium text-primary">
                <PlusCircle className="h-4 w-4" />
                Create Stock
              </Link>
              <Link
                href="/portfolio"
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary"
              >
                <BarChart3 className="h-4 w-4" />
                Portfolio
              </Link>
            </nav>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="container max-w-md py-6 px-4">
          <Button variant="ghost" size="sm" className="mb-4" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>Create New Stock</CardTitle>
              <CardDescription>Create a new stock that will be available for trading in the simulator.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Company Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., TechCorp"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="initial-value">Initial Value (₹)</Label>
                  <Input
                    id="initial-value"
                    type="number"
                    min={1}
                    step={1}
                    value={initialValue}
                    onChange={(e) => setInitialValue(Number.parseInt(e.target.value) || 0)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">The starting price of the stock.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="total-shares">Total Shares</Label>
                  <Input
                    id="total-shares"
                    type="number"
                    min={100}
                    step={100}
                    value={totalShares}
                    onChange={(e) => setTotalShares(Number.parseInt(e.target.value) || 0)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">The total number of shares available for trading.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price-evolution">Price Evolution (%)</Label>
                  <Input
                    id="price-evolution"
                    type="number"
                    min={0.01}
                    max={1}
                    step={0.01}
                    value={priceEvolution}
                    onChange={(e) => setPriceEvolution(Number.parseFloat(e.target.value) || 0)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    The percentage of company value that the price changes per 100 shares traded.
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={!name || initialValue <= 0 || totalShares < 100 || priceEvolution <= 0}
                >
                  Create Stock
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <div className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-background">
        <div className="grid grid-cols-3 gap-1 p-2">
          <Link href="/" className="flex flex-col items-center justify-center py-2 text-muted-foreground">
            <Home className="h-5 w-5" />
            <span className="text-xs">Trading</span>
          </Link>
          <Link href="/create-stock" className="flex flex-col items-center justify-center py-2 text-primary">
            <PlusCircle className="h-5 w-5" />
            <span className="text-xs">Create</span>
          </Link>
          <Link href="/portfolio" className="flex flex-col items-center justify-center py-2 text-muted-foreground">
            <BarChart3 className="h-5 w-5" />
            <span className="text-xs">Portfolio</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
