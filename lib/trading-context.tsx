"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { Stock, User, Holding, Transaction, Order, Notification, HoldingHistory } from "./types"
import { v4 as uuidv4 } from "uuid"

interface TradingContextType {
  stocks: Stock[]
  user: User & { holdingHistory: HoldingHistory[] }
  selectedStock: Stock | null
  margin: number
  notifications: Notification[]
  setMargin: (margin: number) => void
  selectStock: (stockId: string) => void
  createStock: (stock: Omit<Stock, "id" | "history" | "volume" | "availableShares" | "currentValue">) => void
  createOrder: (order: Omit<Order, "id" | "createdAt" | "updatedAt" | "status">) => void
  cancelOrder: (orderId: string) => void
  editHolding: (holdingId: string, updates: { stopLossPrice?: number; takeProfitPrice?: number }) => void
  closeHolding: (holdingId: string) => void
  resetAccount: () => void
  updatePrices: () => void
  deleteStock: (stockId: string) => void
  addNotification: (notification: Omit<Notification, "id" | "timestamp" | "read">) => void
  markNotificationRead: (notificationId: string) => void
  clearNotifications: () => void
}

const defaultUser: User & { holdingHistory: HoldingHistory[] } = {
  balance: 100000,
  holdings: [],
  orders: [],
  transactions: [],
  holdingHistory: [],
}

const TradingContext = createContext<TradingContextType | undefined>(undefined)

export function TradingProvider({ children }: { children: React.ReactNode }) {
  const [stocks, setStocks] = useState<Stock[]>([])
  const [user, setUser] = useState<User & { holdingHistory: HoldingHistory[] }>(defaultUser)
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null)
  const [margin, setMargin] = useState<number>(1)
  const [notifications, setNotifications] = useState<Notification[]>([])

  // Load data from localStorage on initial render
  useEffect(() => {
    const savedStocks = localStorage.getItem("stocks")
    const savedUser = localStorage.getItem("user")
    const savedNotifications = localStorage.getItem("notifications")

    if (savedStocks) {
      setStocks(JSON.parse(savedStocks))
    } else {
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

    if (savedNotifications) {
      setNotifications(JSON.parse(savedNotifications))
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

  useEffect(() => {
    localStorage.setItem("notifications", JSON.stringify(notifications))
  }, [notifications])

  // Add notification
  const addNotification = (notification: Omit<Notification, "id" | "timestamp" | "read">) => {
    const newNotification: Notification = {
      id: uuidv4(),
      timestamp: Date.now(),
      read: false,
      ...notification,
    }
    setNotifications((prev) => [newNotification, ...prev].slice(0, 50))
  }

  // Mark notification as read
  const markNotificationRead = (notificationId: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)))
  }

  // Clear all notifications
  const clearNotifications = () => {
    setNotifications([])
  }

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
    addNotification({
      type: "success",
      title: "Stock Created",
      message: `${newStock.name} has been successfully listed.`,
    })

    if (!selectedStock) {
      setSelectedStock(newStock)
    }
  }

  // Delete a stock
  const deleteStock = (stockId: string) => {
    const stock = stocks.find((s) => s.id === stockId)
    setStocks((prevStocks) => prevStocks.filter((s) => s.id !== stockId))

    if (selectedStock && selectedStock.id === stockId) {
      setSelectedStock(null)
    }

    // Cancel all orders for this stock
    setUser((prevUser) => ({
      ...prevUser,
      orders: prevUser.orders.map((order) =>
        order.stockId === stockId ? { ...order, status: "cancelled" as const, updatedAt: Date.now() } : order,
      ),
      holdings: prevUser.holdings.map((holding) =>
        holding.stockId === stockId && holding.status === "open"
          ? { ...holding, status: "closed" as const, updatedAt: Date.now() }
          : holding,
      ),
    }))

    if (stock) {
      addNotification({
        type: "info",
        title: "Stock Delisted",
        message: `${stock.name} has been removed from exchange.`,
      })
    }
  }

  // Create or update holding
  const createOrUpdateHolding = (
    stockId: string,
    orderType: "buy" | "sell",
    quantity: number,
    price: number,
    stopLossPrice?: number,
    takeProfitPrice?: number
  ): Holding | null => {
    const stock = stocks.find((s) => s.id === stockId)
    if (!stock) return null

    // Find existing open holding for this stock
    const existingHolding = user.holdings.find(
      (h) => h.stockId === stockId && h.status === "open"
    )

    if (existingHolding) {
      // Update existing holding
      const newQuantity = orderType === "buy" 
        ? existingHolding.quantity + quantity
        : existingHolding.quantity

      const newAvailableQuantity = orderType === "buy"
        ? existingHolding.availableQuantity + quantity
        : existingHolding.availableQuantity - quantity

      const newAveragePrice = orderType === "buy"
        ? ((existingHolding.quantity * existingHolding.averageEntryPrice) + (quantity * price)) / newQuantity
        : existingHolding.averageEntryPrice

      // Check if holding should be closed
      if (newAvailableQuantity <= 0) {
        // Move to history
        const holdingHistory: HoldingHistory = {
          holdingId: existingHolding.id,
          stockId: existingHolding.stockId,
          symbol: existingHolding.symbol,
          holdingType: existingHolding.holdingType,
          quantity: existingHolding.quantity,
          averageEntryPrice: existingHolding.averageEntryPrice,
          averageExitPrice: price,
          realizedPnL: existingHolding.realizedPnL,
          leverage: existingHolding.leverage,
          marginUsed: existingHolding.marginUsed,
          createdAt: existingHolding.createdAt,
          closedAt: Date.now(),
        }

        setUser((prev) => ({
          ...prev,
          holdingHistory: [...prev.holdingHistory, holdingHistory],
          holdings: prev.holdings.filter(h => h.id !== existingHolding.id)
        }))

        return null
      }

      const updatedHolding: Holding = {
        ...existingHolding,
        quantity: newQuantity,
        availableQuantity: newAvailableQuantity,
        averageEntryPrice: newAveragePrice,
        stopLossPrice: stopLossPrice || existingHolding.stopLossPrice,
        takeProfitPrice: takeProfitPrice || existingHolding.takeProfitPrice,
        updatedAt: Date.now(),
      }
      return updatedHolding
    } else {
      // Create new holding
      const newHolding: Holding = {
        id: uuidv4(),
        stockId,
        symbol: stock.name.toUpperCase().slice(0, 4),
        status: "open" as const,
        holdingType: orderType === "buy" ? "long" : "short",
        quantity: quantity,
        availableQuantity: quantity,
        averageEntryPrice: price,
        unrealizedPnL: 0,
        realizedPnL: 0,
        stopLossPrice,
        takeProfitPrice,
        leverage: margin,
        marginUsed: (quantity * price) / margin,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      return newHolding
    }
  }

  // Create order and update holding
  const createOrder = async (orderData: Omit<Order, "id" | "createdAt" | "updatedAt" | "status">) => {
    const stock = stocks.find((s) => s.id === orderData.stockId)
    if (!stock) {
      addNotification({
        type: "error",
        title: "Error",
        message: "Stock not found",
      })
      return
    }

    // For market orders, execute immediately
    if (orderData.executionType === "market") {
      const executedPrice = stock.currentValue
      const executedAt = Date.now()

      // Create or update holding for buy/sell orders
      if (orderData.orderType === "buy" || orderData.orderType === "sell") {
        const holding = createOrUpdateHolding(
          orderData.stockId,
          orderData.orderType,
          orderData.quantity,
          executedPrice,
          orderData.stopPrice,
          orderData.takeProfitPrice
        )

        if (holding) {
          // Update user holdings
          setUser((prev) => ({
            ...prev,
            holdings: [
              ...prev.holdings.filter((h) => !(h.stockId === orderData.stockId && h.status === "open")),
              holding,
            ],
          }))

          // Create executed order
          const order: Order = {
                id: uuidv4(),
            ...orderData,
            status: "executed",
            executedPrice,
            executedAt,
            holdingId: holding.id,
                createdAt: Date.now(),
                updatedAt: Date.now(),
          }

          // Create stop loss order if specified
          if (holding.stopLossPrice) {
            const stopLossOrder: Order = {
          id: uuidv4(),
              stockId: orderData.stockId,
              symbol: orderData.symbol,
              orderType: "stoploss",
              executionType: "market",
              quantity: orderData.quantity,
              stopPrice: holding.stopLossPrice,
              status: "pending",
              holdingId: holding.id,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
            setUser((prev) => ({
              ...prev,
              orders: [...prev.orders, stopLossOrder],
            }))
          }

          // Create take profit order if specified
          if (holding.takeProfitPrice) {
            const takeProfitOrder: Order = {
              id: uuidv4(),
              stockId: orderData.stockId,
              symbol: orderData.symbol,
              orderType: "take_profit",
              executionType: "market",
              quantity: orderData.quantity,
              takeProfitPrice: holding.takeProfitPrice,
              status: "pending",
              holdingId: holding.id,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            }
            setUser((prev) => ({
              ...prev,
              orders: [...prev.orders, takeProfitOrder],
            }))
          }

          // Update user orders
          setUser((prev) => ({
            ...prev,
            orders: [...prev.orders, order],
          }))

          addNotification({
            type: "success",
            title: "Order Executed",
            message: `${orderData.orderType.toUpperCase()} order executed at ₹${executedPrice.toFixed(2)}`,
          })
        }
      }
        } else {
      // For limit orders, create pending order
      const order: Order = {
            id: uuidv4(),
        ...orderData,
        status: "pending",
            createdAt: Date.now(),
            updatedAt: Date.now(),
      }

      setUser((prev) => ({
        ...prev,
        orders: [...prev.orders, order],
    }))

    addNotification({
      type: "success",
        title: "Order Created",
        message: `${orderData.orderType.toUpperCase()} limit order placed at ₹${orderData.limitPrice?.toFixed(2)}`,
    })
    }
  }

  // Cancel order
  const cancelOrder = (orderId: string) => {
    const order = user.orders.find((o) => o.id === orderId)
    if (!order) return

    setUser((prevUser) => ({
      ...prevUser,
      orders: prevUser.orders.map((o) => (o.id === orderId ? { ...o, status: "cancelled", updatedAt: Date.now() } : o)),
    }))

    addNotification({
      type: "info",
      title: "Order Cancelled",
      message: `Order for ${order.symbol} has been cancelled.`,
    })
  }

  // Edit holding
  const editHolding = (holdingId: string, updates: { stopLossPrice?: number; takeProfitPrice?: number }) => {
    const holding = user.holdings.find((h) => h.id === holdingId)
    if (!holding || holding.status !== "open") return

    setUser((prevUser) => ({
      ...prevUser,
      holdings: prevUser.holdings.map((h) => (h.id === holdingId ? { ...h, ...updates, updatedAt: Date.now() } : h)),
    }))

    // Create stop loss and take profit orders if specified
    if (updates.stopLossPrice) {
      const stopLossOrder: Order = {
        id: uuidv4(),
        stockId: holding.stockId,
        symbol: holding.symbol,
        orderType: "stoploss",
        executionType: "market",
        status: "open",
        quantity: holding.quantity,
        stopPrice: updates.stopLossPrice,
        holdingId: holdingId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      setUser((prevUser) => ({
        ...prevUser,
        orders: [...prevUser.orders, stopLossOrder],
      }))
    }

    if (updates.takeProfitPrice) {
      const takeProfitOrder: Order = {
        id: uuidv4(),
        stockId: holding.stockId,
        symbol: holding.symbol,
        orderType: "take_profit",
        executionType: "market",
        status: "open",
        quantity: holding.quantity,
        takeProfitPrice: updates.takeProfitPrice,
        holdingId: holdingId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      setUser((prevUser) => ({
        ...prevUser,
        orders: [...prevUser.orders, takeProfitOrder],
      }))
    }

    addNotification({
      type: "success",
      title: "Holding Updated",
      message: `Stop loss and take profit updated for ${holding.symbol}.`,
    })
  }

  // Close holding
  const closeHolding = (holdingId: string) => {
    const holding = user.holdings.find((h) => h.id === holdingId)
    const stock = stocks.find((s) => s.id === holding?.stockId)

    if (!holding || !stock || holding.status !== "open" || holding.availableQuantity <= 0) return

    // Create market order to close remaining quantity
    const closeOrder: Order = {
      id: uuidv4(),
      stockId: holding.stockId,
      symbol: holding.symbol,
      orderType: holding.holdingType === "long" ? "sell" : "buy",
      executionType: "market",
      status: "pending",
      quantity: holding.availableQuantity, // Use available quantity
      holdingId: holdingId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    createOrder({
      ...closeOrder,
      status: "pending",
    })

    addNotification({
      type: "info",
      title: "Closing Holding",
      message: `Creating order to close ${holding.availableQuantity} shares of ${holding.symbol}`,
    })
  }

  // Check for limit order triggers
  const checkOrderTriggers = (currentStocks: Stock[]) => {
    // Check limit orders
    const openOrders = user.orders.filter((order) => order.status === "open")
    if (openOrders.length === 0) return

    openOrders.forEach((order) => {
      const stock = currentStocks.find((s) => s.id === order.stockId)
      if (!stock) return

      if (order.executionType === "limit" && order.limitPrice) {
        if (order.orderType === "buy" && stock.currentValue <= order.limitPrice) {
          // Execute buy limit order
          executeOrder(order.id)
          createHolding(order)
        } else if (order.orderType === "sell" && stock.currentValue >= order.limitPrice) {
          // Execute sell limit order
          executeOrder(order.id)
          createHolding(order)
        }
      }
    })
  }

  // Reset account
  const resetAccount = () => {
    setUser(defaultUser)
    setNotifications([])

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
    localStorage.setItem("notifications", JSON.stringify([]))

    addNotification({
      type: "info",
      title: "Account Reset",
      message: "Trading account reset successfully.",
    })
  }

  // Update prices and check triggers
  const updatePrices = () => {
    const getVolatility = () => {
      const savedSettings = localStorage.getItem("marketSettings")
      if (savedSettings) {
        const settings = JSON.parse(savedSettings)
        return (settings.volatility || 50) / 100
      }
      return 0.5
    }

    const volatility = getVolatility()

    const updatedStocks = stocks.map((stock) => {
      const randomFactor = (Math.random() - 0.5) * 0.02 * volatility
      const priceChange = stock.initialValue * randomFactor
      const newPrice = Math.max(stock.currentValue + priceChange, 0.01)

      return {
        ...stock,
        currentValue: newPrice,
        history: [...stock.history, { timestamp: Date.now(), price: newPrice }],
      }
    })

    setStocks(updatedStocks)
    checkOrderTriggers(updatedStocks)
    updateUnrealizedPnL(updatedStocks)

    if (selectedStock) {
      const updatedSelectedStock = updatedStocks.find((s) => s.id === selectedStock.id)
      if (updatedSelectedStock) {
        setSelectedStock(updatedSelectedStock)
      }
    }
  }

  // Update unrealized P&L for open holdings
  const updateUnrealizedPnL = (currentStocks: Stock[]) => {
    setUser((prevUser) => ({
      ...prevUser,
      holdings: prevUser.holdings.map((holding) => {
        if (holding.status !== "open") return holding

        const stock = currentStocks.find((s) => s.id === holding.stockId)
        if (!stock) return holding

        const unrealizedPnL =
          holding.holdingType === "long"
            ? (stock.currentValue - holding.averageEntryPrice) * holding.quantity
            : (holding.averageEntryPrice - stock.currentValue) * holding.quantity

        return { ...holding, unrealizedPnL }
      }),
    }))
  }

  return (
    <TradingContext.Provider
      value={{
        stocks,
        user,
        selectedStock,
        margin,
        notifications,
        setMargin,
        selectStock,
        createStock,
        createOrder,
        cancelOrder,
        editHolding,
        closeHolding,
        resetAccount,
        updatePrices,
        deleteStock,
        addNotification,
        markNotificationRead,
        clearNotifications,
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
