"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, TrendingUp, Save } from "lucide-react"

export default function SettingsPage() {
  const [updateInterval, setUpdateInterval] = useState(5)
  const [autoUpdate, setAutoUpdate] = useState(true)
  const [volatility, setVolatility] = useState(50)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem("marketSettings")
    if (savedSettings) {
      const settings = JSON.parse(savedSettings)
      setUpdateInterval(settings.updateInterval || 5)
      setAutoUpdate(settings.autoUpdate !== false)
      setVolatility(settings.volatility || 50)
    }
  }, [])

  const saveSettings = () => {
    const settings = {
      updateInterval,
      autoUpdate,
      volatility,
    }
    localStorage.setItem("marketSettings", JSON.stringify(settings))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)

    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent("settingsChanged", { detail: settings }))
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="container py-6 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Market Settings</h1>
          <p className="text-gray-600">Configure market behavior and update preferences</p>
        </div>

        <div className="grid gap-6 max-w-2xl">
          {/* Market Update Settings */}
          <Card className="shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Market Update Settings
              </CardTitle>
              <CardDescription className="text-blue-100">Control how frequently market prices update</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-update" className="text-base font-medium">
                    Auto Update Prices
                  </Label>
                  <Switch id="auto-update" checked={autoUpdate} onCheckedChange={setAutoUpdate} />
                </div>
                <p className="text-sm text-gray-600">Automatically update stock prices in real-time</p>
              </div>

              {autoUpdate && (
                <div className="space-y-3">
                  <Label className="text-base font-medium">Update Interval: {updateInterval} seconds</Label>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">1s</span>
                    <Slider
                      value={[updateInterval]}
                      onValueChange={(value) => setUpdateInterval(value[0])}
                      min={1}
                      max={30}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-sm text-gray-500">30s</span>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-xs">
                      Current: {updateInterval}s
                    </Badge>
                    <Badge variant={updateInterval <= 5 ? "default" : updateInterval <= 15 ? "secondary" : "outline"}>
                      {updateInterval <= 5 ? "Fast" : updateInterval <= 15 ? "Medium" : "Slow"}
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Market Volatility Settings */}
          <Card className="shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-600 text-white">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Market Volatility
              </CardTitle>
              <CardDescription className="text-purple-100">Adjust how much stock prices fluctuate</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-3">
                <Label className="text-base font-medium">Volatility Level: {volatility}%</Label>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">Low</span>
                  <Slider
                    value={[volatility]}
                    onValueChange={(value) => setVolatility(value[0])}
                    min={0}
                    max={100}
                    step={5}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-500">High</span>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-xs">
                    Current: {volatility}%
                  </Badge>
                  <Badge variant={volatility <= 25 ? "secondary" : volatility <= 75 ? "default" : "destructive"}>
                    {volatility <= 25 ? "Conservative" : volatility <= 75 ? "Moderate" : "Aggressive"}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">Higher volatility means more dramatic price swings</p>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button
            onClick={saveSettings}
            className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold"
          >
            <Save className="h-4 w-4 mr-2" />
            {saved ? "Settings Saved!" : "Save Settings"}
          </Button>
        </div>
      </div>
    </div>
  )
}
