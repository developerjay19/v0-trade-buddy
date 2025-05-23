"use client"

import { useEffect, useState } from "react"
import type { Stock } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts"
import { formatDistanceToNow } from "date-fns"

interface GraphPanelProps {
  stock: Stock | null
}

export function GraphPanel({ stock }: GraphPanelProps) {
  const [timeRange, setTimeRange] = useState<"1m" | "5m" | "15m" | "1h" | "all">("15m")
  const [chartData, setChartData] = useState<any[]>([])
  const [volumeData, setVolumeData] = useState<any[]>([])

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

    // Filter price history
    const filteredHistory = stock.history.filter((point) => point.timestamp >= timeLimit)

    // Ensure we have at least 2 data points for the chart
    const processedData =
      filteredHistory.length > 1
        ? filteredHistory
        : [...stock.history.slice(-1), { timestamp: now, price: stock.currentValue }]

    // Format data for the chart
    const formattedData = processedData.map((point) => ({
      time: formatDistanceToNow(new Date(point.timestamp), { addSuffix: true }),
      price: point.price,
      timestamp: point.timestamp,
    }))

    setChartData(formattedData)

    // Process volume data
    const filteredVolume = stock.volume.filter((point) => point.timestamp >= timeLimit)
    const formattedVolume = filteredVolume.map((point) => ({
      time: formatDistanceToNow(new Date(point.timestamp), { addSuffix: true }),
      volume: point.volume,
      type: point.type,
      timestamp: point.timestamp,
    }))

    setVolumeData(formattedVolume)
  }, [stock, timeRange])

  if (!stock) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Stock Chart</CardTitle>
          <CardDescription>Select a stock to view its chart</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[400px]">
          <p className="text-muted-foreground">No stock selected</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>{stock.name}</CardTitle>
            <CardDescription>
              Current Price: ₹{stock.currentValue.toFixed(2)} | Initial: ₹{stock.initialValue.toFixed(2)}
            </CardDescription>
          </div>
          <div>
            <Tabs
              value={timeRange}
              onValueChange={(value) => setTimeRange(value as "1m" | "5m" | "15m" | "1h" | "all")}
            >
              <TabsList>
                <TabsTrigger value="1m">1m</TabsTrigger>
                <TabsTrigger value="5m">5m</TabsTrigger>
                <TabsTrigger value="15m">15m</TabsTrigger>
                <TabsTrigger value="1h">1h</TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="price">
          <TabsList className="mb-4">
            <TabsTrigger value="price">Price</TabsTrigger>
            <TabsTrigger value="volume">Volume</TabsTrigger>
          </TabsList>
          <TabsContent value="price" className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value, index) => {
                    // Show fewer ticks for readability
                    return index % 3 === 0 ? value : ""
                  }}
                />
                <YAxis domain={["auto", "auto"]} tick={{ fontSize: 12 }} tickFormatter={(value) => `₹${value}`} />
                <Tooltip
                  formatter={(value) => [`₹${Number(value).toFixed(2)}`, "Price"]}
                  labelFormatter={(label) => `Time: ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="#8884d8"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>
          <TabsContent value="volume" className="h-[400px]">
            {volumeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volumeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value, index) => {
                      return index % 3 === 0 ? value : ""
                    }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value) => [`${Number(value)} shares`, "Volume"]}
                    labelFormatter={(label) => `Time: ${label}`}
                  />
                  <Legend />
                  <Bar dataKey="volume" fill={(data) => (data.type === "buy" ? "#4ade80" : "#ef4444")} name="Volume" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">No volume data available</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
