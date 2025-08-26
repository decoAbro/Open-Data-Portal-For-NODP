"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  BarChart3,
  FileText,
  CheckCircle,
  AlertCircle,
  Upload,
  Calendar,
  Database,
  Eye,
  TrendingUp,
} from "lucide-react"
import {
  getTablesList,
  getTableUploadsByUsername,
  getDataNotAvailableByUsername,
  getUploadHistory,
  getCurrentYear,
  getUploadWindowStatus,
} from "../utils/storage"

interface UserDashboardOverviewProps {
  username: string
}

export default function UserDashboardOverview({ username }: UserDashboardOverviewProps) {
  const [isClient, setIsClient] = useState(false)
  const [uploadedTables, setUploadedTables] = useState<any[]>([])
  const [dataNotAvailableTables, setDataNotAvailableTables] = useState<any[]>([])
  const [uploadHistory, setUploadHistory] = useState<any[]>([])
  const [selectedUpload, setSelectedUpload] = useState<any>(null)
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)

  const tables = getTablesList()
  const [currentYear, setCurrentYear] = useState("")

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Initial setup
  useEffect(() => {
    if (!isClient) return

    const setInitialYear = async () => {
      // First try to get the year from the server
      const status = await getUploadWindowStatus();
      if (status.year) {
        setCurrentYear(status.year);
      } else {
        // Fall back to local storage if server doesn't have a year set
        setCurrentYear(getCurrentYear());
      }
    };

    setInitialYear();
  }, [isClient])

  // Get the census year from the server
  useEffect(() => {
    const fetchWindowStatus = async () => {
      const status = await getUploadWindowStatus();
      if (status.year) {
        setCurrentYear(status.year);
      }
    };

    fetchWindowStatus();
  }, [])

  useEffect(() => {
    if (!isClient) return

    const loadData = () => {
      // Load user-specific data
      const userTableUploads = getTableUploadsByUsername(username).filter((upload) => upload.year === currentYear)
      const userDataNotAvailable = getDataNotAvailableByUsername(username).filter(
        (record) => record.year === currentYear,
      )
      const userUploadHistory = getUploadHistory().filter((record) => record.username === username)

      setUploadedTables(userTableUploads)
      setDataNotAvailableTables(userDataNotAvailable)
      setUploadHistory(userUploadHistory)

      // Debug log to check data
      console.log("User upload history:", userUploadHistory)
      console.log("Current username:", username)
      console.log("All upload history:", getUploadHistory())
    }

    loadData()

    // Listen for upload history updates
    const handleUploadHistoryUpdate = () => {
      loadData()
    }

    window.addEventListener("uploadHistoryUpdated", handleUploadHistoryUpdate)
    window.addEventListener("storage", handleUploadHistoryUpdate)

    return () => {
      window.removeEventListener("uploadHistoryUpdated", handleUploadHistoryUpdate)
      window.removeEventListener("storage", handleUploadHistoryUpdate)
    }
  }, [isClient, username, currentYear])

  if (!isClient) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Calculate statistics
  const totalTables = tables.length
  const uploadedCount = uploadedTables.length
  const dataNotAvailableCount = dataNotAvailableTables.length
  const completedCount = uploadedCount + dataNotAvailableCount
  const remainingCount = totalTables - completedCount
  const completionRate = totalTables > 0 ? Math.round((completedCount / totalTables) * 100) : 0

  // Get recent uploads (last 5) - sort by upload date descending
  const recentUploads = uploadHistory
    .sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())
    .slice(0, 5)

  // Calculate total file size uploaded
  const totalSizeKB = uploadHistory.reduce((total, upload) => {
    const sizeMatch = upload.fileSize.match(/(\d+\.?\d*)\s*KB/)
    return total + (sizeMatch ? Number.parseFloat(sizeMatch[1]) : 0)
  }, 0)

  const formatFileSize = (sizeKB: number) => {
    if (sizeKB >= 1024) {
      return `${(sizeKB / 1024).toFixed(1)} MB`
    }
    return `${sizeKB.toFixed(1)} KB`
  }

  const handlePreviewUpload = (upload: any) => {
    setSelectedUpload(upload)
    setShowPreviewDialog(true)
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Tables Uploaded */}
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Tables Uploaded</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{uploadedCount}</div>
            <p className="text-xs text-green-700 mt-1">Successfully uploaded for {currentYear}</p>
          </CardContent>
        </Card>

        {/* Tables Remaining */}
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-800">Tables Remaining</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-900">{remainingCount}</div>
            <p className="text-xs text-amber-700 mt-1">Pending upload or data not available</p>
          </CardContent>
        </Card>

        {/* Completion Rate */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{completionRate}%</div>
            <Progress value={completionRate} className="mt-2 h-2" />
            <p className="text-xs text-blue-700 mt-1">
              {completedCount} of {totalTables} tables completed
            </p>
          </CardContent>
        </Card>

        {/* Data Not Available */}
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">Data Not Available</CardTitle>
            <Database className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">{dataNotAvailableCount}</div>
            <p className="text-xs text-orange-700 mt-1">Tables marked as unavailable</p>
          </CardContent>
        </Card>
      </div>

      {/* Upload Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Upload Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{uploadHistory.length}</div>
                <div className="text-sm text-blue-800">Total Uploads</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {uploadHistory.filter((u) => u.status === "success").length}
                </div>
                <div className="text-sm text-green-800">Successful</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Data Uploaded:</span>
                <span className="font-medium">{formatFileSize(totalSizeKB)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Current Year:</span>
                <span className="font-medium">{currentYear}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Last Upload:</span>
                <span className="font-medium">
                  {uploadHistory.length > 0 ? new Date(uploadHistory[0].uploadDate).toLocaleDateString() : "None"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Uploads */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="h-5 w-5 mr-2" />
              Recent Uploads ({uploadHistory.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentUploads.length > 0 ? (
              <div className="space-y-3">
                {recentUploads.map((upload, index) => (
                  <div key={upload.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium truncate">{upload.filename}</span>
                        <Badge
                          variant={
                            upload.status === "success"
                              ? "default"
                              : upload.status === "pending"
                                ? "secondary"
                                : "destructive"
                          }
                          className={
                            upload.status === "success"
                              ? "bg-green-100 text-green-800 border-0"
                              : upload.status === "pending"
                                ? "bg-yellow-100 text-yellow-800 border-0"
                                : "bg-red-100 text-red-800 border-0"
                          }
                        >
                          {upload.status}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(upload.uploadDate).toLocaleDateString()}
                        </span>
                        <span>{upload.fileSize}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handlePreviewUpload(upload)} className="ml-2">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No uploads yet</p>
                <p className="text-xs mt-1">Upload data will appear here after you submit files</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Debug Information - Remove this in production */}
      {process.env.NODE_ENV === "development" && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-sm text-yellow-800">Debug Info (Development Only)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs space-y-1">
              <p>
                <strong>Username:</strong> {username}
              </p>
              <p>
                <strong>Upload History Count:</strong> {uploadHistory.length}
              </p>
              <p>
                <strong>Recent Uploads Count:</strong> {recentUploads.length}
              </p>
              <p>
                <strong>All Upload History:</strong> {JSON.stringify(getUploadHistory(), null, 2)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Uploaded Tables Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="h-5 w-5 mr-2" />
            Uploaded Tables Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {uploadedTables.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {uploadedTables.map((upload, index) => (
                <div key={upload.id || index} className="p-4 border rounded-lg bg-green-50 border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-green-900">{upload.tableName}</h4>
                    <Badge className="bg-green-100 text-green-800 border-0">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Uploaded
                    </Badge>
                  </div>
                  <div className="space-y-1 text-sm text-green-700">
                    <div className="flex justify-between">
                      <span>Records:</span>
                      <span className="font-medium">{upload.recordCount?.toLocaleString() || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>File Size:</span>
                      <span className="font-medium">{upload.fileSize}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Upload Date:</span>
                      <span className="font-medium">{new Date(upload.uploadDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Database className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No tables uploaded yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Not Available Tables */}
      {dataNotAvailableTables.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-orange-600" />
              Data Not Available Tables
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dataNotAvailableTables.map((record, index) => (
                <div key={record.id || index} className="p-4 border rounded-lg bg-orange-50 border-orange-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-orange-900">{record.tableName}</h4>
                    <Badge className="bg-orange-100 text-orange-800 border-0">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Not Available
                    </Badge>
                  </div>
                  <div className="text-sm text-orange-700">
                    <div className="flex justify-between">
                      <span>Reported Date:</span>
                      <span className="font-medium">{new Date(record.reportDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Eye className="h-5 w-5 mr-2" />
              Upload Details
            </DialogTitle>
          </DialogHeader>
          {selectedUpload && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Filename</label>
                  <p className="text-sm text-gray-900 mt-1">{selectedUpload.filename}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Upload Date</label>
                  <p className="text-sm text-gray-900 mt-1">{new Date(selectedUpload.uploadDate).toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">File Size</label>
                  <p className="text-sm text-gray-900 mt-1">{selectedUpload.fileSize}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Year</label>
                  <p className="text-sm text-gray-900 mt-1">{selectedUpload.year}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <div className="mt-1">
                    <Badge
                      variant={
                        selectedUpload.status === "success"
                          ? "default"
                          : selectedUpload.status === "pending"
                            ? "secondary"
                            : "destructive"
                      }
                      className={
                        selectedUpload.status === "success"
                          ? "bg-green-100 text-green-800 border-0"
                          : selectedUpload.status === "pending"
                            ? "bg-yellow-100 text-yellow-800 border-0"
                            : "bg-red-100 text-red-800 border-0"
                      }
                    >
                      {selectedUpload.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {selectedUpload.message && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Message</label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-900">{selectedUpload.message}</p>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
