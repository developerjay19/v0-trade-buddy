"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { Stock, User, Holding, Transaction, Order, Notification } from "./types"
import { v4 as uuidv4 } from "uuid"

interface TradingContextType {
  stocks: Stock[]
  user: User
  selectedStock: Stock | null
  margin: number
  notifications: Notification[]
  setMargin: (margin: number) => void
  selectStock: (stockId: string) => void
  createStock: (stock: Omit<Stock, "id" | "history" | "volume" | "availableShares" | "currentValue">) => void
  createOrder: (order: Omit<Order, "id" | "createdAt" | "updatedAt" | "status">) => void
  cancelOrder: (orderId: string) => void
  editHolding: (holdingId: string, updates: { stopLossPrice?: number; takeProfitPrice?: number }) => void
  closePosition: (holdingId: string) => void
  resetAccount: () => void
  updatePrices: () => void
  deleteStock: (stockId: string) => void
  addNotification: (notification: Omit<Notification, "id" | "timestamp" | "read">) => void
  markNotificationRead: (notificationId: string) => void
  clearNotifications: () => void
}

const defaultUser: User = {
  balance: 100000,
  holdings: [],
  orders: [],
  transactions: [],
}

const TradingContext = createContext<TradingContextType | undefined>(undefined)

export function TradingProvider({ children }: { children: React.ReactNode }) {
  const [stocks, setStocks] = useState<Stock[]>([])
  const [user, setUser] = useState<User>(defaultUser)
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
    setNotifications((prev) => [newNotification, ...prev].slice(0, 50)) // Keep only last 50 notifications
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
      message: `${newStock.name} has been successfully listed on the exchange.`,
    })

    // If no stock is selected, select the new one
    if (!selectedStock) {
      setSelectedStock(newStock)
    }
  }

  // Delete a stock
  const deleteStock = (stockId: string) => {
    const stock = stocks.find((s) => s.id === stockId)
    setStocks((prevStocks) => prevStocks.filter((s) => s.id !== stockId))

    // If the deleted stock was selected, clear selection
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
        message: `${stock.name} has been removed from the exchange.`,
      })
    }
  }

  // Create order
  const createOrder = (orderData: Omit<Order, "id" | "createdAt" | "updatedAt" | "status">) => {
    const stock = stocks.find((s) => s.id === orderData.stockId)
    if (!stock) return

    const newOrder: Order = {
      id: uuidv4(),
      status: orderData.executionType === "market" ? "pending" : "open",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ...orderData,
      symbol: stock.name.toUpperCase().slice(0, 4),
    }

    setUser((prevUser) => ({
      ...prevUser,
      orders: [...prevUser.orders, newOrder],
    }))

    // If it's a market order, execute immediately
    if (orderData.executionType === "market") {
      setTimeout(() => executeOrder(newOrder.id), 100) // Small delay to ensure order is saved
    }

    addNotification({
      type: "info",
      title: "Order Placed",
      message: `${newOrder.executionType.toUpperCase()} ${newOrder.orderType.toUpperCase()} order for ${newOrder.quantity} shares of ${stock.name} has been placed.`,
    })
  }

  // Execute order with proper position management
  const executeOrder = (orderId: string) => {
    const order = user.orders.find((o) => o.id === orderId)
    const stock = stocks.find((s) => s.id === order?.stockId)

    if (!order || !stock) return
    if (order.status === "executed" || order.status === "cancelled") return

    // Determine execution price
    let executionPrice: number
    if (order.executionType === "market") {
      executionPrice = stock.currentValue
    } else if (order.executionType === "limit" && order.limitPrice) {
      executionPrice = order.limitPrice
    } else if (order.orderType === "stoploss" && order.stopPrice) {
      executionPrice = stock.currentValue // Execute at market price when stop is triggered
    } else if (order.orderType === "take_profit" && order.takeProfitPrice) {
      executionPrice = stock.currentValue // Execute at market price when target is hit
    } else {
      executionPrice = stock.currentValue
    }

    const totalCost = executionPrice * order.quantity
    const marginAdjustedCost = totalCost / margin

    // Check if user has enough balance for buy orders
    if (order.orderType === "buy" && user.balance < marginAdjustedCost) {
      setUser((prevUser) => ({
        ...prevUser,
        orders: prevUser.orders.map((o) =>
          o.id === orderId ? { ...o, status: "cancelled", updatedAt: Date.now() } : o,
        ),
      }))

      addNotification({
        type: "error",
        title: "Order Cancelled",
        message: `Insufficient balance to execute ${order.orderType} order for ${stock.name}.`,
      })
      return
    }

    // Update stock price based on market impact
    const priceImpact = (stock.priceEvolution / 100) * stock.initialValue * (order.quantity / 100)
    const newPrice =
      order.orderType === "buy"
        ? Math.max(stock.currentValue + priceImpact, 0.01)
        : Math.max(stock.currentValue - priceImpact, 0.01)

    setStocks((prevStocks) =>
      prevStocks.map((s) =>
        s.id === stock.id
          ? {
              ...s,
              currentValue: newPrice,
              availableShares:
                order.orderType === "buy" ? s.availableShares - order.quantity : s.availableShares + order.quantity,
              history: [...s.history, { timestamp: Date.now(), price: newPrice }],
              volume: [
                ...s.volume,
                { timestamp: Date.now(), volume: order.quantity, type: order.orderType === "buy" ? "buy" : "sell" },
              ],
            }
          : s,
      ),
    )

    // Position Management Logic
    const existingHolding = user.holdings.find((h) => h.stockId === order.stockId && h.status === "open")
    let updatedHoldings = [...user.holdings]
    let holdingId = existingHolding?.id

    if (order.orderType === "buy") {
      if (existingHolding) {
        if (existingHolding.positionType === "short") {
          // Covering short position
          const newQuantity = existingHolding.quantity - order.quantity
          if (newQuantity <= 0) {
            // Close or reverse position
            const realizedPnL = (existingHolding.averageEntryPrice - executionPrice) * existingHolding.quantity

            if (newQuantity === 0) {
              // Exactly close the position
              updatedHoldings = updatedHoldings.map((h) =>
                h.id === existingHolding.id
                  ? {
                      ...h,
                      status: "closed",
                      averageExitPrice: executionPrice,
                      realizedPnL: realizedPnL,
                      updatedAt: Date.now(),
                    }
                  : h,
              )
            } else {
              // Close short and open long position
              updatedHoldings = updatedHoldings.map((h) =>
                h.id === existingHolding.id
                  ? {
                      ...h,
                      status: "closed",
                      averageExitPrice: executionPrice,
                      realizedPnL: realizedPnL,
                      updatedAt: Date.now(),
                    }
                  : h,
              )

              // Create new long position
              const newHolding: Holding = {
                id: uuidv4(),
                stockId: order.stockId,
                symbol: stock.name.toUpperCase().slice(0, 4),
                status: "open",
                positionType: "long",
                quantity: Math.abs(newQuantity),
                averageEntryPrice: executionPrice,
                unrealizedPnL: 0,
                realizedPnL: 0,
                leverage: margin,
                marginUsed: (Math.abs(newQuantity) * executionPrice) / margin,
                createdAt: Date.now(),
                updatedAt: Date.now(),
              }
              updatedHoldings.push(newHolding)
              holdingId = newHolding.id
            }
          } else {
            // Reduce short position
            updatedHoldings = updatedHoldings.map((h) =>
              h.id === existingHolding.id
                ? {
                    ...h,
                    quantity: newQuantity,
                    updatedAt: Date.now(),
                  }
                : h,
            )
          }
        } else {
          // Adding to long position
          const totalQuantity = existingHolding.quantity + order.quantity
          const totalCost =
            existingHolding.quantity * existingHolding.averageEntryPrice + order.quantity * executionPrice
          updatedHoldings = updatedHoldings.map((h) =>
            h.id === existingHolding.id
              ? {
                  ...h,
                  quantity: totalQuantity,
                  averageEntryPrice: totalCost / totalQuantity,
                  marginUsed: h.marginUsed + marginAdjustedCost,
                  updatedAt: Date.now(),
                }
              : h,
          )
        }
      } else {
        // Create new long position
        const newHolding: Holding = {
          id: uuidv4(),
          stockId: order.stockId,
          symbol: stock.name.toUpperCase().slice(0, 4),
          status: "open",
          positionType: "long",
          quantity: order.quantity,
          averageEntryPrice: executionPrice,
          unrealizedPnL: 0,
          realizedPnL: 0,
          leverage: margin,
          marginUsed: marginAdjustedCost,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
        updatedHoldings.push(newHolding)
        holdingId = newHolding.id
      }
    } else {
      // Sell order logic
      if (existingHolding && existingHolding.positionType === "long") {
        if (existingHolding.quantity <= order.quantity) {
          // Close or reverse long position
          const realizedPnL = (executionPrice - existingHolding.averageEntryPrice) * existingHolding.quantity

          if (existingHolding.quantity === order.quantity) {
            // Exactly close the position
            updatedHoldings = updatedHoldings.map((h) =>
              h.id === existingHolding.id
                ? {
                    ...h,
                    status: "closed",
                    averageExitPrice: executionPrice,
                    realizedPnL: realizedPnL,
                    updatedAt: Date.now(),
                  }
                : h,
            )
          } else {
            // Close long and open short position
            updatedHoldings = updatedHoldings.map((h) =>
              h.id === existingHolding.id
                ? {
                    ...h,
                    status: "closed",
                    averageExitPrice: executionPrice,
                    realizedPnL: realizedPnL,
                    updatedAt: Date.now(),
                  }
                : h,
            )

            // Create new short position
            const remainingQuantity = order.quantity - existingHolding.quantity
            const newHolding: Holding = {
              id: uuidv4(),
              stockId: order.stockId,
              symbol: stock.name.toUpperCase().slice(0, 4),
              status: "open",
              positionType: "short",
              quantity: remainingQuantity,
              averageEntryPrice: executionPrice,
              unrealizedPnL: 0,
              realizedPnL: 0,
              leverage: margin,
              marginUsed: (remainingQuantity * executionPrice) / margin,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            }
            updatedHoldings.push(newHolding)
            holdingId = newHolding.id
          }
        } else {
          // Reduce long position
          updatedHoldings = updatedHoldings.map((h) =>
            h.id === existingHolding.id
              ? {
                  ...h,
                  quantity: h.quantity - order.quantity,
                  updatedAt: Date.now(),
                }
              : h,
          )
        }
      } else {
        // Create new short position or add to existing short
        if (existingHolding && existingHolding.positionType === "short") {
          const totalQuantity = existingHolding.quantity + order.quantity
          const totalCost =
            existingHolding.quantity * existingHolding.averageEntryPrice + order.quantity * executionPrice
          updatedHoldings = updatedHoldings.map((h) =>
            h.id === existingHolding.id
              ? {
                  ...h,
                  quantity: totalQuantity,
                  averageEntryPrice: totalCost / totalQuantity,
                  marginUsed: h.marginUsed + marginAdjustedCost,
                  updatedAt: Date.now(),
                }
              : h,
          )
        } else {
          const newHolding: Holding = {
            id: uuidv4(),
            stockId: order.stockId,
            symbol: stock.name.toUpperCase().slice(0, 4),
            status: "open",
            positionType: "short",
            quantity: order.quantity,
            averageEntryPrice: executionPrice,
            unrealizedPnL: 0,
            realizedPnL: 0,
            leverage: margin,
            marginUsed: marginAdjustedCost,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          }
          updatedHoldings.push(newHolding)
          holdingId = newHolding.id
        }
      }
    }

    // Create transaction
    const transaction: Transaction = {
      id: uuidv4(),
      stockId: order.stockId,
      stockName: stock.name,
      type: order.orderType === "buy" ? "buy" : "sell",
      quantity: order.quantity,
      price: executionPrice,
      margin: margin,
      timestamp: Date.now(),
      total: totalCost,
      orderId: order.id,
    }

    // Update user
    setUser((prevUser) => ({
      ...prevUser,
      balance:
        order.orderType === "buy" ? prevUser.balance - marginAdjustedCost : prevUser.balance + totalCost / margin,
      holdings: updatedHoldings,
      orders: prevUser.orders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: "executed",
              executedAt: Date.now(),
              executedPrice: executionPrice,
              updatedAt: Date.now(),
              holdingId: holdingId,
            }
          : o,
      ),
      transactions: [...prevUser.transactions, transaction],
    }))

    addNotification({
      type: "success",
      title: "Order Executed",
      message: `${order.orderType.toUpperCase()} order for ${order.quantity} shares of ${stock.name} executed at ₹${executionPrice.toFixed(2)}.`,
    })
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
      message: `${order.orderType.toUpperCase()} order for ${order.symbol} has been cancelled.`,
    })
  }

  // Check for order triggers (updated logic)
  const checkOrderTriggers = (currentStocks: Stock[]) => {
    const triggeredOrders: string[] = []

    user.orders.forEach((order) => {
      if (order.status !== "open") return

      const stock = currentStocks.find((s) => s.id === order.stockId)
      if (!stock) return

      let shouldTrigger = false

      // Check limit orders
      if (order.executionType === "limit" && order.limitPrice) {
        if (order.orderType === "buy" && stock.currentValue <= order.limitPrice) {
          shouldTrigger = true
        } else if (order.orderType === "sell" && stock.currentValue >= order.limitPrice) {
          shouldTrigger = true
        }
      }

      // Check stop loss orders
      if (order.orderType === "stoploss" && order.stopPrice) {
        const holding = user.holdings.find((h) => h.id === order.holdingId && h.status === "open")
        if (holding) {
          if (holding.positionType === "long" && stock.currentValue <= order.stopPrice) {
            shouldTrigger = true
          } else if (holding.positionType === "short" && stock.currentValue >= order.stopPrice) {
            shouldTrigger = true
          }
        }
      }

      // Check take profit orders
      if (order.orderType === "take_profit" && order.takeProfitPrice) {
        const holding = user.holdings.find((h) => h.id === order.holdingId && h.status === "open")
        if (holding) {
          if (holding.positionType === "long" && stock.currentValue >= order.takeProfitPrice) {
            shouldTrigger = true
          } else if (holding.positionType === "short" && stock.currentValue <= order.takeProfitPrice) {
            shouldTrigger = true
          }
        }
      }

      if (shouldTrigger) {
        triggeredOrders.push(order.id)
      }
    })

    // Execute triggered orders
    triggeredOrders.forEach((orderId) => {
      const order = user.orders.find((o) => o.id === orderId)
      if (order) {
        setUser((prevUser) => ({
          ...prevUser,
          orders: prevUser.orders.map((o) =>
            o.id === orderId ? { ...o, status: "triggered", updatedAt: Date.now() } : o,
          ),
        }))

        addNotification({
          type: "info",
          title: "Order Triggered",
          message: `${order.orderType.toUpperCase()} order for ${order.symbol} has been triggered and is executing.`,
        })

        setTimeout(() => executeOrder(orderId), 500) // Small delay for better UX
      }
    })
  }

  // Edit holding (stop loss and take profit)
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
      title: "Position Updated",
      message: `Stop loss and take profit levels updated for ${holding.symbol}.`,
    })
  }

  // Close position
  const closePosition = (holdingId: string) => {
    const holding = user.holdings.find((h) => h.id === holdingId)
    const stock = stocks.find((s) => s.id === holding?.stockId)

    if (!holding || !stock || holding.status !== "open") return

    // Create market order to close position
    const closeOrder: Order = {
      id: uuidv4(),
      stockId: holding.stockId,
      symbol: holding.symbol,
      orderType: holding.positionType === "long" ? "sell" : "buy",
      executionType: "market",
      status: "pending",
      quantity: holding.quantity,
      holdingId: holdingId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    setUser((prevUser) => ({
      ...prevUser,
      orders: [...prevUser.orders, closeOrder],
    }))

    // Execute the close order immediately
    executeOrder(closeOrder.id)

    addNotification({
      type: "info",
      title: "Position Closed",
      message: `${holding.positionType.toUpperCase()} position in ${holding.symbol} has been closed.`,
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
      message: "Your trading account has been reset to default settings.",
    })
  }

  // Update prices and check for order triggers
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

    // Check for order triggers
    checkOrderTriggers(updatedStocks)

    // Update unrealized P&L for open holdings
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
          holding.positionType === "long"
            ? (stock.currentValue - holding.averageEntryPrice) * holding.quantity
            : (holding.averageEntryPrice - stock.currentValue) * holding.quantity

        return {
          ...holding,
          unrealizedPnL,
        }
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
        closePosition,
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
