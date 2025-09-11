"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Database,
  RefreshCw,
  Trash2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Users,
  FileText,
  Clock,
  Key,
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface TableData {
  tableName: string
  recordCount: number
  status: "active" | "error"
  error?: string
  uniqueUsers?: number
  uniqueTables?: number
  totalSizeBytes?: number
  earliestUpload?: string
  latestUpload?: string
}

export default function DatabaseDataStatus() {
  const [tableData, setTableData] = useState<TableData[]>([])
  const [loading, setLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedTable, setSelectedTable] = useState("")
  const [deleteBy, setDeleteBy] = useState<"Province_Id" | "uploadedBy">("Province_Id")
  const [deleteValue, setDeleteValue] = useState("")
  const [deleteResult, setDeleteResult] = useState<string | null>(null)

  const fetchTableData = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/database-data-status")
      const data = await response.json()
      setTableData(data.tableData || [])
    } catch (error) {
      console.error("Error fetching table data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedTable || !deleteValue) return

    setDeleteLoading(true)
    setDeleteResult(null)

    try {
      const params = new URLSearchParams({
        tableName: selectedTable,
        [deleteBy]: deleteValue,
      })

      const response = await fetch(`/api/database-data-status?${params}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (response.ok) {
        setDeleteResult(`✅ ${result.message}`)
        // Refresh data after successful deletion
        await fetchTableData()
      } else {
        setDeleteResult(`❌ Error: ${result.error}`)
      }
    } catch (error) {
      setDeleteResult(`❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setDeleteLoading(false)
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getTableIcon = (tableName: string) => {
    switch (tableName) {
      case "users":
        return <Users className="h-5 w-5" />
      case "Building":
        return <FileText className="h-5 w-5" />
      case "UploadWindow":
        return <Clock className="h-5 w-5" />
      case "password_reset_requests":
        return <Key className="h-5 w-5" />
      default:
        return <Database className="h-5 w-5" />
    }
  }

  const resetDeleteForm = () => {
    setSelectedTable("")
    setDeleteBy("Province_Id")
    setDeleteValue("")
    setDeleteResult(null)
  }

  useEffect(() => {
    fetchTableData()
  }, [])

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-blue-600 mb-2">Stage Data Status</h1>
          <p className="text-gray-600">Monitor data in each table and manage records by province or user.</p>
        </div>
        <Button onClick={fetchTableData} disabled={loading} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh Data
        </Button>
      </div>

      {/* Table Data Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {tableData.map((table) => (
          <Card key={table.tableName} className={table.status === "error" ? "border-red-200" : "border-gray-200"}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-sm font-medium">
                {getTableIcon(table.tableName)}
                <span className="ml-2 capitalize">{table.tableName.replace("_", " ")}</span>
                {table.status === "error" ? (
                  <XCircle className="h-4 w-4 ml-auto text-red-500" />
                ) : (
                  <CheckCircle className="h-4 w-4 ml-auto text-green-500" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {table.status === "error" ? (
                <div className="text-red-600 text-sm">
                  <p>Error loading data</p>
                  <p className="text-xs mt-1">{table.error}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-blue-600">{table.recordCount.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Total Records</div>

                  {/* Additional details for upload_records */}
                  {table.tableName === "upload_records" && table.uniqueUsers !== undefined && (
                    <div className="space-y-1 text-xs text-gray-500 border-t pt-2">
                      <div>Users: {table.uniqueUsers}</div>
                      <div>Tables: {table.uniqueTables}</div>
                      <div>Size: {formatBytes(table.totalSizeBytes || 0)}</div>
                      {table.latestUpload && <div>Latest: {new Date(table.latestUpload).toLocaleDateString()}</div>}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Data Management Section */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center text-orange-800">
            <Trash2 className="h-5 w-5 mr-2" />
            Data Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Warning:</strong> Data deletion is permanent and cannot be undone. Use with extreme caution.
              </AlertDescription>
            </Alert>

            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <DialogTrigger asChild>
                <Button variant="destructive" className="bg-red-600 hover:bg-red-700">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Data by Province Id or Uploaded By
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center text-red-600">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    Delete Database Records
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      This action will permanently delete records and cannot be undone.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <Label htmlFor="table-select">Select Table</Label>
                    <Select value={selectedTable} onValueChange={setSelectedTable}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose table to delete from" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Building">Building</SelectItem>
                        <SelectItem value="users">Users</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="delete-by">Delete By</Label>
                    <Select value={deleteBy} onValueChange={(value: "Province_Id" | "uploadedBy") => setDeleteBy(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Province_Id">Province Id</SelectItem>
                        <SelectItem value="uploadedBy">Exact Username</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="delete-value">{deleteBy === "Province_Id" ? "Province ID" : "Username"}</Label>
                    <Input
                      id="delete-value"
                      placeholder={deleteBy === "Province_Id" ? "e.g., punjab, sindh" : "e.g., user123"}
                      value={deleteValue}
                      onChange={(e) => setDeleteValue(e.target.value)}
                      disabled={deleteLoading}
                    />
                    <p className="text-xs text-gray-600">
                      {deleteBy === "Province_Id"
                        ? "Will delete all records containing this text in username"
                        : "Will delete all records with this exact username"}
                    </p>
                  </div>

                  {deleteResult && (
                    <Alert
                      className={
                        deleteResult.startsWith("✅") ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                      }
                    >
                      <AlertDescription>{deleteResult}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex justify-between pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        resetDeleteForm()
                        setShowDeleteDialog(false)
                      }}
                      disabled={deleteLoading}
                    >
                      Cancel
                    </Button>
                    <div className="space-x-2">
                      <Button type="button" variant="outline" onClick={resetDeleteForm} disabled={deleteLoading}>
                        Clear
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={deleteLoading || !selectedTable || !deleteValue}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {deleteLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            Deleting...
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Records
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
