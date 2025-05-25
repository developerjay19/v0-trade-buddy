"use client"

import { useEffect, useState } from "react"
import { useTrading } from "@/lib/trading-context"
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

export function NotificationToast() {
  const { notifications, markNotificationRead } = useTrading()
  const [visibleNotifications, setVisibleNotifications] = useState<string[]>([])

  useEffect(() => {
    // Show new unread notifications
    const newNotifications = notifications.filter((n) => !n.read && !visibleNotifications.includes(n.id)).slice(0, 3) // Show max 3 at a time

    if (newNotifications.length > 0) {
      setVisibleNotifications((prev) => [...prev, ...newNotifications.map((n) => n.id)])

      // Auto-hide notifications after 5 seconds
      newNotifications.forEach((notification) => {
        setTimeout(() => {
          hideNotification(notification.id)
        }, 5000)
      })
    }
  }, [notifications, visibleNotifications])

  const hideNotification = (notificationId: string) => {
    setVisibleNotifications((prev) => prev.filter((id) => id !== notificationId))
    markNotificationRead(notificationId)
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  const getBackgroundColor = (type: string) => {
    switch (type) {
      case "success":
        return "bg-green-50 border-green-200"
      case "error":
        return "bg-red-50 border-red-200"
      case "warning":
        return "bg-yellow-50 border-yellow-200"
      default:
        return "bg-blue-50 border-blue-200"
    }
  }

  const visibleNotificationData = notifications.filter((n) => visibleNotifications.includes(n.id))

  if (visibleNotificationData.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {visibleNotificationData.map((notification) => (
        <div
          key={notification.id}
          className={`max-w-sm p-4 rounded-lg border shadow-lg animate-in slide-in-from-right-full ${getBackgroundColor(notification.type)}`}
        >
          <div className="flex items-start gap-3">
            {getIcon(notification.type)}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-gray-900">{notification.title}</h4>
              <p className="text-sm text-gray-700 mt-1">{notification.message}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => hideNotification(notification.id)}
              className="h-6 w-6 p-0 hover:bg-gray-200"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
