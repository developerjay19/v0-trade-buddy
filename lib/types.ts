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
  stockId: string
  quantity: number
  averageBuyPrice: number
  margin: number
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
}

export interface User {
  balance: number
  holdings: Holding[]
  transactions: Transaction[]
}
