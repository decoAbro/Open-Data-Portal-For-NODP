"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import useSWR from "swr"
import { fetcher } from "@/utils/swr-fetcher"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
  Table as TableIcon,
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
  checkUploadDeadlines,
} from "../../utils/storage"
import UploadHistory from "./approval-history-management"

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
  const [pushingProd, setPushingProd] = useState(false)
  const [pushResult, setPushResult] = useState<null | { success: boolean; message: string; details?: any }>(null)
  const [pipelineLogs, setPipelineLogs] = useState<Array<{ logID: number; tableName: string; eventType: string; eventMessage: string; createdAt: string }>>([])
  const [pipelineLogsLoading, setPipelineLogsLoading] = useState(false)
  const [pipelineLogsError, setPipelineLogsError] = useState<string | null>(null)

  const fetchPipelineLogs = async () => {
    setPipelineLogsLoading(true)
    setPipelineLogsError(null)
    try {
      const res = await fetch('/api/pipeline-logs?limit=100', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch logs')
      }
      setPipelineLogs(data.logs)
    } catch (e) {
      setPipelineLogsError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setPipelineLogsLoading(false)
    }
  }

  // Load logs when switching to push-production tab
  useEffect(() => {
    if (activeTab === 'push-production' && isClient) {
      fetchPipelineLogs()
    }
  }, [activeTab, isClient])
  // Removed legacy deployment feature state


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
      // Each time we refresh status, also ensure deadlines are enforced
      await checkUploadDeadlines()
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

  // Schedule an exact auto-close when a deadline exists and window is open
  useEffect(() => {
    if (!isClient) return
    if (!isWindowOpen || !currentDeadline) return

    const deadlineDate = new Date(currentDeadline)
    const now = new Date()
    const msUntilDeadline = deadlineDate.getTime() - now.getTime()

    if (msUntilDeadline <= 0) {
      // Already passed, enforce immediately
      checkUploadDeadlines()
      return
    }

    const timeoutId = setTimeout(() => {
      checkUploadDeadlines()
    }, msUntilDeadline)

    return () => clearTimeout(timeoutId)
  }, [isClient, isWindowOpen, currentDeadline])

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

  // Removed legacy deployment handler


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
                  Approval And History Management
                </TabsTrigger>
              <TabsTrigger value="database-status" className="flex items-center">
                <Database className="h-4 w-4 mr-2" />
                Stage Data Status
              </TabsTrigger>
              <TabsTrigger value="push-production" className="flex items-center">
                <Upload className="h-4 w-4 mr-2" />
                Push to Production
              </TabsTrigger>
              {/* Deployment tab removed */}
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

            <TabsContent value="push-production">
              <Card className="border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Upload className="h-5 w-5 mr-2 text-blue-600" />
                    Push Approved Data to Production
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert className="bg-blue-50 border-blue-200">
                    <AlertDescription>
                      This action will publish the latest approved / staged data to the public production environment.
                      Ensure all validations and approvals are complete before proceeding.
                    </AlertDescription>
                  </Alert>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p className="font-medium text-gray-800">Checklist before pushing:</p>
                    <ul className="list-disc ml-6 space-y-1">
                      <li>All required tables are present and validated in the staging environment.</li>
                      <li>No pending critical approvals in the Approval & History Management tab.</li>
                      <li>Database connection is healthy (see indicator in header).</li>
                      <li>Any schema migrations (if needed) have already been applied.</li>
                    </ul>
                  </div>
                  {pushResult && (
                    <Alert className={pushResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
                      <AlertDescription className={pushResult.success ? 'text-green-800' : 'text-red-800'}>
                        {pushResult.message}
                      </AlertDescription>
                    </Alert>
                  )}
                  <div className="flex items-center space-x-3">
                    <Button
                      disabled={pushingProd}
                      className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center"
                      onClick={async () => {
                        setPushResult(null)
                        setPushingProd(true)
                        try {
                          const res = await fetch('/api/push-production', { method: 'POST' })
                          const data = await res.json()
                          if (!res.ok || !data.success) {
                            setPushResult({ success: false, message: data.error || 'Production push failed', details: data })
                          } else {
                            const totalRows = data.tables?.reduce((acc: number, t: any) => acc + (t.loaded || 0), 0) || 0
                            setPushResult({ success: true, message: `Production push completed. Tables: ${data.tables?.length || 0}, Rows loaded: ${totalRows}` })
                            // Refresh logs after successful push
                            fetchPipelineLogs()
                          }
                        } catch (e) {
                          setPushResult({ success: false, message: e instanceof Error ? e.message : 'Unknown error' })
                        } finally {
                          setPushingProd(false)
                        }
                      }}
                    >
                      {pushingProd && <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>}
                      {pushingProd ? 'Pushing...' : 'Push Now'}
                    </Button>
                    <p className="text-xs text-gray-500">Runs pipeline: copies staged tables to production.</p>
                  </div>
                  {pushingProd && (
                    <p className="text-xs text-gray-500">This may take several minutes. Please don&apos;t close the page.</p>
                  )}
                  {/* Pipeline Logs Section */}
                  <div className="mt-6 border-t pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold text-gray-700 flex items-center">Pipeline Logs</h3>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" onClick={fetchPipelineLogs} disabled={pipelineLogsLoading}>
                          {pipelineLogsLoading ? 'Refreshing...' : 'Refresh Logs'}
                        </Button>
                      </div>
                    </div>
                    {pipelineLogsError && (
                      <Alert variant="destructive" className="mb-2">
                        <AlertDescription>{pipelineLogsError}</AlertDescription>
                      </Alert>
                    )}
                    <div className="max-h-80 overflow-auto border rounded-md bg-white">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100 sticky top-0 z-10">
                          <tr>
                            <th className="text-left px-2 py-1 w-36">Time</th>
                            <th className="text-left px-2 py-1 w-32">Table</th>
                            <th className="text-left px-2 py-1 w-24">Type</th>
                            <th className="text-left px-2 py-1">Message</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pipelineLogsLoading && pipelineLogs.length === 0 && (
                            <tr>
                              <td colSpan={4} className="px-2 py-4 text-center text-gray-500">Loading logs...</td>
                            </tr>
                          )}
                          {!pipelineLogsLoading && pipelineLogs.length === 0 && !pipelineLogsError && (
                            <tr>
                              <td colSpan={4} className="px-2 py-4 text-center text-gray-500">No logs found</td>
                            </tr>
                          )}
                          {pipelineLogs.map(log => {
                            const dt = new Date(log.createdAt)
                            const displayTime = isNaN(dt.getTime()) ? log.createdAt : dt.toLocaleString()
                            const truncated = log.eventMessage && log.eventMessage.length > 250 ? log.eventMessage.slice(0,247) + '...' : log.eventMessage || ''
                            return (
                              <tr key={log.logID} className="border-t hover:bg-gray-50">
                                <td className="px-2 py-1 align-top whitespace-nowrap text-xs text-gray-600">{displayTime}</td>
                                <td className="px-2 py-1 align-top font-medium text-gray-800">{log.tableName}</td>
                                <td className="px-2 py-1 align-top">
                                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${log.eventType === 'ERROR' ? 'bg-red-100 text-red-700' : log.eventType === 'INFO' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{log.eventType}</span>
                                </td>
                                <td className="px-2 py-1 align-top text-gray-700 text-xs">{truncated}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                    <p className="mt-1 text-[10px] text-gray-400">Showing latest {pipelineLogs.length} entries. Stored in Stage.dbo.Pipeline_Log.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Deployment content removed */}

          </Tabs>
        </div>
      </div>
    </TooltipProvider>
  )
}

// Deployment logs table removed with legacy feature
