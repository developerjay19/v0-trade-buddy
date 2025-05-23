"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import type { Stock, User, Holding, Transaction } from "./types"
import { v4 as uuidv4 } from "uuid"

interface TradingContextType {
  stocks: Stock[]
  user: User
  selectedStock: Stock | null
  margin: number
  setMargin: (margin: number) => void
  selectStock: (stockId: string) => void
  createStock: (stock: Omit<Stock, "id" | "history" | "volume" | "availableShares" | "currentValue">) => void
  buyStock: (stockId: string, quantity: number, price: number) => void
  sellStock: (stockId: string, quantity: number, price: number) => void
  shortSell: (stockId: string, quantity: number, price: number) => void
  resetAccount: () => void
  updatePrices: () => void
  deleteStock: (stockId: string) => void
}

const defaultUser: User = {
  balance: 1000,
  holdings: [],
  transactions: [],
}

const TradingContext = createContext<TradingContextType | undefined>(undefined)

export function TradingProvider({ children }: { children: React.ReactNode }) {
  const [stocks, setStocks] = useState<Stock[]>([])
  const [user, setUser] = useState<User>(defaultUser)
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null)
  const [margin, setMargin] = useState<number>(1)

  // Load data from localStorage on initial render
  useEffect(() => {
    const savedStocks = localStorage.getItem("stocks")
    const savedUser = localStorage.getItem("user")

    if (savedStocks) {
      setStocks(JSON.parse(savedStocks))
    } else {
      // Create some default stocks if none exist
      const defaultStocks: Stock[] = [
        {
          id: uuidv4(),
          name: "TechCorp",
          initialValue: 1000,
          currentValue: 1000,
          totalShares: 1000,
          availableShares: 1000,
          priceEvolution: 0.1,
          history: [{ timestamp: Date.now(), price: 1000 }],
          volume: [],
        },
        {
          id: uuidv4(),
          name: "FinanceHub",
          initialValue: 500,
          currentValue: 500,
          totalShares: 2000,
          availableShares: 2000,
          priceEvolution: 0.2,
          history: [{ timestamp: Date.now(), price: 500 }],
          volume: [],
        },
      ]
      setStocks(defaultStocks)
      localStorage.setItem("stocks", JSON.stringify(defaultStocks))
    }

    if (savedUser) {
      setUser(JSON.parse(savedUser))
    } else {
      localStorage.setItem("user", JSON.stringify(defaultUser))
    }
  }, [])

  // Save data to localStorage whenever it changes
  useEffect(() => {
    if (stocks.length > 0) {
      localStorage.setItem("stocks", JSON.stringify(stocks))
    }
  }, [stocks])

  useEffect(() => {
    localStorage.setItem("user", JSON.stringify(user))
  }, [user])

  // Select a stock by ID
  const selectStock = (stockId: string) => {
    const stock = stocks.find((s) => s.id === stockId)
    setSelectedStock(stock || null)
  }

  // Create a new stock
  const createStock = (stockData: Omit<Stock, "id" | "history" | "volume" | "availableShares" | "currentValue">) => {
    const newStock: Stock = {
      id: uuidv4(),
      ...stockData,
      currentValue: stockData.initialValue,
      availableShares: stockData.totalShares,
      history: [{ timestamp: Date.now(), price: stockData.initialValue }],
      volume: [],
    }

    setStocks((prevStocks) => [...prevStocks, newStock])

    // If no stock is selected, select the new one
    if (!selectedStock) {
      setSelectedStock(newStock)
    }
  }

  // Delete a stock
  const deleteStock = (stockId: string) => {
    setStocks((prevStocks) => prevStocks.filter((s) => s.id !== stockId))

    // If the deleted stock was selected, clear selection
    if (selectedStock && selectedStock.id === stockId) {
      setSelectedStock(null)
    }

    // Remove any holdings for this stock
    setUser((prevUser) => ({
      ...prevUser,
      holdings: prevUser.holdings.filter((h) => h.stockId !== stockId),
    }))
  }

  // Buy stock
  const buyStock = (stockId: string, quantity: number, price: number) => {
    const stock = stocks.find((s) => s.id === stockId)
    if (!stock || stock.availableShares < quantity) return

    const totalCost = price * quantity
    const marginAdjustedCost = totalCost / margin

    if (user.balance < marginAdjustedCost) return

    // Update stock price based on buy volume
    const priceChange = (stock.priceEvolution / 100) * stock.initialValue * (quantity / 100)
    const newPrice = stock.currentValue + priceChange

    // Update stock
    const updatedStocks = stocks.map((s) => {
      if (s.id === stockId) {
        return {
          ...s,
          currentValue: newPrice,
          availableShares: s.availableShares - quantity,
          history: [...s.history, { timestamp: Date.now(), price: newPrice }],
          volume: [...s.volume, { timestamp: Date.now(), volume: quantity, type: "buy" }],
        }
      }
      return s
    })

    // Update user holdings
    const existingHolding = user.holdings.find((h) => h.stockId === stockId)
    let updatedHoldings: Holding[]

    if (existingHolding) {
      // Update existing holding
      const totalQuantity = existingHolding.quantity + quantity
      const totalCost = existingHolding.quantity * existingHolding.averageBuyPrice + quantity * price

      updatedHoldings = user.holdings.map((h) => {
        if (h.stockId === stockId) {
          return {
            ...h,
            quantity: totalQuantity,
            averageBuyPrice: totalCost / totalQuantity,
            margin: margin,
          }
        }
        return h
      })
    } else {
      // Create new holding
      updatedHoldings = [
        ...user.holdings,
        {
          stockId,
          quantity,
          averageBuyPrice: price,
          margin,
        },
      ]
    }

    // Create transaction record
    const transaction: Transaction = {
      id: uuidv4(),
      stockId,
      stockName: stock.name,
      type: "buy",
      quantity,
      price,
      margin,
      timestamp: Date.now(),
      total: totalCost,
    }

    // Update user
    setUser({
      balance: user.balance - marginAdjustedCost,
      holdings: updatedHoldings,
      transactions: [...user.transactions, transaction],
    })

    // Update stocks
    setStocks(updatedStocks)

    // Update selected stock if it's the one being bought
    if (selectedStock && selectedStock.id === stockId) {
      setSelectedStock(updatedStocks.find((s) => s.id === stockId) || null)
    }
  }

  // Sell stock
  const sellStock = (stockId: string, quantity: number, price: number) => {
    const stock = stocks.find((s) => s.id === stockId)
    const holding = user.holdings.find((h) => h.stockId === stockId)

    if (!stock || !holding || holding.quantity < quantity) return

    // Update stock price based on sell volume
    const priceChange = (stock.priceEvolution / 100) * stock.initialValue * (quantity / 100)
    const newPrice = stock.currentValue - priceChange

    // Calculate sale proceeds
    const saleProceeds = price * quantity
    const marginAdjustedProceeds = saleProceeds / holding.margin

    // Update stock
    const updatedStocks = stocks.map((s) => {
      if (s.id === stockId) {
        return {
          ...s,
          currentValue: newPrice,
          availableShares: s.availableShares + quantity,
          history: [...s.history, { timestamp: Date.now(), price: newPrice }],
          volume: [...s.volume, { timestamp: Date.now(), volume: quantity, type: "sell" }],
        }
      }
      return s
    })

    // Update user holdings
    let updatedHoldings: Holding[]

    if (holding.quantity === quantity) {
      // Remove holding if selling all shares
      updatedHoldings = user.holdings.filter((h) => h.stockId !== stockId)
    } else {
      // Update existing holding
      updatedHoldings = user.holdings.map((h) => {
        if (h.stockId === stockId) {
          return {
            ...h,
            quantity: h.quantity - quantity,
          }
        }
        return h
      })
    }

    // Create transaction record
    const transaction: Transaction = {
      id: uuidv4(),
      stockId,
      stockName: stock.name,
      type: "sell",
      quantity,
      price,
      margin: holding.margin,
      timestamp: Date.now(),
      total: saleProceeds,
    }

    // Update user
    setUser({
      balance: user.balance + marginAdjustedProceeds,
      holdings: updatedHoldings,
      transactions: [...user.transactions, transaction],
    })

    // Update stocks
    setStocks(updatedStocks)

    // Update selected stock if it's the one being sold
    if (selectedStock && selectedStock.id === stockId) {
      setSelectedStock(updatedStocks.find((s) => s.id === stockId) || null)
    }
  }

  // Short sell (sell without owning)
  const shortSell = (stockId: string, quantity: number, price: number) => {
    const stock = stocks.find((s) => s.id === stockId)
    if (!stock) return

    // Calculate sale proceeds
    const saleProceeds = price * quantity
    const marginAdjustedProceeds = saleProceeds / margin

    // Update stock price based on sell volume
    const priceChange = (stock.priceEvolution / 100) * stock.initialValue * (quantity / 100)
    const newPrice = stock.currentValue - priceChange

    // Update stock
    const updatedStocks = stocks.map((s) => {
      if (s.id === stockId) {
        return {
          ...s,
          currentValue: newPrice,
          history: [...s.history, { timestamp: Date.now(), price: newPrice }],
          volume: [...s.volume, { timestamp: Date.now(), volume: quantity, type: "sell" }],
        }
      }
      return s
    })

    // Create negative holding for short position
    const existingHolding = user.holdings.find((h) => h.stockId === stockId)
    let updatedHoldings: Holding[]

    if (existingHolding) {
      // Update existing holding (could go negative)
      updatedHoldings = user.holdings
        .map((h) => {
          if (h.stockId === stockId) {
            const newQuantity = h.quantity - quantity
            return {
              ...h,
              quantity: newQuantity,
              averageBuyPrice: newQuantity === 0 ? 0 : h.averageBuyPrice,
              margin: margin,
            }
          }
          return h
        })
        .filter((h) => h.quantity !== 0)
    } else {
      // Create new short position (negative quantity)
      updatedHoldings = [
        ...user.holdings,
        {
          stockId,
          quantity: -quantity,
          averageBuyPrice: price,
          margin,
        },
      ]
    }

    // Create transaction record
    const transaction: Transaction = {
      id: uuidv4(),
      stockId,
      stockName: stock.name,
      type: "sell",
      quantity,
      price,
      margin,
      timestamp: Date.now(),
      total: saleProceeds,
    }

    // Update user
    setUser({
      balance: user.balance + marginAdjustedProceeds,
      holdings: updatedHoldings,
      transactions: [...user.transactions, transaction],
    })

    // Update stocks
    setStocks(updatedStocks)

    // Update selected stock if it's the one being sold
    if (selectedStock && selectedStock.id === stockId) {
      setSelectedStock(updatedStocks.find((s) => s.id === stockId) || null)
    }
  }

  // Reset account
  const resetAccount = () => {
    // Reset user to default
    setUser(defaultUser)

    // Reset stocks to their initial state
    const resetStocks = stocks.map((stock) => ({
      ...stock,
      currentValue: stock.initialValue,
      availableShares: stock.totalShares,
      history: [{ timestamp: Date.now(), price: stock.initialValue }],
      volume: [],
    }))

    setStocks(resetStocks)
    localStorage.setItem("stocks", JSON.stringify(resetStocks))
    localStorage.setItem("user", JSON.stringify(defaultUser))
  }

  // Update prices periodically (simulating market movement)
  const updatePrices = () => {
    const updatedStocks = stocks.map((stock) => {
      // Random price movement between -0.5% and +0.5% of initial value
      const randomFactor = (Math.random() - 0.5) * 0.01
      const priceChange = stock.initialValue * randomFactor
      const newPrice = Math.max(stock.currentValue + priceChange, 0.01) // Ensure price doesn't go below 0.01

      return {
        ...stock,
        currentValue: newPrice,
        history: [...stock.history, { timestamp: Date.now(), price: newPrice }],
      }
    })

    setStocks(updatedStocks)

    // Update selected stock if needed
    if (selectedStock) {
      const updatedSelectedStock = updatedStocks.find((s) => s.id === selectedStock.id)
      if (updatedSelectedStock) {
        setSelectedStock(updatedSelectedStock)
      }
    }
  }

  return (
    <TradingContext.Provider
      value={{
        stocks,
        user,
        selectedStock,
        margin,
        setMargin,
        selectStock,
        createStock,
        buyStock,
        sellStock,
        shortSell,
        resetAccount,
        updatePrices,
        deleteStock,
      }}
    >
      {children}
    </TradingContext.Provider>
  )
}

export function useTrading() {
  const context = useContext(TradingContext)
  if (context === undefined) {
    throw new Error("useTrading must be used within a TradingProvider")
  }
  return context
}
