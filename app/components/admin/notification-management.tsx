"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Bell,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Trash2,
  RefreshCw,
  Download,
  Clock,
  User,
  Database,
} from "lucide-react"
import { getNotifications, markNotificationAsRead, clearAllNotifications } from "@/app/utils/storage"

interface Notification {
  id: number
  username: string
  message: string
  date: string
  read: boolean
  type?: "upload_window" | "general" | "table_reminder" | "data_not_available"
  deadline?: string
  tableName?: string
}

export default function NotificationManagement() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [selectedUser, setSelectedUser] = useState<string>("all")
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Load notifications
  const loadNotifications = () => {
    setIsRefreshing(true)
    try {
      const allNotifications = getNotifications()
      setNotifications(allNotifications)
      console.log("Loaded notifications:", allNotifications.length)
    } catch (error) {
      console.error("Error loading notifications:", error)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Filter notifications
  useEffect(() => {
    let filtered = notifications

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (notification) =>
          notification.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
          notification.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (notification.tableName && notification.tableName.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }

    // Filter by type
    if (selectedType !== "all") {
      filtered = filtered.filter((notification) => notification.type === selectedType)
    }

    // Filter by user
    if (selectedUser !== "all") {
      filtered = filtered.filter((notification) => notification.username === selectedUser)
    }

    setFilteredNotifications(filtered)
  }, [notifications, searchTerm, selectedType, selectedUser])

  // Load notifications on component mount and set up auto-refresh
  useEffect(() => {
    loadNotifications()
    const interval = setInterval(loadNotifications, 3000) // Refresh every 3 seconds
    return () => clearInterval(interval)
  }, [])

  // Get unique users for filter
  const uniqueUsers = Array.from(new Set(notifications.map((n) => n.username))).sort()

  // Get notification type counts
  const getTypeCounts = () => {
    const counts = {
      all: notifications.length,
      data_not_available: notifications.filter((n) => n.type === "data_not_available").length,
      upload_window: notifications.filter((n) => n.type === "upload_window").length,
      table_reminder: notifications.filter((n) => n.type === "table_reminder").length,
      general: notifications.filter((n) => n.type === "general").length,
      unread: notifications.filter((n) => !n.read).length,
    }
    return counts
  }

  const typeCounts = getTypeCounts()

  // Handle mark as read
  const handleMarkAsRead = (id: number) => {
    markNotificationAsRead(id)
    loadNotifications()
  }

  // Handle clear all notifications
  const handleClearAll = () => {
    if (confirm("Are you sure you want to clear all notifications? This action cannot be undone.")) {
      clearAllNotifications()
      loadNotifications()
    }
  }

  // Export notifications
  const exportNotifications = () => {
    const dataStr = JSON.stringify(filteredNotifications, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `notifications-${new Date().toISOString().split("T")[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  // Get notification icon and color
  const getNotificationIcon = (type?: string) => {
    switch (type) {
      case "data_not_available":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "upload_window":
        return <Clock className="h-4 w-4 text-blue-500" />
      case "table_reminder":
        return <Database className="h-4 w-4 text-orange-500" />
      default:
        return <Bell className="h-4 w-4 text-gray-500" />
    }
  }

  const getNotificationBadgeColor = (type?: string) => {
    switch (type) {
      case "data_not_available":
        return "destructive"
      case "upload_window":
        return "default"
      case "table_reminder":
        return "secondary"
      default:
        return "outline"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-blue-600">Notification Management</h2>
          <p className="text-gray-600">View and manage all system notifications ({typeCounts.unread} unread)</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadNotifications} disabled={isRefreshing} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={exportNotifications} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={handleClearAll} variant="destructive" size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold">{typeCounts.all}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-gray-600">Data N/A</p>
                <p className="text-2xl font-bold">{typeCounts.data_not_available}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Upload</p>
                <p className="text-2xl font-bold">{typeCounts.upload_window}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Database className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Reminders</p>
                <p className="text-2xl font-bold">{typeCounts.table_reminder}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Unread</p>
                <p className="text-2xl font-bold">{typeCounts.unread}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <Input
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="data_not_available">Data Not Available</SelectItem>
                <SelectItem value="upload_window">Upload Window</SelectItem>
                <SelectItem value="table_reminder">Table Reminder</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by user" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {uniqueUsers.map((user) => (
                  <SelectItem key={user} value={user}>
                    {user}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notifications Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Notifications ({filteredNotifications.length})</CardTitle>
          <CardDescription>Click on a notification to mark it as read</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Table</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredNotifications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No notifications found
                  </TableCell>
                </TableRow>
              ) : (
                filteredNotifications.map((notification) => (
                  <TableRow
                    key={notification.id}
                    className={`${!notification.read ? "bg-blue-50" : ""} hover:bg-gray-50 cursor-pointer`}
                    onClick={() => !notification.read && handleMarkAsRead(notification.id)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getNotificationIcon(notification.type)}
                        <Badge variant={getNotificationBadgeColor(notification.type)} className="text-xs">
                          {notification.type?.replace("_", " ") || "general"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        {notification.username}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-md">
                      <div className="truncate" title={notification.message}>
                        {notification.message}
                      </div>
                    </TableCell>
                    <TableCell>
                      {notification.tableName && (
                        <Badge variant="outline" className="text-xs">
                          {notification.tableName}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{notification.date}</TableCell>
                    <TableCell>
                      {notification.read ? (
                        <Badge variant="outline" className="text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Read
                        </Badge>
                      ) : (
                        <Badge variant="default" className="text-xs">
                          <Bell className="h-3 w-3 mr-1" />
                          Unread
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {!notification.read && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleMarkAsRead(notification.id)
                          }}
                          className="h-8 px-2"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
