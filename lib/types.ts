export interface Stock {
  id: string
  name: string
  initialValue: number
  currentValue: number
  totalShares: number
  availableShares: number
  priceEvolution: number
  history: PricePoint[]
  volume: VolumePoint[]
}

export interface PricePoint {
  timestamp: number
  price: number
}

export interface VolumePoint {
  timestamp: number
  volume: number
  type: "buy" | "sell"
}

export interface Holding {
  id: string
  stockId: string
  symbol: string
  status: "open" | "closed"
  holdingType: "long" | "short"
  quantity: number
  availableQuantity: number
  averageEntryPrice: number
  averageExitPrice?: number
  unrealizedPnL: number
  realizedPnL: number
  stopLossPrice?: number
  takeProfitPrice?: number
  leverage: number
  marginUsed: number
  createdAt: number
  updatedAt: number
  closedAt?: number
}

export interface HoldingHistory {
  holdingId: string
  stockId: string
  symbol: string
  holdingType: "long" | "short"
  quantity: number
  averageEntryPrice: number
  averageExitPrice: number
  realizedPnL: number
  leverage: number
  marginUsed: number
  createdAt: number
  closedAt: number
}

export interface Order {
  id: string
  stockId: string
  symbol: string
  orderType: "buy" | "sell" | "stoploss" | "take_profit"
  executionType: "market" | "limit"
  status: "pending" | "open" | "executed" | "cancelled" | "triggered"
  quantity: number
  limitPrice?: number
  stopPrice?: number
  takeProfitPrice?: number
  createdAt: number
  updatedAt: number
  executedAt?: number
  executedPrice?: number
  holdingId?: string
}

export interface Transaction {
  id: string
  stockId: string
  stockName: string
  type: "buy" | "sell"
  quantity: number
  price: number
  margin: number
  timestamp: number
  total: number
  orderId?: string
}

export interface User {
  balance: number
  holdings: Holding[]
  orders: Order[]
  transactions: Transaction[]
}

export interface Notification {
  id: string
  type: "success" | "error" | "info" | "warning"
  title: string
  message: string
  timestamp: number
  read: boolean
}
