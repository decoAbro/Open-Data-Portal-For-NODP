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
import { Textarea } from "@/components/ui/textarea"
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
  FileSpreadsheet,
  Trash2,
  LogOut,
  Key,
  Lock,
  Copy,
  BarChart3,
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
  username?: string
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

export default function AdminDashboard({ onLogout, username = 'Administrator' }: AdminDashboardProps) {
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
  // Last run summary (detailed per-table metrics)
  interface LastRunTableSummary { table: string; extracted: number; loaded: number; failed: number; durationMs: number; error?: string }
  interface LastRunSummary { startedAt: string; finishedAt: string; durationMs: number; tables: LastRunTableSummary[] }
  const [lastRunSummary, setLastRunSummary] = useState<LastRunSummary | null>(null)
  const [showLastRunSummary, setShowLastRunSummary] = useState(true)
  const [pipelineLogs, setPipelineLogs] = useState<Array<{ logID: number; tableName: string; eventType: string; eventMessage: string; createdAt: string }>>([])
  const [pipelineLogsLoading, setPipelineLogsLoading] = useState(false)
  const [pipelineLogsError, setPipelineLogsError] = useState<string | null>(null)
  const [pipelineLogPage, setPipelineLogPage] = useState(1)
  const [pipelineLogPageSize, setPipelineLogPageSize] = useState(50)
  const [pipelineLogTotalPages, setPipelineLogTotalPages] = useState(1)
  const [pipelineLogHasMore, setPipelineLogHasMore] = useState(false)
  const [pipelineTablesDistinct, setPipelineTablesDistinct] = useState<string[]>([])
  const [pipelineEventTypesDistinct, setPipelineEventTypesDistinct] = useState<string[]>([])
  const [pipelineFilterTable, setPipelineFilterTable] = useState<string>('ALL')
  const [pipelineFilterEventType, setPipelineFilterEventType] = useState<string>('ALL')
  const [pipelineSince, setPipelineSince] = useState<string>('') // ISO timestamp for quick relative window
  const [pipelineSinceLabel, setPipelineSinceLabel] = useState<'All' | '15m' | '1h' | '24h'>('All')
  const [autoRefreshLogs, setAutoRefreshLogs] = useState(false)
  const [selectedLog, setSelectedLog] = useState<null | { logID: number; tableName: string; eventType: string; eventMessage: string; createdAt: string }>(null)
  const [copiedLogId, setCopiedLogId] = useState<number | null>(null)
  const [pipelineMessageSearch, setPipelineMessageSearch] = useState('')
  const [pipelineMessageSearchInput, setPipelineMessageSearchInput] = useState('')
  const [pipelineSearchTokens, setPipelineSearchTokens] = useState<string[]>([])
  // (debounce handled via useEffect)
  const [selectedLogIds, setSelectedLogIds] = useState<Set<number>>(new Set())
  // Newly arrived logs (for flash highlight when auto-refresh is enabled)
  const [newlyFlashedLogIds, setNewlyFlashedLogIds] = useState<Set<number>>(new Set())
  const [deletingLogs, setDeletingLogs] = useState(false)
  const allPageSelected = pipelineLogs.length > 0 && pipelineLogs.every(l => selectedLogIds.has(l.logID))
  const toggleSelectAllPage = () => {
    const newSet = new Set(selectedLogIds)
    if (allPageSelected) {
      pipelineLogs.forEach(l => newSet.delete(l.logID))
    } else {
      pipelineLogs.forEach(l => newSet.add(l.logID))
    }
    setSelectedLogIds(newSet)
  }
  const toggleSelectOne = (id: number) => {
    const newSet = new Set(selectedLogIds)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setSelectedLogIds(newSet)
  }
  const clearSelection = () => setSelectedLogIds(new Set())
  const handleBulkDelete = async () => {
    if (selectedLogIds.size === 0) return
    if (!confirm(`Delete ${selectedLogIds.size} selected log(s)? This cannot be undone.`)) return
    setDeletingLogs(true)
    try {
      const res = await fetch('/api/pipeline-logs/bulk-delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: Array.from(selectedLogIds) }) })
      const data = await res.json()
      if (!res.ok || !data.success) {
        alert(data.error || 'Bulk delete failed')
      }
      clearSelection()
      // If current page empties, go back a page if possible
      await fetchPipelineLogs({ page: pipelineLogPage })
      if (pipelineLogs.length === selectedLogIds.size && pipelineLogPage > 1) {
        const newPage = pipelineLogPage - 1
        setPipelineLogPage(newPage)
        await fetchPipelineLogs({ page: newPage })
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setDeletingLogs(false)
    }
  }
  const handleResetPipelineFilters = () => {
    const defaults = {
      table: 'ALL',
      eventType: 'ALL',
      pageSize: 50,
      search: ''
    }
    let changed = false
    if (pipelineFilterTable !== defaults.table) { setPipelineFilterTable(defaults.table); changed = true }
    if (pipelineFilterEventType !== defaults.eventType) { setPipelineFilterEventType(defaults.eventType); changed = true }
    if (pipelineLogPageSize !== defaults.pageSize) { setPipelineLogPageSize(defaults.pageSize); changed = true }
    if (pipelineSince) { setPipelineSince(''); setPipelineSinceLabel('All'); changed = true }
    if (pipelineMessageSearchInput !== defaults.search || pipelineMessageSearch !== defaults.search) {
      setPipelineMessageSearchInput(defaults.search)
      setPipelineMessageSearch(defaults.search)
      setPipelineSearchTokens([])
      changed = true
    }
    if (pipelineLogPage !== 1) { setPipelineLogPage(1); changed = true }
    // Always fetch fresh list (avoid relying on multiple effects firing)
    fetchPipelineLogs({ resetPage: true })
  }
  const handleExportCsv = async () => {
    try {
      const tableParam = pipelineFilterTable !== 'ALL' ? `&table=${encodeURIComponent(pipelineFilterTable)}` : ''
      const eventTypeParam = pipelineFilterEventType !== 'ALL' ? `&eventType=${encodeURIComponent(pipelineFilterEventType)}` : ''
      const sinceParam = pipelineSince ? `&since=${encodeURIComponent(pipelineSince)}` : ''
      const res = await fetch(`/api/pipeline-logs/export?limit=1000${tableParam}${eventTypeParam}${sinceParam}`, { cache: 'no-store' })
      if (!res.ok) {
        alert('Failed to export logs')
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'pipeline_logs.csv'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Unknown error exporting')
    }
  }

  const fetchPipelineLogs = async (opts?: { page?: number; resetPage?: boolean; silent?: boolean }) => {
    if (!opts?.silent) {
      setPipelineLogsLoading(true)
    }
    setPipelineLogsError(null)
    try {
      const prevIds = new Set(pipelineLogs.map(l => l.logID))
      const page = opts?.page ?? (opts?.resetPage ? 1 : pipelineLogPage)
      const tableParam = pipelineFilterTable !== 'ALL' ? `&table=${encodeURIComponent(pipelineFilterTable)}` : ''
      const eventTypeParam = pipelineFilterEventType !== 'ALL' ? `&eventType=${encodeURIComponent(pipelineFilterEventType)}` : ''
    const sinceParam = pipelineSince ? `&since=${encodeURIComponent(pipelineSince)}` : ''
    const qParam = pipelineMessageSearch ? `&q=${encodeURIComponent(pipelineMessageSearch)}` : ''
    const res = await fetch(`/api/pipeline-logs?page=${page}&pageSize=${pipelineLogPageSize}${tableParam}${eventTypeParam}${sinceParam}${qParam}`, { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch logs')
      }
      setPipelineLogs(data.logs)
      setPipelineLogPage(data.page)
      setPipelineLogTotalPages(data.totalPages)
      setPipelineLogHasMore(data.hasMore)
      setPipelineTablesDistinct(data.tablesDistinct || [])
      setPipelineEventTypesDistinct(data.eventTypesDistinct || [])
      setPipelineSearchTokens(data.searchTokens || [])
      // Highlight new rows only during auto-refresh (avoid noise on manual filter/search changes)
      if (autoRefreshLogs) {
        const incomingIds: number[] = (data.logs || []).map((l: any) => l.logID)
        const newlyArrived = incomingIds.filter(id => !prevIds.has(id))
        if (newlyArrived.length > 0) {
          setNewlyFlashedLogIds(prev => {
            const next = new Set(prev)
            newlyArrived.forEach(id => {
              if (!next.has(id)) {
                next.add(id)
                // Remove highlight after 1800ms
                setTimeout(() => {
                  setNewlyFlashedLogIds(current => {
                    if (!current.has(id)) return current
                    const copy = new Set(current)
                    copy.delete(id)
                    return copy
                  })
                }, 1800)
              }
            })
            return next
          })
        }
      }
    } catch (e) {
      setPipelineLogsError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      if (!opts?.silent) setPipelineLogsLoading(false)
    }
  }

  // Initial load & on filter/search/page size changes
  useEffect(() => {
    if (activeTab === 'push-production' && isClient) {
      fetchPipelineLogs({ resetPage: true })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, isClient, pipelineFilterTable, pipelineFilterEventType, pipelineMessageSearch, pipelineLogPageSize, pipelineSince])

  // Silent polling (reintroduced after removing SSE stream)
  useEffect(() => {
    if (activeTab !== 'push-production' || !autoRefreshLogs) return
    const id = setInterval(() => {
      // Only poll first page context; pagination fetches are manual via Prev/Next buttons
      fetchPipelineLogs({ silent: true })
    }, 2000) // 2s balanced interval
    return () => clearInterval(id)
  }, [activeTab, autoRefreshLogs, pipelineLogPageSize, pipelineFilterTable, pipelineFilterEventType, pipelineMessageSearch])

  // Debounce message search input (400ms)
  useEffect(() => {
    if (activeTab !== 'push-production') return
    const handle = setTimeout(() => {
      setPipelineMessageSearch(pipelineMessageSearchInput)
      fetchPipelineLogs({ resetPage: true })
    }, 400)
    return () => clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pipelineMessageSearchInput])
  
  // Force auto refresh (stream) always on when viewing push-production tab (checkbox removed)
  useEffect(() => {
    if (activeTab === 'push-production' && !autoRefreshLogs) {
      setAutoRefreshLogs(true)
    }
  }, [activeTab, autoRefreshLogs])
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
                  <p className="text-xs text-gray-500 mt-0.5">Welcome, {username}</p>
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
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <Key className="h-4 w-4" />
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

                <Button variant="destructive" size="sm" onClick={onLogout} className="flex items-center gap-2">
                  <LogOut className="h-4 w-4" />
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
                          ) : (
                            <Lock className="h-4 w-4 mr-2" />
                          )}
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

                      {/* Upload Message */}
                      <div className="space-y-2">
                        <Label htmlFor="upload-message" className="text-sm font-medium flex items-center justify-between">
                          <span>Message to Display to Users</span>
                          <span className="text-[10px] text-gray-500">{uploadMessage.length}/600</span>
                        </Label>
                        <Textarea
                          id="upload-message"
                          placeholder="Explain the purpose, required tables, deadlines, and any special instructions for this upload window..."
                          value={uploadMessage}
                          maxLength={600}
                          onChange={(e) => setUploadMessage(e.target.value)}
                          className="bg-white min-h-[120px] resize-y"
                        />
                        <p className="text-xs text-gray-600">
                          This message is shown to users while the window is open. Provide clear instructions and expectations.
                        </p>
                        {!uploadMessage && (
                          <p className="text-xs text-amber-600 flex items-center gap-1">
                            <AlertTriangle className="h-3.5 w-3.5" /> A message is required before opening the window.
                          </p>
                        )}
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
                        const startedAt = Date.now()
                        setPushingProd(true)
                        try {
                          const res = await fetch('/api/push-production', { method: 'POST' })
                          const data = await res.json()
                          if (!res.ok || !data.success) {
                            setPushResult({ success: false, message: data.error || 'Production push failed', details: data })
                            if (data?.tables) {
                              setLastRunSummary({
                                startedAt: new Date(startedAt).toISOString(),
                                finishedAt: new Date().toISOString(),
                                durationMs: data.totalDurationMs ?? (Date.now() - startedAt),
                                tables: data.tables,
                              })
                              setShowLastRunSummary(true)
                            }
                          } else {
                            const totalRows = data.tables?.reduce((acc: number, t: any) => acc + (t.loaded || 0), 0) || 0
                            setPushResult({ success: true, message: `Production push completed. Tables: ${data.tables?.length || 0}, Rows loaded: ${totalRows}` })
                            setLastRunSummary({
                              startedAt: new Date(startedAt).toISOString(),
                              finishedAt: new Date().toISOString(),
                              durationMs: data.totalDurationMs ?? (Date.now() - startedAt),
                              tables: data.tables || [],
                            })
                            setShowLastRunSummary(true)
                            // Refresh logs after successful push
                            fetchPipelineLogs({ resetPage: true })
                          }
                        } catch (e) {
                          setPushResult({ success: false, message: e instanceof Error ? e.message : 'Unknown error' })
                          setLastRunSummary({
                            startedAt: new Date(startedAt).toISOString(),
                            finishedAt: new Date().toISOString(),
                            durationMs: Date.now() - startedAt,
                            tables: [],
                          })
                          setShowLastRunSummary(true)
                        } finally {
                          setPushingProd(false)
                        }
                      }}
                    >
                      {pushingProd ? (
                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                      ) : (
                        <Upload className="h-4 w-4 mr-2" />
                      )}
                      {pushingProd ? 'Pushing...' : 'Push Now'}
                    </Button>
                    <p className="text-xs text-gray-500">Runs pipeline: copies staged tables to production.</p>
                  </div>
                  {pushingProd && (
                    <p className="text-xs text-gray-500">This may take several minutes. Please don&apos;t close the page.</p>
                  )}
                  {lastRunSummary && (
                    <div className="mt-4 border rounded-md bg-white shadow-sm">
                      <div
                        className="flex items-center justify-between px-3 py-2 cursor-pointer select-none border-b"
                        onClick={() => setShowLastRunSummary(v => !v)}
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-gray-700">Last Run Summary</span>
                          <span className="text-[11px] text-gray-500">Started {new Date(lastRunSummary.startedAt).toLocaleString()} • Duration {(lastRunSummary.durationMs/1000).toFixed(2)}s • Tables {lastRunSummary.tables.length}</span>
                        </div>
                        <button className="text-xs text-blue-600 hover:underline" type="button">{showLastRunSummary ? 'Hide' : 'Show'}</button>
                      </div>
                      {showLastRunSummary && (
                        <div className="p-3 space-y-3">
                          {(() => {
                            const errors = lastRunSummary.tables.filter(t => t.error || t.failed > 0)
                            if (errors.length === 0) return null
                            // Group by error message
                            const groups = new Map<string, number>()
                            errors.forEach(e => {
                              const key = e.error ? e.error : 'Row failures'
                              groups.set(key, (groups.get(key) || 0) + 1)
                            })
                            return (
                              <div className="bg-red-50 border border-red-200 rounded p-2">
                                <p className="text-xs font-semibold text-red-700 mb-1">Errors / Issues</p>
                                <ul className="text-[11px] text-red-700 list-disc ml-4 space-y-0.5">
                                  {Array.from(groups.entries()).map(([msg,count]) => (
                                    <li key={msg}>{msg} <span className="text-red-500">(Tables: {count})</span></li>
                                  ))}
                                </ul>
                              </div>
                            )
                          })()}
                          <div className="overflow-auto max-h-64 border rounded">
                            <table className="w-full text-xs">
                              <thead className="bg-gray-100">
                                <tr>
                                  <th className="text-left px-2 py-1">Table</th>
                                  <th className="text-right px-2 py-1">Extracted</th>
                                  <th className="text-right px-2 py-1">Loaded</th>
                                  <th className="text-right px-2 py-1">Failed</th>
                                  <th className="text-right px-2 py-1">Duration (ms)</th>
                                  <th className="text-left px-2 py-1">Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {lastRunSummary.tables.map(t => {
                                  const status = t.error ? 'ERROR' : (t.failed > 0 ? 'PARTIAL' : 'OK')
                                  return (
                                    <tr key={t.table} className="border-t">
                                      <td className="px-2 py-1 font-medium text-gray-700 whitespace-nowrap">{t.table}</td>
                                      <td className="px-2 py-1 text-right">{t.extracted}</td>
                                      <td className="px-2 py-1 text-right text-green-700">{t.loaded}</td>
                                      <td className="px-2 py-1 text-right text-red-600">{t.failed}</td>
                                      <td className="px-2 py-1 text-right text-gray-600">{t.durationMs}</td>
                                      <td className="px-2 py-1">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${status==='ERROR' ? 'bg-red-100 text-red-700' : status==='PARTIAL' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{status}</span>
                                      </td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                          {lastRunSummary.tables.some(t => t.error) && (
                            <details className="text-[11px]">
                              <summary className="cursor-pointer text-gray-600">View raw error messages</summary>
                              <ul className="mt-1 list-disc ml-5 space-y-0.5">
                                {lastRunSummary.tables.filter(t => t.error).map(t => (
                                  <li key={t.table}><span className="font-semibold">{t.table}:</span> {t.error}</li>
                                ))}
                              </ul>
                            </details>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  {/* Pipeline Logs Section */}
                  <div className="mt-6 border-t pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold text-gray-700 flex items-center">Pipeline Logs</h3>
                      <div className="flex items-center space-x-2 flex-wrap">
                        <div className="flex items-center space-x-1">
                          <input
                            type="text"
                            placeholder="Search message..."
                            value={pipelineMessageSearchInput}
                            onChange={(e) => {
                              const v = e.target.value
                              setPipelineMessageSearchInput(v)
                              if (v === '') {
                                // Immediate reset to full list when cleared
                                setPipelineMessageSearch('')
                                setPipelineSearchTokens([])
                                fetchPipelineLogs({ resetPage: true })
                              }
                            }}
                            className="border rounded px-2 py-0.5 text-xs bg-white w-48"
                          />
                          {pipelineMessageSearch && !pipelineLogsLoading && (
                            <Button variant="outline" size="sm" onClick={() => { setPipelineMessageSearch(''); setPipelineMessageSearchInput(''); fetchPipelineLogs({ resetPage: true }) }}>Clear</Button>
                          )}
                        </div>
                        <label className="text-[11px] text-gray-600 flex items-center space-x-1">
                          <span>Table:</span>
                          <select
                            className="border rounded px-1 py-0.5 text-xs bg-white"
                            value={pipelineFilterTable}
                            onChange={(e) => { setPipelineFilterTable(e.target.value); fetchPipelineLogs({ resetPage: true }) }}
                          >
                            <option value="ALL">All</option>
                            {pipelineTablesDistinct.map(t => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </label>
                        <label className="text-[11px] text-gray-600 flex items-center space-x-1">
                          <span>Type:</span>
                          <select
                            className="border rounded px-1 py-0.5 text-xs bg-white"
                            value={pipelineFilterEventType}
                            onChange={(e) => { setPipelineFilterEventType(e.target.value); fetchPipelineLogs({ resetPage: true }) }}
                          >
                            <option value="ALL">All</option>
                            {pipelineEventTypesDistinct.map(t => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </label>
                        <label className="text-[11px] text-gray-600 flex items-center space-x-1">
                          <span>Page size:</span>
                          <select
                            className="border rounded px-1 py-0.5 text-xs bg-white"
                            value={pipelineLogPageSize}
                            onChange={(e) => { setPipelineLogPageSize(parseInt(e.target.value,10)); fetchPipelineLogs({ resetPage: true }) }}
                          >
                            {[25,50,100,150,200].map(sz => <option key={sz} value={sz}>{sz}</option>)}
                          </select>
                        </label>
                        <div className="flex items-center space-x-1 text-[10px]">
                          {(['15m','1h','24h','All'] as const).map(range => {
                            const active = pipelineSinceLabel === range
                            return (
                              <button
                                key={range}
                                type="button"
                                className={`px-1.5 py-0.5 rounded border font-medium transition-colors ${active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white hover:bg-gray-100 text-gray-700 border-gray-300'}`}
                                onClick={() => {
                                  if (range === 'All') {
                                    setPipelineSince('')
                                    setPipelineSinceLabel('All')
                                    setPipelineLogPage(1)
                                    fetchPipelineLogs({ resetPage: true })
                                    return
                                  }
                                  let ms = 0
                                  if (range === '15m') ms = 15*60*1000
                                  else if (range === '1h') ms = 60*60*1000
                                  else if (range === '24h') ms = 24*60*60*1000
                                  const sinceISO = new Date(Date.now() - ms).toISOString()
                                  setPipelineSince(sinceISO)
                                  setPipelineSinceLabel(range)
                                  setPipelineLogPage(1)
                                  fetchPipelineLogs({ resetPage: true })
                                }}
                                title={range === 'All' ? 'Show all logs' : `Show logs from last ${range}`}
                              >{range}</button>
                            )
                          })}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleResetPipelineFilters}
                          className="text-xs flex items-center gap-1"
                          title="Reset table, type, time span, page size & search"
                        >
                          <RotateCcw className="h-3.5 w-3.5" /> Reset Filters
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={handleBulkDelete}
                          disabled={selectedLogIds.size===0 || deletingLogs}
                          title={selectedLogIds.size ? `Delete ${selectedLogIds.size} selected log(s)` : 'Select logs to delete'}
                          className="h-8 w-8 relative"
                        >
                          {deletingLogs ? (
                            <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          {selectedLogIds.size > 0 && !deletingLogs && (
                            <span
                              className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-600 text-white text-[10px] leading-4 font-semibold flex items-center justify-center shadow"
                              aria-label={`${selectedLogIds.size} selected`}
                            >
                              {selectedLogIds.size > 99 ? '99+' : selectedLogIds.size}
                            </span>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleExportCsv}
                          disabled={pipelineLogsLoading}
                          className="bg-green-600 hover:bg-green-700 text-white border border-green-600 flex items-center gap-1"
                          title="Export visible (filtered) logs to CSV"
                        >
                          <FileSpreadsheet className="h-4 w-4" />
                          Export CSV
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
                            <th className="text-left px-2 py-1 w-4"><input type="checkbox" checked={allPageSelected} onChange={toggleSelectAllPage} /></th>
                            <th className="text-left px-2 py-1 w-36">Time</th>
                            <th className="text-left px-2 py-1 w-32">Table</th>
                            <th className="text-left px-2 py-1 w-24">Type</th>
                            <th className="text-left px-2 py-1">Message</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pipelineLogsLoading && pipelineLogs.length === 0 && (
                            <tr>
                              <td colSpan={5} className="px-2 py-4 text-center text-gray-500">Loading logs...</td>
                            </tr>
                          )}
                          {!pipelineLogsLoading && pipelineLogs.length === 0 && !pipelineLogsError && (
                            <tr>
                              <td colSpan={5} className="px-2 py-4 text-center text-gray-500">No logs found</td>
                            </tr>
                          )}
                          {pipelineLogs.map(log => {
                            const dt = new Date(log.createdAt)
                            const displayTime = isNaN(dt.getTime()) ? log.createdAt : dt.toLocaleString()
                             const truncated = log.eventMessage && log.eventMessage.length > 250 ? log.eventMessage.slice(0,247) + '...' : log.eventMessage || ''
                             const highlightTokens = pipelineSearchTokens
                               .map(t => t.trim())
                               .filter(t => t.length > 0)
                               .sort((a,b) => b.length - a.length)
                             const renderHighlighted = () => {
                               if (highlightTokens.length === 0) return truncated
                               let parts: (string | JSX.Element)[] = [truncated]
                               highlightTokens.forEach((tok, tokIdx) => {
                                 const safe = tok.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
                                 const regex = new RegExp(safe, 'gi')
                                 const nextParts: (string | JSX.Element)[] = []
                                 parts.forEach(p => {
                                   if (typeof p !== 'string') { nextParts.push(p); return }
                                   let lastIndex = 0
                                   let m: RegExpExecArray | null
                                   while ((m = regex.exec(p)) !== null) {
                                     if (m.index > lastIndex) nextParts.push(p.slice(lastIndex, m.index))
                                     nextParts.push(<span key={`hl-${log.logID}-${tokIdx}-${m.index}-${m[0]}`} className="bg-yellow-200 dark:bg-yellow-600/40 px-0.5 rounded">{m[0]}</span>)
                                     lastIndex = m.index + m[0].length
                                   }
                                   if (lastIndex < p.length) nextParts.push(p.slice(lastIndex))
                                 })
                                 parts = nextParts
                               })
                               return parts
                             }
                            return (
                              <tr key={log.logID} className={`border-t hover:bg-gray-50 transition-colors ${newlyFlashedLogIds.has(log.logID) ? 'bg-yellow-50' : ''}`}>
                                <td className="px-2 py-1 align-top"><input type="checkbox" checked={selectedLogIds.has(log.logID)} onChange={() => toggleSelectOne(log.logID)} /></td>
                                <td className="px-2 py-1 align-top whitespace-nowrap text-xs text-gray-600">{displayTime}</td>
                                <td className="px-2 py-1 align-top font-medium text-gray-800">{log.tableName}</td>
                                <td className="px-2 py-1 align-top">
                                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${log.eventType === 'ERROR' ? 'bg-red-100 text-red-700' : log.eventType === 'INFO' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{log.eventType}</span>
                                </td>
                                <td className="px-2 py-1 align-top text-gray-700 text-xs">{renderHighlighted()}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-[10px] text-gray-400">Page {pipelineLogPage} of {pipelineLogTotalPages} {pipelineLogHasMore && '(more available)'} | {pipelineLogs.length} rows shown</p>
                      <div className="space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={pipelineLogPage <= 1 || pipelineLogsLoading}
                          onClick={() => { const newPage = pipelineLogPage - 1; setPipelineLogPage(newPage); fetchPipelineLogs({ page: newPage }) }}
                        >Prev</Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!pipelineLogHasMore || pipelineLogsLoading}
                          onClick={() => { const newPage = pipelineLogPage + 1; setPipelineLogPage(newPage); fetchPipelineLogs({ page: newPage }) }}
                        >Next</Button>
                      </div>
                    </div>
                    <p className="mt-1 text-[10px] text-gray-400">Logs stored in Stage.dbo.Pipeline_Log.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            {selectedLog && (
              <Dialog open={!!selectedLog} onOpenChange={(open) => { if(!open) setSelectedLog(null) }}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <div className="flex items-start justify-between gap-4">
                      <DialogTitle className="flex-1">Log Entry #{selectedLog.logID}</DialogTitle>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (!selectedLog) return
                          const copyText = `LogID: ${selectedLog.logID}\nTime: ${new Date(selectedLog.createdAt).toLocaleString()}\nTable: ${selectedLog.tableName}\nType: ${selectedLog.eventType}\nMessage:\n${selectedLog.eventMessage}`
                          navigator.clipboard.writeText(copyText).then(() => {
                            setCopiedLogId(selectedLog.logID)
                            setTimeout(() => setCopiedLogId(prev => prev === selectedLog.logID ? null : prev), 1600)
                          }).catch(() => {
                            // Fallback: nothing fancy, could add toast later
                            alert('Failed to copy to clipboard')
                          })
                        }}
                        title="Copy log entry to clipboard"
                        className="shrink-0 flex items-center gap-1"
                      >
                        <Copy className={`h-4 w-4 ${copiedLogId === selectedLog.logID ? 'text-green-600' : ''}`} />
                        <span className="text-xs">{copiedLogId === selectedLog.logID ? 'Copied' : 'Copy'}</span>
                      </Button>
                    </div>
                  </DialogHeader>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-semibold">Time:</span> {new Date(selectedLog.createdAt).toLocaleString()}</p>
                    <p><span className="font-semibold">Table:</span> {selectedLog.tableName}</p>
                    <p><span className="font-semibold">Type:</span> {selectedLog.eventType}</p>
                    <div>
                      <p className="font-semibold mb-1">Message:</p>
                      <pre className="whitespace-pre-wrap bg-gray-100 p-2 rounded max-h-96 overflow-auto text-xs">{selectedLog.eventMessage}</pre>
                    </div>
                    <div className="flex justify-end">
                      <Button variant="outline" onClick={() => setSelectedLog(null)}>Close</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            {/* Deployment content removed */}

          </Tabs>
        </div>
      </div>
    </TooltipProvider>
  )
}

// Deployment logs table removed with legacy feature
