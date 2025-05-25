"use client"

import { useEffect, useState, useRef } from "react"
import type { Stock } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"
import { format } from "date-fns"

interface EnhancedGraphPanelProps {
  stock: Stock | null
}

export function EnhancedGraphPanel({ stock }: EnhancedGraphPanelProps) {
  const [timeRange, setTimeRange] = useState<"1m" | "5m" | "15m" | "1h" | "all">("15m")
  const [chartData, setChartData] = useState<any[]>([])
  const prevStockRef = useRef<Stock | null>(null)
  const chartDataRef = useRef<any[]>([])

  useEffect(() => {
    if (!stock) return

    // Filter data based on selected time range
    const now = Date.now()
    let timeLimit: number

    switch (timeRange) {
      case "1m":
        timeLimit = now - 60 * 1000 // 1 minute
        break
      case "5m":
        timeLimit = now - 5 * 60 * 1000 // 5 minutes
        break
      case "15m":
        timeLimit = now - 15 * 60 * 1000 // 15 minutes
        break
      case "1h":
        timeLimit = now - 60 * 60 * 1000 // 1 hour
        break
      case "all":
      default:
        timeLimit = 0 // All data
    }

    // Check if it's a new stock or time range changed
    if (prevStockRef.current?.id !== stock.id || chartDataRef.current.length === 0) {
      // Filter price history
      const filteredHistory = stock.history.filter((point) => point.timestamp >= timeLimit)
      const filteredVolume = stock.volume.filter((point) => point.timestamp >= timeLimit)

      // Ensure we have at least 2 data points for the chart
      const processedData =
        filteredHistory.length > 1
          ? filteredHistory
          : [...stock.history.slice(-1), { timestamp: now, price: stock.currentValue }]

      // Combine price and volume data
      const combinedData = processedData.map((point) => {
        const volumePoint = filteredVolume.find((v) => Math.abs(v.timestamp - point.timestamp) < 5000) // 5 second tolerance
        return {
          time: format(new Date(point.timestamp), timeRange === "1m" || timeRange === "5m" ? "HH:mm:ss" : "HH:mm"),
          price: point.price,
          volume: volumePoint?.volume || 0,
          volumeType: volumePoint?.type || "buy",
          timestamp: point.timestamp,
        }
      })

      setChartData(combinedData)
      chartDataRef.current = combinedData
    } else if (prevStockRef.current?.id === stock.id) {
      // Only add the latest data point if it's newer than what we have
      const latestHistoryPoint = stock.history[stock.history.length - 1]
      const latestChartPoint = chartDataRef.current[chartDataRef.current.length - 1]

      if (
        latestHistoryPoint &&
        (!latestChartPoint || latestHistoryPoint.timestamp > latestChartPoint.timestamp) &&
        latestHistoryPoint.timestamp >= timeLimit
      ) {
        // Find matching volume data
        const volumePoint = stock.volume.find((v) => Math.abs(v.timestamp - latestHistoryPoint.timestamp) < 5000)

        // Create new data point
        const newPoint = {
          time: format(
            new Date(latestHistoryPoint.timestamp),
            timeRange === "1m" || timeRange === "5m" ? "HH:mm:ss" : "HH:mm",
          ),
          price: latestHistoryPoint.price,
          volume: volumePoint?.volume || 0,
          volumeType: volumePoint?.type || "buy",
          timestamp: latestHistoryPoint.timestamp,
        }

        // Add to chart data and remove old points outside time range
        const updatedChartData = [...chartDataRef.current, newPoint].filter((point) => point.timestamp >= timeLimit)

        setChartData(updatedChartData)
        chartDataRef.current = updatedChartData
      }
    }

    prevStockRef.current = stock
  }, [stock, timeRange])

  if (!stock) {
    return (
      <Card className="h-full shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
          <CardTitle>Stock Chart</CardTitle>
          <CardDescription className="text-indigo-100">Select a stock to view its chart</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[600px]">
          <p className="text-muted-foreground">No stock selected</p>
        </CardContent>
      </Card>
    )
  }

  const priceChange = stock.history.length > 1 ? stock.currentValue - stock.history[stock.history.length - 2].price : 0
  const priceChangePercent =
    stock.history.length > 1 ? (priceChange / stock.history[stock.history.length - 2].price) * 100 : 0

  return (
    <Card className="h-full shadow-lg border-0">
      <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-2xl">{stock.name}</CardTitle>
            <div className="flex items-center gap-4 mt-2">
              <div className="text-3xl font-bold">₹{stock.currentValue.toFixed(2)}</div>
              <div className={`flex items-center gap-1 ${priceChange >= 0 ? "text-green-200" : "text-red-200"}`}>
                <span>
                  {priceChange >= 0 ? "+" : ""}₹{priceChange.toFixed(2)}
                </span>
                <span>
                  ({priceChangePercent >= 0 ? "+" : ""}
                  {priceChangePercent.toFixed(2)}%)
                </span>
              </div>
            </div>
            <CardDescription className="text-indigo-100 mt-1">
              Initial: ₹{stock.initialValue.toFixed(2)} | Available: {stock.availableShares.toLocaleString()} shares
            </CardDescription>
          </div>
          <div>
            <Tabs
              value={timeRange}
              onValueChange={(value) => setTimeRange(value as "1m" | "5m" | "15m" | "1h" | "all")}
            >
              <TabsList className="bg-white/20 border-white/30">
                <TabsTrigger value="1m" className="data-[state=active]:bg-white data-[state=active]:text-indigo-600">
                  1m
                </TabsTrigger>
                <TabsTrigger value="5m" className="data-[state=active]:bg-white data-[state=active]:text-indigo-600">
                  5m
                </TabsTrigger>
                <TabsTrigger value="15m" className="data-[state=active]:bg-white data-[state=active]:text-indigo-600">
                  15m
                </TabsTrigger>
                <TabsTrigger value="1h" className="data-[state=active]:bg-white data-[state=active]:text-indigo-600">
                  1h
                </TabsTrigger>
                <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:text-indigo-600">
                  All
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[600px]">
          {/* Price Chart */}
          <div className="h-[400px] p-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                <XAxis dataKey="time" tick={{ fontSize: 12 }} stroke="#6366f1" />
                <YAxis
                  domain={["auto", "auto"]}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `₹${value}`}
                  stroke="#6366f1"
                />
                <Tooltip
                  formatter={(value) => [`₹${Number(value).toFixed(2)}`, "Price"]}
                  labelFormatter={(label) => `Time: ${label}`}
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "none",
                    borderRadius: "8px",
                    color: "white",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="#6366f1"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 6, fill: "#6366f1" }}
                  isAnimationActive={false} // Disable animation for smoother updates
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Volume Chart */}
          <div className="h-[200px] p-4 border-t">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                <XAxis dataKey="time" tick={{ fontSize: 12 }} stroke="#6366f1" />
                <YAxis tick={{ fontSize: 12 }} stroke="#6366f1" />
                <Tooltip
                  formatter={(value, name) => [`${Number(value)} shares`, name === "volume" ? "Volume" : name]}
                  labelFormatter={(label) => `Time: ${label}`}
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "none",
                    borderRadius: "8px",
                    color: "white",
                  }}
                />
                <Bar
                  dataKey="volume"
                  fill={(entry: any) => (entry.volumeType === "buy" ? "#10b981" : "#ef4444")}
                  name="Volume"
                  isAnimationActive={false} // Disable animation for smoother updates
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
