"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTrading } from "@/lib/trading-context"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { BarChart3, Home, Package, RefreshCcw, Settings, Menu } from "lucide-react"

export function AppHeader() {
  const { resetAccount } = useTrading()
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  return (
    <header className="border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <BarChart3 className="h-6 w-6" />
            <span>Trade Buddy</span>
          </Link>
          <nav className="hidden md:flex gap-6">
            <Link
              href="/"
              className={`flex items-center gap-2 text-sm font-medium ${
                isActive("/") ? "text-white" : "text-white/80 hover:text-white"
              }`}
            >
              <Home className="h-4 w-4" />
              Home
            </Link>
            <Link
              href="/charts"
              className={`flex items-center gap-2 text-sm font-medium ${
                isActive("/charts") ? "text-white" : "text-white/80 hover:text-white"
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              Charts
            </Link>
            <Link
              href="/stocks"
              className={`flex items-center gap-2 text-sm font-medium ${
                isActive("/stocks") ? "text-white" : "text-white/80 hover:text-white"
              }`}
            >
              <Package className="h-4 w-4" />
              All Stocks
            </Link>
            <Link
              href="/portfolio"
              className={`flex items-center gap-2 text-sm font-medium ${
                isActive("/portfolio") ? "text-white" : "text-white/80 hover:text-white"
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              Portfolio
            </Link>
            <Link
              href="/orderbook"
              className={`flex items-center gap-2 text-sm font-medium ${
                isActive("/orderbook") ? "text-white" : "text-white/80 hover:text-white"
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              Order Book
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="text-black">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center">
                  <Settings className="h-4 w-4 mr-2" />
                  Market Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={resetAccount}>
                <RefreshCcw className="h-4 w-4 mr-2" />
                Reset Account
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="md:hidden text-white border-white/30 hover:bg-white/20">
                <Menu className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link href="/" className="flex items-center">
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/charts" className="flex items-center">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Charts
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/stocks" className="flex items-center">
                  <Package className="h-4 w-4 mr-2" />
                  All Stocks
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/portfolio" className="flex items-center">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Portfolio
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/orderbook" className="flex items-center">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Order Book
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
