"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Users,
  Database,
  CheckCircle,
  XCircle,
  Send,
  Download,
  RefreshCw,
  BarChart3,
  Grid3X3,
  List,
  AlertCircle,
  Eye,
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getTablesList, getTableUploads, sendTableReminder, getCurrentYear } from "@/app/utils/storage"

interface User {
  id: number
  username: string
  email: string
  status: "active" | "inactive"
  created_at: string
  last_login?: string | null
  updated_at?: string
}

export default function TableUploadStatus() {
  const [users, setUsers] = useState<User[]>([])
  const [tables, setTables] = useState<string[]>([])
  const [uploadSummary, setUploadSummary] = useState<Record<string, Record<string, string>>>({})
  const [allUploads, setAllUploads] = useState<any[]>([])
  const [dataNotAvailableRecords, setDataNotAvailableRecords] = useState<any[]>([])
  const [currentYear, setCurrentYear] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUser, setSelectedUser] = useState<string>("all")
  const [selectedTable, setSelectedTable] = useState<string>("all")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState("")

  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const [previewData, setPreviewData] = useState<any>(null)
  const [previewTableName, setPreviewTableName] = useState<string>("")
  const [previewUsername, setPreviewUsername] = useState<string>("")
  const [institutionSummary, setInstitutionSummary] = useState<any>(null)

  // Fetch users from the same API endpoint as User Management
  const fetchUsers = async () => {
    try {
      console.log("Table Upload Status - Fetching users from API...")
      const response = await fetch("/api/users")
      const data = await response.json()

      if (data.success) {
        // Only get active users for upload tracking
        const activeUsers = (data.users || []).filter((user: User) => user.status === "active")
        setUsers(activeUsers)
        console.log(
          "Table Upload Status - Loaded users from API:",
          activeUsers.map((u: User) => u.username),
        )
        setError("")
        return activeUsers
      } else {
        setError(`Failed to fetch users: ${data.error}`)
        console.error("API Error:", data)
        return []
      }
    } catch (error) {
      const errorMessage = `Error fetching users: ${error instanceof Error ? error.message : "Unknown error"}`
      setError(errorMessage)
      console.error("Fetch Error:", error)
      return []
    }
  }

  // Load data function with real-time sync
  const loadData = useCallback(async () => {
    setIsRefreshing(true)
    try {
      // Fetch users from API (same as User Management)
      const apiUsers = await fetchUsers()

      // Get other data from localStorage
      const tablesList = getTablesList()
      const uploads = getTableUploads()
      const dataNotAvailable = JSON.parse(localStorage.getItem("pie-portal-data-not-available") || "[]")
      const year = getCurrentYear()

      // Create upload summary based on API users
      const summary: Record<string, Record<string, string>> = {}

      // Initialize summary object with API users
      apiUsers.forEach((user: User) => {
        summary[user.username] = {}
        tablesList.forEach((table) => {
          summary[user.username][table] = "pending" // Default status
        })
      })

      // Fill in uploaded tables from localStorage uploads
      uploads.forEach((upload) => {
        if (upload.year === year && summary[upload.username]) {
          summary[upload.username][upload.tableName] = "uploaded"
        }
      })

      // Fill in data not available tables
      dataNotAvailable.forEach((record: any) => {
        if (record.year === year && summary[record.username]) {
          summary[record.username][record.tableName] = "data_not_available"
        }
      })

      // Update state with fresh data
      setTables(tablesList)
      setUploadSummary(summary)
      setAllUploads(uploads)
      setDataNotAvailableRecords(dataNotAvailable)
      setCurrentYear(year)

      console.log("Table Upload Status - Data loaded successfully")
      console.log("- Users from API:", apiUsers.length)
      console.log("- Tables:", tablesList.length)
      console.log("- Uploads:", uploads.length)
      console.log("- Data Not Available:", dataNotAvailable.length)
    } catch (error) {
      console.error("Error loading data:", error)
      setError("Error loading data. Please try refreshing.")
    } finally {
      setIsRefreshing(false)
    }
  }, [])

  // Load data on component mount and set up real-time refresh
  useEffect(() => {
    loadData()

    // Set up aggressive refresh for real-time sync (every 2 seconds)
    const interval = setInterval(loadData, 2000)

    return () => clearInterval(interval)
  }, [loadData])

  // Listen for storage changes and custom events
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "pie-portal-table-uploads" || e.key === "pie-portal-data-not-available") {
        console.log("Storage changed, refreshing Table Upload Status...")
        loadData()
      }
    }

    // Listen for custom events (when users are added/removed in User Management)
    const handleCustomStorageChange = () => {
      console.log("Custom storage event, refreshing Table Upload Status...")
      loadData()
    }

    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("userDataChanged", handleCustomStorageChange)
    window.addEventListener("tableUploadChanged", handleCustomStorageChange)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("userDataChanged", handleCustomStorageChange)
      window.removeEventListener("tableUploadChanged", handleCustomStorageChange)
    }
  }, [loadData])

  // Calculate statistics based on current users from API
  const stats = {
    totalUsers: users.length,
    totalTables: tables.length,
    totalUploads: allUploads.filter(
      (upload) => upload.year === currentYear && users.some((user) => user.username === upload.username),
    ).length,
    totalDataNotAvailable: dataNotAvailableRecords.filter(
      (record) => record.year === currentYear && users.some((user) => user.username === record.username),
    ).length,
    completionRate:
      users.length > 0 && tables.length > 0
        ? Math.round(
            ((allUploads.filter(
              (upload) => upload.year === currentYear && users.some((user) => user.username === upload.username),
            ).length +
              dataNotAvailableRecords.filter(
                (record) => record.year === currentYear && users.some((user) => user.username === record.username),
              ).length) /
              (users.length * tables.length)) *
              100,
          )
        : 0,
  }

  // Get user upload data - recalculated every render with fresh user data from API
  const getUserUploadData = () => {
    return users.map((user) => {
      const userStatuses = uploadSummary[user.username] || {}
      const uploadCount = Object.values(userStatuses).filter((status) => status === "uploaded").length
      const dataNotAvailableCount = Object.values(userStatuses).filter(
        (status) => status === "data_not_available",
      ).length
      const completedCount = uploadCount + dataNotAvailableCount
      const completionRate = tables.length > 0 ? (completedCount / tables.length) * 100 : 0
      const pendingTables = tables.filter((table) => userStatuses[table] === "pending")

      return {
        ...user,
        uploadCount,
        dataNotAvailableCount,
        completedCount,
        totalTables: tables.length,
        completionRate,
        pendingTables,
      }
    })
  }

  // Get table upload data - recalculated every render with fresh user data from API
  const getTableUploadData = () => {
    return tables.map((table) => {
      const usersWithUploaded = users.filter((user) => uploadSummary[user.username]?.[table] === "uploaded")
      const usersWithDataNotAvailable = users.filter(
        (user) => uploadSummary[user.username]?.[table] === "data_not_available",
      )
      const usersCompleted = usersWithUploaded.length + usersWithDataNotAvailable.length
      const completionRate = users.length > 0 ? (usersCompleted / users.length) * 100 : 0
      const pendingUsers = users.filter((user) => uploadSummary[user.username]?.[table] === "pending")

      return {
        tableName: table,
        uploadedCount: usersWithUploaded.length,
        dataNotAvailableCount: usersWithDataNotAvailable.length,
        completedCount: usersCompleted,
        totalUsers: users.length,
        completionRate,
        pendingUsers,
      }
    })
  }

  // Handle reminder sending
  const handleSendReminder = (username: string, tableName: string) => {
    sendTableReminder(username, tableName)
    // Trigger a refresh to show updated notifications
    setTimeout(loadData, 500)
  }

  // Analyze Institution data for preview (same as user preview)
  const analyzeInstitutionData = (data: any[]) => {
    // Level ID mappings
    const levelMappings: { [key: string]: string } = {
      "0": "Not Reported",
      "1": "Pre-Primary",
      "2": "Mosque",
      "3": "Primary",
      "4": "Middle/Elementary",
      "5": "High/Secondary",
      "6": "Higher Secondary",
      "7": "Inter. College",
      "8": "Degree College",
      "9": "General University",
      "10": "Industrial School",
      "11": "Village Workshop",
      "12": "Postgraduate Colleges",
      "13": "Other Colleges",
    }

    // Gender ID mappings
    const genderMappings: { [key: string]: string } = {
      "0": "Not Reported",
      "1": "Boys Institution",
      "2": "Girls Institution",
      "3": "Mix Institution",
    }

    // Location ID mappings
    const locationMappings: { [key: string]: string } = {
      "0": "Not Reported",
      "1": "Rural",
      "2": "Urban",
    }

    const summary = {
      totalInstitutions: data.length,
      byLevel: {} as { [key: string]: number },
      byGender: {
        boysInstitution: 0,
        girlsInstitution: 0,
        mixInstitution: 0,
        notReported: 0,
        others: 0,
      },
      byLocation: {} as { [key: string]: number },
    }

    data.forEach((institution) => {
      // Count by Level_Id with proper mapping
      const levelId = String(institution.level_Id || institution.Level_Id || "Unknown")
      const levelLabel = levelMappings[levelId] || `Unknown Level (${levelId})`
      summary.byLevel[levelLabel] = (summary.byLevel[levelLabel] || 0) + 1

      // Count by Gender_Id with proper mapping
      const genderId = String(institution.gender_Id || institution.Gender_Id || "Unknown")
      if (genderId === "1") {
        summary.byGender.boysInstitution++
      } else if (genderId === "2") {
        summary.byGender.girlsInstitution++
      } else if (genderId === "3") {
        summary.byGender.mixInstitution++
      } else if (genderId === "0") {
        summary.byGender.notReported++
      } else {
        summary.byGender.others++
      }

      // Count by Location_Id with proper mapping
      const locationId = String(institution.location_Id || institution.Location_Id || "Unknown")
      const locationLabel = locationMappings[locationId] || `Unknown Location (${locationId})`
      summary.byLocation[locationLabel] = (summary.byLocation[locationLabel] || 0) + 1
    })

    return summary
  }

  // Handle preview of uploaded data
  const handlePreviewUpload = async (username: string, tableName: string) => {
    try {
      // Find the upload record
      const upload = allUploads.find(
        (u) => u.username === username && u.tableName === tableName && u.year === currentYear,
      )

      if (!upload) {
        alert("Upload record not found")
        return
      }

      // For demo purposes, we'll simulate the data structure
      // In a real implementation, you would fetch the actual uploaded data from your API
      let mockData = []

      if (tableName === "Institutions") {
        // Generate mock institution data for preview
        mockData = Array.from({ length: upload.recordCount || 50 }, (_, i) => ({
          id: i + 1,
          Inst_Id: `INST${String(i + 1).padStart(3, "0")}`,
          institution_name: `Sample Institution ${i + 1}`,
          level_Id: Math.floor(Math.random() * 10) + 1,
          gender_Id: Math.floor(Math.random() * 3) + 1,
          location_Id: Math.floor(Math.random() * 2) + 1,
          district: `District ${(i % 5) + 1}`,
          tehsil: `Tehsil ${(i % 3) + 1}`,
          census_year: Number.parseInt(currentYear),
        }))

        // Analyze institution data
        const summary = analyzeInstitutionData(mockData)
        setInstitutionSummary(summary)
      } else {
        // Generate generic mock data for other tables
        mockData = Array.from({ length: upload.recordCount || 25 }, (_, i) => ({
          id: i + 1,
          record_id: `REC${String(i + 1).padStart(3, "0")}`,
          census_year: Number.parseInt(currentYear),
          data_field_1: `Sample Data ${i + 1}`,
          data_field_2: Math.floor(Math.random() * 100),
          data_field_3: Math.random() > 0.5 ? "Active" : "Inactive",
        }))
      }

      setPreviewData(mockData)
      setPreviewTableName(tableName)
      setPreviewUsername(username)
      setShowPreviewDialog(true)
    } catch (error) {
      console.error("Error previewing upload:", error)
      alert("Error loading preview data")
    }
  }

  // Filter uploads for the All Uploads tab - only show uploads from current API users
  const filteredUploads = allUploads.filter((upload) => {
    // Only show uploads from users that currently exist in the API
    const userExists = users.some((user) => user.username === upload.username)
    if (!userExists) return false

    const matchesSearch =
      upload.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      upload.tableName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesUser = selectedUser === "all" || upload.username === selectedUser
    const matchesTable = selectedTable === "all" || upload.tableName === selectedTable
    const matchesYear = upload.year === currentYear

    return matchesSearch && matchesUser && matchesTable && matchesYear
  })

  // Export functions
  const exportToJSON = (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${filename}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return

    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(","),
      ...data.map((row) => headers.map((header) => `"${row[header]}"`).join(",")),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${filename}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-blue-600">Table Upload Status</h2>
          <p className="text-gray-600">
            Track upload progress across all users and tables for {currentYear}
            {users.length > 0 && (
              <span className="ml-2 text-sm text-blue-600">({users.length} active users from database)</span>
            )}
          </p>
        </div>
        <Button onClick={loadData} disabled={isRefreshing} variant="outline" size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-800 flex items-center">
              <XCircle className="h-4 w-4 mr-2" />
              {error}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Active Users (API)</p>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Database className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Total Tables</p>
                <p className="text-2xl font-bold">{stats.totalTables}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Total Uploads</p>
                <p className="text-2xl font-bold">{stats.totalUploads}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Data Not Available</p>
                <p className="text-2xl font-bold">{stats.totalDataNotAvailable}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold">{stats.completionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Show current users for debugging */}
      {users.length === 0 && !isRefreshing && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <p className="text-amber-800">
              No active users found in database. Please add users in the User Management tab.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="by-user" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="by-user" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            By User ({users.length})
          </TabsTrigger>
          <TabsTrigger value="by-table" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            By Table ({tables.length})
          </TabsTrigger>
          <TabsTrigger value="matrix" className="flex items-center gap-2">
            <Grid3X3 className="h-4 w-4" />
            Upload Matrix
          </TabsTrigger>
          <TabsTrigger value="all-uploads" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            All Uploads ({filteredUploads.length})
          </TabsTrigger>
        </TabsList>

        {/* By User Tab */}
        <TabsContent value="by-user" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Upload Progress by User</h3>
            <Button
              onClick={() => exportToCSV(getUserUploadData(), "user-upload-progress")}
              variant="outline"
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>

          {users.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No active users found in database</p>
                <p className="text-sm text-gray-400 mt-2">
                  Add users in the User Management tab to see their upload progress here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {getUserUploadData().map((userData) => (
                <Card key={userData.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-sm">
                            {userData.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <CardTitle className="text-lg">{userData.username}</CardTitle>
                          <CardDescription>
                            {userData.completedCount} of {userData.totalTables} tables completed
                            <span className="text-xs text-gray-500 ml-2">
                              ({userData.uploadCount} uploaded, {userData.dataNotAvailableCount} data not available)
                            </span>
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant={userData.completionRate === 100 ? "default" : "secondary"}>
                        {userData.completionRate.toFixed(0)}% Complete
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Progress value={userData.completionRate} className="h-2" />

                      {userData.pendingTables.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-amber-600">
                            Pending Tables ({userData.pendingTables.length}):
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {userData.pendingTables.slice(0, 5).map((table) => (
                              <div key={table} className="flex items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-amber-50 text-amber-800 border-amber-200"
                                >
                                  {table}
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleSendReminder(userData.username, table)}
                                  className="h-6 px-2 text-xs"
                                >
                                  <Send className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                            {userData.pendingTables.length > 5 && (
                              <Badge variant="outline" className="text-xs">
                                +{userData.pendingTables.length - 5} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* By Table Tab */}
        <TabsContent value="by-table" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Upload Progress by Table</h3>
            <Button
              onClick={() => exportToCSV(getTableUploadData(), "table-upload-progress")}
              variant="outline"
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>

          <div className="grid gap-4">
            {getTableUploadData().map((tableData) => (
              <Card key={tableData.tableName}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{tableData.tableName}</CardTitle>
                      <CardDescription>
                        {tableData.completedCount} of {tableData.totalUsers} users completed
                        <span className="text-xs text-gray-500 ml-2">
                          ({tableData.uploadedCount} uploaded, {tableData.dataNotAvailableCount} data not available)
                        </span>
                      </CardDescription>
                    </div>
                    <Badge variant={tableData.completionRate === 100 ? "default" : "secondary"}>
                      {tableData.completionRate.toFixed(0)}% Complete
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Progress value={tableData.completionRate} className="h-2" />

                    {tableData.pendingUsers.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-amber-600">
                          Pending from Users ({tableData.pendingUsers.length}):
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {tableData.pendingUsers.map((user) => (
                            <div key={user.id} className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs bg-amber-50 text-amber-800 border-amber-200">
                                {user.username}
                              </Badge>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleSendReminder(user.username, tableData.tableName)}
                                className="h-6 px-2 text-xs"
                              >
                                <Send className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Upload Matrix Tab */}
        <TabsContent value="matrix" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Upload Matrix</h3>
            <Button onClick={() => exportToJSON(uploadSummary, "upload-matrix")} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export JSON
            </Button>
          </div>

          <Card>
            <CardContent className="p-4">
              {users.length === 0 ? (
                <div className="text-center py-8">
                  <Grid3X3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No users to display in matrix</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-semibold">User</TableHead>
                        {tables.map((table) => (
                          <TableHead key={table} className="text-center min-w-[120px]">
                            <div className="truncate" title={table}>
                              {table.length > 12 ? `${table.substring(0, 12)}...` : table}
                            </div>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.username}</TableCell>
                          {tables.map((table) => {
                            const status = uploadSummary[user.username]?.[table] || "pending"
                            return (
                              <TableCell key={table} className="text-center">
                                {status === "uploaded" ? (
                                  <CheckCircle className="h-5 w-5 text-green-500 mx-auto" title="Uploaded" />
                                ) : status === "data_not_available" ? (
                                  <AlertCircle className="h-5 w-5 text-orange-500 mx-auto" title="Data Not Available" />
                                ) : (
                                  <XCircle className="h-5 w-5 text-gray-400 mx-auto" title="Pending" />
                                )}
                              </TableCell>
                            )
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* All Uploads Tab */}
        <TabsContent value="all-uploads" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">All Upload Records</h3>
            <Button onClick={() => exportToCSV(filteredUploads, "all-uploads")} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>

          {/* Filters */}
          <div className="flex gap-4 items-center">
            <Input
              placeholder="Search uploads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by user" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.username}>
                    {user.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedTable} onValueChange={setSelectedTable}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by table" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tables</SelectItem>
                {tables.map((table) => (
                  <SelectItem key={table} value={table}>
                    {table}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Table</TableHead>
                    <TableHead>Filename</TableHead>
                    <TableHead>Upload Date</TableHead>
                    <TableHead>File Size</TableHead>
                    <TableHead>Records</TableHead>
                    <TableHead>Status & Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUploads.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        No upload records found for current users
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUploads.map((upload) => (
                      <TableRow key={upload.id}>
                        <TableCell className="font-medium">{upload.username}</TableCell>
                        <TableCell>{upload.tableName}</TableCell>
                        <TableCell>{upload.filename}</TableCell>
                        <TableCell>{upload.uploadDate}</TableCell>
                        <TableCell>{upload.fileSize}</TableCell>
                        <TableCell>{upload.recordCount}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Badge variant={upload.status === "success" ? "default" : "destructive"}>
                              {upload.status}
                            </Badge>
                            {upload.status === "success" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePreviewUpload(upload.username, upload.tableName)}
                                className="h-6 px-2 text-xs border-blue-300 text-blue-600 hover:bg-blue-50"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                Preview
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Data Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Eye className="h-5 w-5 mr-2" />
              Data Preview - {previewTableName} (Uploaded by {previewUsername})
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {previewData && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Upload Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700 font-medium">Username:</span>
                    <span className="ml-2 text-blue-800">{previewUsername}</span>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Table:</span>
                    <span className="ml-2 text-blue-800">{previewTableName}</span>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Total Records:</span>
                    <span className="ml-2 text-blue-800">{previewData.length}</span>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Year:</span>
                    <span className="ml-2 text-blue-800">{currentYear}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Institution-specific summary */}
            {previewTableName === "Institutions" && institutionSummary && (
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900 flex items-center">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Data Summary
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* By Level */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Level ID</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {Object.entries(institutionSummary.byLevel).map(([level, count]) => (
                          <div key={level} className="flex justify-between text-sm">
                            <span className="text-gray-600">{level}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* By Gender */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Gender</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Boys Institution:</span>
                          <span className="font-medium">{institutionSummary.byGender.boysInstitution}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Girls Institution:</span>
                          <span className="font-medium">{institutionSummary.byGender.girlsInstitution}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Mix Institution:</span>
                          <span className="font-medium">{institutionSummary.byGender.mixInstitution}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Not Reported:</span>
                          <span className="font-medium">{institutionSummary.byGender.notReported}</span>
                        </div>
                        {institutionSummary.byGender.others > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Others:</span>
                            <span className="font-medium">{institutionSummary.byGender.others}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* By Location */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Location ID</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(institutionSummary.byLocation).map(([location, count]) => (
                          <div key={location} className="flex justify-between text-sm">
                            <span className="text-gray-600">{location}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">Summary</h4>
                  <p className="text-sm text-green-800">
                    This upload contains <strong>{institutionSummary.totalInstitutions}</strong> institutions. The data
                    includes {Object.keys(institutionSummary.byLevel).length} different education levels,
                    {institutionSummary.byGender.boysInstitution +
                      institutionSummary.byGender.girlsInstitution +
                      institutionSummary.byGender.mixInstitution +
                      institutionSummary.byGender.notReported +
                      institutionSummary.byGender.others}{" "}
                    institutions by gender distribution, and {Object.keys(institutionSummary.byLocation).length}{" "}
                    different location types.
                  </p>
                </div>
              </div>
            )}

            {/* Generic summary for other tables */}
            {previewTableName !== "Institutions" && previewData && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Data Summary</h3>
                <p className="text-sm text-gray-700">
                  This upload contains <strong>{previewData.length}</strong> records for {previewTableName} table
                  uploaded by {previewUsername}.
                </p>

                {/* Show sample of first few records */}
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-800 mb-2">Sample Records (First 3):</h4>
                  <div className="bg-white p-3 rounded border text-xs">
                    <pre className="whitespace-pre-wrap overflow-x-auto">
                      {JSON.stringify(previewData.slice(0, 3), null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            )}

            {/* Close button */}
            <div className="flex justify-end pt-4 border-t">
              <Button onClick={() => setShowPreviewDialog(false)} variant="outline">
                Close Preview
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
