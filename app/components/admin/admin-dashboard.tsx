"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import DatabaseDataStatus from "./database-data-status"
import {
  Clock,
  Upload,
  Users,
  FileJson,
  CheckCircle,
  XCircle,
  Table,
  Bell,
  RotateCcw,
  AlertTriangle,
  Database,
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import Image from "next/image"
import UserManagement from "./user-management"
import {
  openUploadWindow,
  closeUploadWindow,
  getUploadWindowStatus,
  getCurrentYear,
  setCurrentYear,
  setAdminPassword,
  getAdminPassword,
  masterReset,
} from "../../utils/storage"
import UploadHistory from "./upload-summary-report"

interface AdminDashboardProps {
  onLogout: () => void
}

interface DatabaseStatus {
  success: boolean
  message?: string
  tableExists?: boolean
  userCount?: number
  server?: string
  database?: string
  error?: string
  details?: string
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [showUploadWindow, setShowUploadWindow] = useState(false)
  const [openingUploadWindow, setOpeningUploadWindow] = useState(false)
  const [uploadDeadlineDate, setUploadDeadlineDate] = useState("")
  const [uploadDeadlineTime, setUploadDeadlineTime] = useState("")
  const [uploadMessage, setUploadMessage] = useState("")
  const [uploadYear, setUploadYear] = useState("")
  const [isWindowOpen, setIsWindowOpen] = useState(false)
  const [currentDeadline, setCurrentDeadline] = useState<string | null>(null)
  const [currentYear, setCurrentYearState] = useState("")
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [passwordSuccess, setPasswordSuccess] = useState("")
  const [isClient, setIsClient] = useState(false)
  const [activeTab, setActiveTab] = useState("upload-management")
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null)
  const [dbLoading, setDbLoading] = useState(false)
  const [closingUploadWindow, setClosingUploadWindow] = useState(false)


  // Initialize client-side state
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Check upload window status and database connection on component mount
  useEffect(() => {
    if (!isClient) return

    const checkStatus = async () => {
      const status = await getUploadWindowStatus()
      setIsWindowOpen(status.isOpen)
      setCurrentDeadline(status.deadline)
    }

    checkStatus()
    checkDatabaseConnection()
    const year = getCurrentYear()
    setCurrentYearState(year)
    setUploadYear(year)

    // Set default date and time values
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)

    setUploadDeadlineDate(tomorrow.toISOString().split("T")[0])
    setUploadDeadlineTime(now.toTimeString().slice(0, 5))

    const interval = setInterval(() => {
      checkStatus()
      checkDatabaseConnection()
    }, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [isClient])

  const checkWindowStatus = async () => {
    if (!isClient) return

    const status = await getUploadWindowStatus()
    setIsWindowOpen(status.isOpen)
    setCurrentDeadline(status.deadline)
  }

  const checkDatabaseConnection = async () => {
    if (!isClient) return

    try {
      const response = await fetch("/api/test-connection")
      const data = await response.json()
      setDbStatus(data)
    } catch (error) {
      setDbStatus({
        success: false,
        error: "Failed to test connection",
        details: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  const handleRefreshDbConnection = async () => {
    setDbLoading(true)
    await checkDatabaseConnection()
    setDbLoading(false)
  }

  const handleOpenWindow = async () => {
    if (!uploadDeadlineDate || !uploadDeadlineTime || !uploadMessage || !uploadYear) {
      return
    }

    setOpeningUploadWindow(true)
    // Combine date and time into a single ISO string
    const deadlineDateTime = new Date(`${uploadDeadlineDate}T${uploadDeadlineTime}:00`)
    const deadline = deadlineDateTime.toISOString()

    await openUploadWindow(deadline, uploadMessage, uploadYear)
    setShowUploadWindow(false)
    await checkWindowStatus()
    setOpeningUploadWindow(false)
  }

  const handleCloseWindow = async () => {
    setClosingUploadWindow(true)
    await closeUploadWindow()
    await checkWindowStatus()
    setClosingUploadWindow(false)
  }

  const handlePasswordChange = () => {
    setPasswordError("")
    setPasswordSuccess("")

    // Validate inputs
    if (!newPassword || !confirmPassword) {
      setPasswordError("Both password fields are required")
      return
    }

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters long")
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match")
      return
    }

    // Update password
    setAdminPassword(newPassword)
    setPasswordSuccess("Password changed successfully!")
    setNewPassword("")
    setConfirmPassword("")

    // Close dialog after 2 seconds
    setTimeout(() => {
      setShowPasswordChange(false)
      setPasswordSuccess("")
    }, 2000)
  }

  const resetPasswordForm = () => {
    setNewPassword("")
    setConfirmPassword("")
    setPasswordError("")
    setPasswordSuccess("")
  }

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadYear(e.target.value)
  }

  const handleCurrentYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const year = e.target.value
    setCurrentYearState(year)
    setCurrentYear(year)
  }


  // Show loading state during hydration
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <Image
                  src="/pie-logo.png"
                  alt="Pakistan Institute of Education"
                  width={40}
                  height={40}
                  className="object-contain"
                />
                <div>
                  <h1 className="text-lg font-bold text-blue-600">National Open Data Portal</h1>
                  <p className="text-sm text-green-600 font-medium">Administrator Panel</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                {/* Database Status Indicator */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleRefreshDbConnection}
                      disabled={dbLoading}
                      className="flex items-center space-x-2 px-3 py-1.5 rounded-md border transition-colors hover:bg-gray-50"
                    >
                      {dbLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                      ) : dbStatus?.success ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span className="text-sm font-medium">
                        {dbLoading ? "Checking..." : dbStatus?.success ? "DB Connected" : "DB Disconnected"}
                      </span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="max-w-sm">
                      {dbStatus?.success ? (
                        <div>
                          <p className="font-medium text-green-800">Database Connected</p>
                          <p className="text-sm">Server: {dbStatus.server}</p>
                          <p className="text-sm">Database: {dbStatus.database}</p>
                          <p className="text-sm">Users: {dbStatus.userCount}</p>
                        </div>
                      ) : (
                        <div>
                          <p className="font-medium text-red-800">Database Connection Failed</p>
                          <p className="text-sm">{dbStatus?.error || "Unknown error"}</p>
                        </div>
                      )}
                      <p className="text-xs text-gray-600 mt-1">Click to refresh</p>
                    </div>
                  </TooltipContent>
                </Tooltip>


                <Dialog open={showPasswordChange} onOpenChange={setShowPasswordChange}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      Change Password
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Change Admin Password</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input
                          id="new-password"
                          type="password"
                          placeholder="Enter new password (min 6 characters)"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm Password</Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          placeholder="Confirm new password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                      </div>

                      {passwordError && (
                        <Alert variant="destructive">
                          <AlertDescription>{passwordError}</AlertDescription>
                        </Alert>
                      )}

                      {passwordSuccess && (
                        <Alert className="bg-green-50 border-green-200">
                          <AlertDescription className="text-green-800">{passwordSuccess}</AlertDescription>
                        </Alert>
                      )}

                      <div className="flex justify-between">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            resetPasswordForm()
                            setShowPasswordChange(false)
                          }}
                        >
                          Cancel
                        </Button>
                        <div className="space-x-2">
                          <Button type="button" variant="outline" onClick={resetPasswordForm}>
                            Reset
                          </Button>
                          <Button type="button" onClick={handlePasswordChange}>
                            Change Password
                          </Button>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button variant="destructive" size="sm" onClick={onLogout}>
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Tabs defaultValue="upload-management" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="upload-management" className="flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Upload Management
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
                User Management
              </TabsTrigger>
                <TabsTrigger value="upload-summary-report" className="flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Upload History
                </TabsTrigger>
              <TabsTrigger value="database-status" className="flex items-center">
                <Database className="h-4 w-4 mr-2" />
                Stage Data Status
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload-management">
              <div className="space-y-6">
                {/* Page Header */}
                <div>
                  <h1 className="text-2xl font-bold text-blue-600 mb-2">Upload Window Management</h1>
                  <p className="text-gray-600">Open time-limited upload windows for all users to submit their data.</p>
                </div>

                {/* Current Upload Window Status */}
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center text-lg">
                      <Clock className="h-5 w-5 mr-2 text-blue-600" />
                      Current Upload Window Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isWindowOpen ? (
                      <div className="space-y-4">
                        <div className="flex items-center p-4 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full mr-3">
                            <Clock className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium text-green-900">Active Upload Window</p>
                            <p className="text-sm text-green-700">
                              Deadline: {currentDeadline ? new Date(currentDeadline).toLocaleString() : "N/A"}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="destructive"
                          onClick={handleCloseWindow}
                          disabled={closingUploadWindow}
                          className="flex items-center"
                        >
                          {closingUploadWindow ? (
                            <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                          ) : null}
                          {closingUploadWindow ? "Closing..." : "Close Upload Window"}
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full mr-3">
                          <Clock className="h-4 w-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">No Active Upload Window</p>
                          <p className="text-sm text-gray-600">
                            Users cannot upload data at this time. Open a new upload window below.
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Open New Upload Window */}
                {!isWindowOpen && (
                  <Card className="bg-green-50 border-green-200">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center text-lg text-green-800">
                        <Upload className="h-5 w-5 mr-2" />
                        Open New Upload Window
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="census-year" className="text-sm font-medium">
                            Census Year
                          </Label>
                          <Input
                            id="census-year"
                            placeholder="2025"
                            value={uploadYear}
                            onChange={handleYearChange}
                            className="bg-white"
                          />
                          <p className="text-xs text-gray-600">
                            This is the year that will be validated in the JSON data (census_year field)
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="upload-deadline" className="text-sm font-medium">
                            Upload Deadline
                          </Label>
                          <div className="flex space-x-2">
                            <Input
                              id="upload-deadline-date"
                              type="date"
                              value={uploadDeadlineDate}
                              onChange={(e) => setUploadDeadlineDate(e.target.value)}
                              className="bg-white"
                            />
                            <Input
                              id="upload-deadline-time"
                              type="time"
                              value={uploadDeadlineTime}
                              onChange={(e) => setUploadDeadlineTime(e.target.value)}
                              className="bg-white"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button
                          onClick={handleOpenWindow}
                          disabled={openingUploadWindow || !uploadDeadlineDate || !uploadDeadlineTime || !uploadMessage || !uploadYear}
                          className="bg-green-600 hover:bg-green-700 flex items-center"
                        >
                          {openingUploadWindow ? (
                            <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                          ) : (
                            <Upload className="h-4 w-4 mr-2" />
                          )}
                          {openingUploadWindow ? "Opening..." : "Open Upload Window"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Quick Message Templates */}
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg">Quick Message Templates</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div
                        className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() =>
                          setUploadMessage(
                            "Please submit your data for the current census year. The upload window will remain open until the specified deadline. Ensure all required fields are completed before submission.",
                          )
                        }
                      >
                        <h4 className="font-medium text-gray-900 mb-1">Standard Upload Window</h4>
                        <p className="text-sm text-gray-600">General message for regular data collection</p>
                      </div>

                      <div
                        className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() =>
                          setUploadMessage(
                            "URGENT: This is a time-critical data collection window. Please submit your data as soon as possible. The deadline is firm and extensions will not be granted.",
                          )
                        }
                      >
                        <h4 className="font-medium text-gray-900 mb-1">Urgent Collection</h4>
                        <p className="text-sm text-gray-600">For time-critical data submissions</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="users">
              <UserManagement />
            </TabsContent>

              <TabsContent value="upload-summary-report">
                <UploadHistory username="admin" />
              </TabsContent>

            <TabsContent value="database-status">
              <DatabaseDataStatus />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </TooltipProvider>
  )
}
