"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import UploadHistory from "./upload-history"
import {
  Upload,
  CheckCircle,
  XCircle,
  Info,
  AlertCircle,
  Bell,
  Clock,
  Settings,
  Eye,
  EyeOff,
  FileJson,
  Table,
  BarChart3,
} from "lucide-react"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  getUserByUsername,
  getNotificationsForUser,
  markNotificationAsRead,
  markUserHasUploaded,
  initializeStorage,
  clearNotificationsForUser,
  checkUploadDeadlines,
  getCurrentYear,
  addUploadRecord,
  type Notification,
} from "../utils/storage"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import JsonConverterContent from "../json-converter/components/json-converter-content"
import TableUploadTracker from "./table-upload-tracker"
import UserDashboardOverview from "./user-dashboard-overview"

// Add this after the imports and before the component
const bannerStyles = `
  @keyframes marquee {
    0% { transform: translate3d(100%, 0, 0); }
    100% { transform: translate3d(-100%, 0, 0); }
  }
  .animate-marquee {
    animation: marquee 25s linear infinite;
  }
`

interface DashboardProps {
  userCredentials: { username: string; password: string }
  onLogout: () => void
}

export default function Dashboard({ userCredentials, onLogout }: DashboardProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle")
  const [statusMessage, setStatusMessage] = useState("")
  const [progress, setProgress] = useState(0)
  const [hasUploadPermission, setHasUploadPermission] = useState(false)
  const [hasUploaded, setHasUploaded] = useState(false)
  const [uploadDeadline, setUploadDeadline] = useState<string | null>(null)
  const [currentYear, setCurrentYear] = useState<string>("")
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isClient, setIsClient] = useState(false)
  const [activeTab, setActiveTab] = useState("dashboard")

  // Password change states
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordError, setPasswordError] = useState("")
  const [passwordSuccess, setPasswordSuccess] = useState("")
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  // Initialize client-side state
  useEffect(() => {
    setIsClient(true)
    initializeStorage()
  }, [])

  // Check user status on component mount
  useEffect(() => {
    if (!isClient) return

    loadUserStatus()
    loadNotifications()
    setCurrentYear(getCurrentYear())

    const interval = setInterval(() => {
      checkUploadDeadlines() // Check if deadlines have passed
      loadUserStatus()
      loadNotifications()
      setCurrentYear(getCurrentYear())
    }, 5000) // Check every 5 seconds

    return () => clearInterval(interval)
  }, [userCredentials.username, isClient])

  const loadUserStatus = () => {
    if (!isClient) return

    const userData = getUserByUsername(userCredentials.username)
    if (userData) {
      setHasUploadPermission(userData.uploadPermission)
      setHasUploaded(userData.hasUploaded)
      setUploadDeadline(userData.uploadDeadline || null)
    }
  }

  const loadNotifications = () => {
    if (!isClient) return

    const userNotifications = getNotificationsForUser(userCredentials.username)
    setNotifications(userNotifications)
    setUnreadCount(userNotifications.filter((n) => !n.read).length)
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type === "application/json" || selectedFile.name.endsWith(".json")) {
        const reader = new FileReader()
        reader.onload = async (e) => {
          try {
            const content = e.target?.result as string
            JSON.parse(content) // Just validate it's valid JSON
            setFile(selectedFile)
            setUploadStatus("idle")
            setStatusMessage("")
          } catch (error) {
            setUploadStatus("error")
            setStatusMessage(`Invalid JSON format: ${error instanceof Error ? error.message : "Unknown error"}`)
            setFile(null)
          }
        }
        reader.onerror = () => {
          setUploadStatus("error")
          setStatusMessage("Failed to read the file.")
          setFile(null)
        }
        reader.readAsText(selectedFile)
      } else {
        setUploadStatus("error")
        setStatusMessage("Please select a valid JSON file")
        setFile(null)
      }
    }
  }

  const validateJsonData = async (jsonContent: string): Promise<boolean> => {
    try {
      const data = JSON.parse(jsonContent)

      // Just check if data exists and is valid JSON
      if (data) {
        return true
      } else {
        setUploadStatus("error")
        setStatusMessage(`Error: Invalid JSON data`)
        return false
      }
    } catch (error) {
      setUploadStatus("error")
      setStatusMessage(`Error validating JSON: ${error instanceof Error ? error.message : "Unknown error"}`)
      return false
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setUploadStatus("error")
      setStatusMessage("Please select a JSON file")
      return
    }

    if (!hasUploadPermission) {
      setUploadStatus("error")
      setStatusMessage(
        "You don't have permission to upload data. Please wait for the administrator to open an upload window.",
      )
      return
    }

    if (hasUploaded) {
      setUploadStatus("error")
      setStatusMessage("You have already uploaded data for this window.")
      return
    }

    // Check if deadline has passed
    if (uploadDeadline) {
      const deadline = new Date(uploadDeadline)
      const now = new Date()
      if (now > deadline) {
        setUploadStatus("error")
        setStatusMessage("Upload deadline has passed. The upload window is now closed.")
        return
      }
    }

    let jsonContent: string
    try {
      jsonContent = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const content = e.target?.result as string
            JSON.parse(content) // Validate JSON format
            resolve(content)
          } catch (error) {
            reject(new Error("Invalid JSON format"))
          }
        }
        reader.onerror = () => reject(new Error("Failed to read file"))
        reader.readAsText(file)
      })

      // Validate the census_year in the JSON
      const isValidJson = await validateJsonData(jsonContent)
      if (!isValidJson) {
        return
      }
    } catch (error) {
      setUploadStatus("error")
      setStatusMessage(`File error: ${error instanceof Error ? error.message : "Unknown error"}`)
      return
    }

    setUploading(true)
    setProgress(0)
    setUploadStatus("idle")

    let progressInterval: NodeJS.Timeout | null = null

    try {
      progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval!)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const response = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonData: JSON.parse(jsonContent),
          username: userCredentials.username,
          password: userCredentials.password,
        }),
      })

      clearInterval(progressInterval!)
      setProgress(100)

      if (response.ok) {
        const result = await response.text()
        setUploadStatus("success")
        setStatusMessage(`Upload successful! ${result}`)

        // Add to upload history
        addUploadRecord({
          username: userCredentials.username,
          filename: file.name,
          uploadDate: new Date().toLocaleString(),
          fileSize: `${(file.size / 1024).toFixed(1)} KB`,
          year: currentYear,
          status: "success",
          message: "Upload successful",
        })

        // Mark user as having uploaded
        markUserHasUploaded(userCredentials.username)
        setHasUploaded(true)
        setHasUploadPermission(false)
      } else {
        const errorText = await response.text()
        setUploadStatus("error")
        setStatusMessage(`Upload failed: ${response.status} - ${errorText}`)

        // Add failed upload to history
        addUploadRecord({
          username: userCredentials.username,
          filename: file.name,
          uploadDate: new Date().toLocaleString(),
          fileSize: `${(file.size / 1024).toFixed(1)} KB`,
          year: currentYear,
          status: "failed",
          message: `Failed: ${errorText}`,
        })
      }
    } catch (error) {
      clearInterval(progressInterval!)
      setProgress(0)
      setUploadStatus("error")
      setStatusMessage(`Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`)

      // Add failed upload to history
      addUploadRecord({
        username: userCredentials.username,
        filename: file.name,
        uploadDate: new Date().toLocaleString(),
        fileSize: `${(file.size / 1024).toFixed(1)} KB`,
        year: currentYear,
        status: "failed",
        message: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      })
    } finally {
      setUploading(false)
    }
  }

  const handleNotificationRead = (id: number) => {
    if (!isClient) return

    markNotificationAsRead(id)
    loadNotifications()
  }

  const handleClearNotifications = () => {
    if (!isClient) return

    clearNotificationsForUser(userCredentials.username)
    loadNotifications()
  }

  const resetForm = () => {
    setFile(null)
    setUploadStatus("idle")
    setStatusMessage("")
    setProgress(0)
    const fileInput = document.getElementById("json-file") as HTMLInputElement
    if (fileInput) fileInput.value = ""
  }

  const handlePasswordChange = async () => {
    setPasswordError("")
    setPasswordSuccess("")

    // Validate inputs
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("All password fields are required")
      return
    }

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long")
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation do not match")
      return
    }

    if (currentPassword === newPassword) {
      setPasswordError("New password must be different from current password")
      return
    }

    setIsChangingPassword(true)

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: userCredentials.username,
          currentPassword,
          newPassword,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setPasswordSuccess("Password changed successfully!")
        // Clear form
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
        // Update stored credentials
        const updatedCredentials = { ...userCredentials, password: newPassword }
        if (typeof window !== "undefined") {
          localStorage.setItem("pie-portal-credentials", JSON.stringify(updatedCredentials))
        }
        // Close dialog after 2 seconds
        setTimeout(() => {
          setShowPasswordChange(false)
          setPasswordSuccess("")
        }, 2000)
      } else {
        setPasswordError(data.error || "Failed to change password")
      }
    } catch (error) {
      setPasswordError("Error changing password. Please try again.")
      console.error("Password change error:", error)
    } finally {
      setIsChangingPassword(false)
    }
  }

  const resetPasswordForm = () => {
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
    setPasswordError("")
    setPasswordSuccess("")
    setShowCurrentPassword(false)
    setShowNewPassword(false)
    setShowConfirmPassword(false)
  }

  const getTimeRemaining = () => {
    if (!uploadDeadline) return null

    const deadline = new Date(uploadDeadline)
    const now = new Date()
    const timeLeft = deadline.getTime() - now.getTime()

    if (timeLeft <= 0) return "Expired"

    const hours = Math.floor(timeLeft / (1000 * 60 * 60))
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 24) {
      const days = Math.floor(hours / 24)
      return `${days} day(s) remaining`
    } else if (hours > 0) {
      return `${hours}h ${minutes}m remaining`
    } else {
      return `${minutes}m remaining`
    }
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
    <div className="min-h-screen bg-gray-50">
      <style dangerouslySetInnerHTML={{ __html: bannerStyles }} />
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
                <p className="text-sm text-green-600 font-medium">Data Upload Portal</p>
                <p className="text-xs text-gray-500">Welcome, {userCredentials.username}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Dialog open={showNotifications} onOpenChange={setShowNotifications}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="relative">
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                        {unreadCount}
                      </span>
                    )}
                    <Bell className="h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <div className="flex items-center justify-between">
                      <DialogTitle>Notifications</DialogTitle>
                      {notifications.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleClearNotifications}
                          className="text-red-600 border-red-300 hover:bg-red-50 bg-transparent"
                        >
                          Clear All
                        </Button>
                      )}
                    </div>
                  </DialogHeader>
                  <div className="space-y-4 max-h-[60vh] overflow-auto">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 rounded-md cursor-pointer ${
                          notification.read
                            ? "bg-gray-50"
                            : notification.type === "table_reminder"
                              ? "bg-amber-50 border border-amber-200"
                              : "bg-blue-50"
                        }`}
                        onClick={() => handleNotificationRead(notification.id)}
                      >
                        {notification.type === "table_reminder" && (
                          <div className="flex items-center mb-2">
                            <AlertCircle className="h-4 w-4 text-amber-600 mr-2" />
                            <span className="text-xs font-medium text-amber-600 uppercase">Table Reminder</span>
                          </div>
                        )}
                        <p
                          className={`text-sm ${
                            notification.read
                              ? "text-gray-800"
                              : notification.type === "table_reminder"
                                ? "text-amber-800 font-medium"
                                : "text-blue-800 font-medium"
                          }`}
                        >
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{notification.date}</p>
                      </div>
                    ))}
                    {notifications.length === 0 && <p className="text-center text-gray-500 py-4">No notifications</p>}
                  </div>
                </DialogContent>
              </Dialog>

              {/* Password Change Dialog */}
              <Dialog open={showPasswordChange} onOpenChange={setShowPasswordChange}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-blue-300 text-blue-600 hover:bg-blue-50 bg-transparent"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Change Password</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="current-password">Current Password</Label>
                      <div className="relative">
                        <Input
                          id="current-password"
                          type={showCurrentPassword ? "text" : "password"}
                          placeholder="Enter current password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="mt-1 pr-10"
                          disabled={isChangingPassword}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-1 h-9 px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          disabled={isChangingPassword}
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="new-password">New Password</Label>
                      <div className="relative">
                        <Input
                          id="new-password"
                          type={showNewPassword ? "text" : "password"}
                          placeholder="Enter new password (min 6 characters)"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="mt-1 pr-10"
                          disabled={isChangingPassword}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-1 h-9 px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          disabled={isChangingPassword}
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <div className="relative">
                        <Input
                          id="confirm-password"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm new password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="mt-1 pr-10"
                          disabled={isChangingPassword}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-1 h-9 px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          disabled={isChangingPassword}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {passwordError && (
                      <Alert variant="destructive">
                        <AlertDescription>{passwordError}</AlertDescription>
                      </Alert>
                    )}

                    {passwordSuccess && (
                      <Alert className="bg-green-50 border-green-200">
                        <CheckCircle className="h-4 w-4 text-green-600" />
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
                        disabled={isChangingPassword}
                      >
                        Cancel
                      </Button>
                      <div className="space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={resetPasswordForm}
                          disabled={isChangingPassword}
                        >
                          Reset
                        </Button>
                        <Button type="button" onClick={handlePasswordChange} disabled={isChangingPassword}>
                          {isChangingPassword ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                              Changing...
                            </>
                          ) : (
                            "Change Password"
                          )}
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

      {/* Upload Window Banner */}
      {hasUploadPermission && uploadDeadline && (
        <div className="bg-blue-600 text-white py-2 overflow-hidden">
          <div className="relative flex items-center">
            <div className="animate-marquee whitespace-nowrap">
              <span className="mx-4 inline-flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Upload window is open! Deadline: {new Date(uploadDeadline).toLocaleString()} ({getTimeRemaining()})
              </span>
              <span className="mx-4 inline-flex items-center">
                <Info className="h-4 w-4 mr-2" />
                Please upload your data for Census Year {currentYear} before the deadline.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="dashboard" className="flex items-center">
              <BarChart3 className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="tables" className="flex items-center">
              <Table className="h-4 w-4 mr-2" />
              Table Uploads
            </TabsTrigger>
            <TabsTrigger value="bulk" className="flex items-center">
              <Upload className="h-4 w-4 mr-2" />
              Bulk Upload
            </TabsTrigger>
            <TabsTrigger value="json-converter" className="flex items-center">
              <FileJson className="h-4 w-4 mr-2" />
              JSON Converter
            </TabsTrigger>
            <TabsTrigger value="upload-history" className="flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              Upload History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <UserDashboardOverview username={userCredentials.username} />
          </TabsContent>

          <TabsContent value="tables">
            <TableUploadTracker
              username={userCredentials.username}
              password={userCredentials.password}
              hasUploadPermission={hasUploadPermission}
              hasUploaded={hasUploaded}
              uploadDeadline={uploadDeadline}
            />
          </TabsContent>

          <TabsContent value="bulk">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold">Bulk Data Upload</h2>
                      <p className="text-gray-500 text-sm mt-1">
                        Upload your data file for {currentYear} in JSON format
                      </p>
                    </div>
                    {uploadDeadline && (
                      <div className="flex items-center text-sm">
                        <Clock className="h-4 w-4 mr-1 text-amber-600" />
                        <span className="text-amber-600 font-medium">{getTimeRemaining()}</span>
                      </div>
                    )}
                  </div>

                  {/* Upload Status */}
                  {uploadStatus === "success" && (
                    <Alert className="bg-green-50 border-green-200">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">{statusMessage}</AlertDescription>
                    </Alert>
                  )}

                  {uploadStatus === "error" && (
                    <Alert variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>{statusMessage}</AlertDescription>
                    </Alert>
                  )}

                  {/* File Upload */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-4" />
                    <div className="space-y-2">
                      <Label htmlFor="json-file" className="cursor-pointer">
                        <span className="text-blue-600 hover:text-blue-700 font-medium">Click to upload</span>
                        <span className="text-gray-600"> or drag and drop</span>
                      </Label>
                      <Input
                        id="json-file"
                        type="file"
                        accept=".json,application/json"
                        onChange={handleFileChange}
                        disabled={uploading || !hasUploadPermission || hasUploaded}
                        className="hidden"
                      />
                      <p className="text-sm text-gray-500">JSON files only</p>
                    </div>
                  </div>

                  {/* Selected File */}
                  {file && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium text-green-900">{file.name}</p>
                          <p className="text-sm text-green-700">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Upload Progress */}
                  {uploading && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">Upload Progress</Label>
                      <Progress value={progress} className="w-full h-3 mb-2" />
                      <p className="text-sm text-gray-600 text-center">{progress}% complete</p>
                    </div>
                  )}

                  {/* Upload Button */}
                  <div className="flex justify-end space-x-3">
                    <Button variant="outline" onClick={resetForm} disabled={uploading || !file}>
                      Reset
                    </Button>
                    <Button onClick={handleUpload} disabled={!file || uploading || !hasUploadPermission || hasUploaded}>
                      {uploading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Upload Status Messages */}
                  {!hasUploadPermission && !hasUploaded && (
                    <Alert className="border-amber-200 bg-amber-50">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-amber-800">
                        You don't have permission to upload data. Please wait for the administrator to open an upload
                        window.
                      </AlertDescription>
                    </Alert>
                  )}

                  {hasUploaded && (
                    <Alert className="border-green-200 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        You have already uploaded data for this window. If you need to make changes, please contact the
                        administrator.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="json-converter">
            <JsonConverterContent />
          </TabsContent>

          <TabsContent value="upload-history">
            <UploadHistory username={userCredentials.username} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
