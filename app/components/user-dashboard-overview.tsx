"use client"

import { useState, useEffect } from "react"
interface Notification {
  id: number;
  message: string;
  is_read: boolean;
  created_at: string;
}
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
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [notifLoading, setNotifLoading] = useState(false)
  // Fetch notifications for the user
  useEffect(() => {
    if (!isClient || !username) return;
    const fetchNotifications = async () => {
      setNotifLoading(true);
      try {
        const res = await fetch(`/api/notifications?userId=${encodeURIComponent(username)}`);
        if (res.ok) {
          const json = await res.json();
          setNotifications(json.notifications || []);
        }
      } catch (e) {
        setNotifications([]);
      } finally {
        setNotifLoading(false);
      }
    };
    fetchNotifications();
  }, [isClient, username]);

  const handleMarkNotifRead = async (id: number) => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    setNotifications((prev) => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

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
    if (!isClient) return;


    const loadData = async () => {
      // Fetch upload history from API
      let userUploadHistory: any[] = [];
      let userTableUploads: any[] = [];
      try {
        const res = await fetch(`/api/upload-history?username=${encodeURIComponent(username)}`);
        if (res.ok) {
          const json = await res.json();
          userUploadHistory = json.uploadHistory || [];
          userTableUploads = userUploadHistory.filter((upload: any) => String(upload.censusYear) === String(currentYear));
        }
      } catch (err) {
        userUploadHistory = [];
        userTableUploads = [];
      }

      // Fetch data not available from API
      let userDataNotAvailable: any[] = [];
      try {
        const res = await fetch(`/api/data-not-available?username=${encodeURIComponent(username)}`);
        if (res.ok) {
          const json = await res.json();
          userDataNotAvailable = (json.dataNotAvailable || []).filter(
            (record: any) => String(record.census_year) === String(currentYear)
          );
        }
      } catch (err) {
        userDataNotAvailable = [];
      }

      setUploadedTables(userTableUploads);
      setDataNotAvailableTables(userDataNotAvailable);
      setUploadHistory(userUploadHistory);

      // Debug log to check data
      console.log("User upload history (API):", userUploadHistory);
      console.log("Current username:", username);
      console.log("Data Not Available from API:", userDataNotAvailable);
    };

    loadData();

    // Listen for upload history updates
    const handleUploadHistoryUpdate = () => {
      loadData();
    };

    window.addEventListener("uploadHistoryUpdated", handleUploadHistoryUpdate);
    window.addEventListener("storage", handleUploadHistoryUpdate);

    return () => {
      window.removeEventListener("uploadHistoryUpdated", handleUploadHistoryUpdate);
      window.removeEventListener("storage", handleUploadHistoryUpdate);
    };
  }, [isClient, username, currentYear]);

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
  // Status counts
  const approvedCount = uploadHistory.filter((u) => String(u.status).toLowerCase() === "approved").length;
  const rejectedCount = uploadHistory.filter((u) => String(u.status).toLowerCase() === "rejected").length;
  const inReviewCount = uploadHistory.filter((u) => String(u.status).toLowerCase() === "in-review").length;

  // Get recent uploads (last 5) - sort by upload date descending
  const recentUploads = uploadHistory
    .sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())
    .slice(0, 5)



  const handlePreviewUpload = (upload: any) => {
    setSelectedUpload(upload)
    setShowPreviewDialog(true)
  }

  // Unread notification count
  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="space-y-6">
      {/* In-App Notifications */}
      <div className="mb-4">
        <Card className="border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-blue-800 flex items-center">
              Notifications
              {notifLoading ? (
                <span className="ml-2 animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></span>
              ) : unreadCount > 0 ? (
                <span className="ml-2 bg-blue-600 text-white rounded-full px-2 py-0.5 text-xs">{unreadCount} new</span>
              ) : null}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {notifications.length === 0 && !notifLoading && (
              <div className="text-gray-500 text-sm">No notifications yet.</div>
            )}
            {notifications.length > 0 && (
              <ul className="divide-y divide-gray-100">
                {notifications.map((notif) => (
                  <li key={notif.id} className={`py-2 flex items-center justify-between ${notif.is_read ? 'opacity-60' : ''}`}>
                    <div>
                      <span className="block text-sm">{notif.message}</span>
                      <span className="block text-xs text-gray-400">{new Date(notif.created_at).toLocaleString()}</span>
                    </div>
                    {!notif.is_read && (
                      <Button size="sm" variant="outline" className="ml-2" onClick={() => handleMarkNotifRead(notif.id)}>
                        Mark as read
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* In-Review */}
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-800">In-Review</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-900">{inReviewCount}</div>
            <p className="text-xs text-yellow-700 mt-1">Uploads in review</p>
          </CardContent>
        </Card>
        {/* Approved */}
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{approvedCount}</div>
            <p className="text-xs text-green-700 mt-1">Uploads approved</p>
          </CardContent>
        </Card>

        {/* Rejected */}
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-800">Rejected</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">{rejectedCount}</div>
            <p className="text-xs text-red-700 mt-1">Uploads rejected</p>
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
                    <h4 className="font-medium text-orange-900">{record.table_name}</h4>
                    <Badge className="bg-orange-100 text-orange-800 border-0">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Not Available
                    </Badge>
                  </div>
                  <div className="text-sm text-orange-700">
                    <div className="flex justify-between">
                      <span>Reported Date:</span>
                      <span className="font-medium">{record.report_date ? new Date(record.report_date).toLocaleDateString() : ''}</span>
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
