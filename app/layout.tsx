import type React from "react"
import type { Metadata } from "next/dist/lib/metadata/types/metadata-interface"
import "./globals.css"
import { Inter } from "next/font/google"
import { TradingProvider } from "@/lib/trading-context"
import { AppHeader } from "@/components/app-header"
import { StockTicker } from "@/components/stock-ticker"
import { TradingSheet } from "@/components/trading-sheet"
import { StockListSheet } from "@/components/stock-list-sheet"
import { HoldingsSheet } from "@/components/holdings-sheet"
import { NotificationToast } from "@/components/notification-toast"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "v0 App",
  description: "Created with v0",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <TradingProvider>
          <div className="min-h-screen bg-background">
            <AppHeader />
            <StockTicker />
            {children}
            <TradingSheet />
            <StockListSheet />
            <HoldingsSheet />
            <NotificationToast />
          </div>
        </TradingProvider>
      </body>
    </html>
  )
}
