import type React from "react"
import type { Metadata } from "next/dist/lib/metadata/types/metadata-interface"
import "./globals.css"
import { Inter } from "next/font/google"
import { TradingProvider } from "@/lib/trading-context"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Trade Buddy - Stock Trading Simulator",
  description: "Learn trading concepts through an interactive simulator",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <TradingProvider>{children}</TradingProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
