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

interface LastResetInfo {
  actor: string
  reset_all: boolean
  tables: string
  total_deleted: number
  created_at: string
}

export default function DatabaseDataStatus() {
  const [tableData, setTableData] = useState<TableData[]>([])
  const [loading, setLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [resetAll, setResetAll] = useState(true)
  const [selectedTables, setSelectedTables] = useState<string[]>([])
  const [deleteResult, setDeleteResult] = useState<string | null>(null)
  const [confirmText, setConfirmText] = useState("")
  const [lastReset, setLastReset] = useState<LastResetInfo | null>(null)

  const fetchTableData = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/database-data-status")
      const data = await response.json()
      setTableData(data.tableData || [])
      setLastReset(data.lastReset || null)
    } catch (error) {
      console.error("Error fetching table data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async () => {
    setDeleteLoading(true)
    setDeleteResult(null)
    try {
      const params = new URLSearchParams()
      if (resetAll) {
        params.set("resetAll", "true")
      } else if (selectedTables.length > 0) {
        params.set("tables", selectedTables.join(","))
      } else {
        setDeleteResult("❌ Select at least one table or choose Reset All")
        setDeleteLoading(false)
        return
      }
      // Derive actor from stored credentials (pie-portal-credentials) fallback to unknown
      let actor = "unknown"
      try {
        if (typeof window !== "undefined") {
          const credsRaw = window.localStorage.getItem("pie-portal-credentials")
          if (credsRaw) {
            const creds = JSON.parse(credsRaw)
            if (creds && typeof creds.username === 'string' && creds.username.trim()) {
              actor = creds.username.trim()
            }
          }
        }
      } catch (e) {
        // silent fail
      }
      const response = await fetch(`/api/database-data-status?${params.toString()}`, {
        method: "DELETE",
        headers: { "x-actor": actor },
      })
      const result = await response.json()
      if (response.ok) {
        setDeleteResult(`✅ ${result.message}`)
        await fetchTableData()
      } else {
        setDeleteResult(`❌ Error: ${result.error}`)
      }
    } catch (e) {
      setDeleteResult(`❌ Error: ${e instanceof Error ? e.message : "Unknown error"}`)
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
    setResetAll(true)
    setSelectedTables([])
    setDeleteResult(null)
    setConfirmText("")
  }

  useEffect(() => {
    fetchTableData()
  }, [])

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
            <h1 className="text-2xl font-bold text-blue-600 mb-2">Stage Data Status</h1>
            <p className="text-gray-600">Review staged table counts, audit the last reset, and perform a secure full or selective data reset.</p>
            {lastReset && (
              <div className="text-xs text-gray-500 flex flex-wrap items-center gap-2">
                <span className="font-semibold text-gray-600">Last Reset:</span>
                <span className="text-gray-700">{new Date(lastReset.created_at).toLocaleString()}</span>
                <span className="text-gray-400">|</span>
                <span className="text-gray-600">By:</span>
                <span className="text-blue-600 font-medium">{lastReset.actor || "unknown"}</span>
                <span className="text-gray-400">|</span>
                <span className="text-gray-600">Mode:</span>
                <span className="text-gray-700">{lastReset.reset_all ? "All Tables" : "Selected"}</span>
                {!lastReset.reset_all && lastReset.tables && (
                  <span className="truncate max-w-[300px] text-gray-500" title={lastReset.tables}>
                    ({lastReset.tables.split(',').slice(0, 5).join(',')}{
                      lastReset.tables.split(',').length > 5 ? '…' : ''
                    })
                  </span>
                )}
                <span className="text-gray-400">|</span>
                <span className="text-gray-600">Rows Deleted:</span>
                <span className="text-gray-700">{lastReset.total_deleted}</span>
              </div>
            )}
        </div>
        <div className="flex flex-col items-stretch md:items-end gap-2">
          <div className="flex items-center gap-2">
            <Button onClick={fetchTableData} disabled={loading} variant="outline">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh Data
            </Button>
            {/* Reset Stage Database */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <DialogTrigger asChild>
                <Button variant="destructive" className="bg-red-600 hover:bg-red-700">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Reset Stage Database
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
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="font-semibold">Reset Mode</Label>
                      <div className="flex gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => setResetAll(true)}
                          className={`px-2 py-1 rounded border ${resetAll ? "bg-red-600 text-white border-red-600" : "border-gray-300"}`}
                        >
                          All Tables
                        </button>
                        <button
                          type="button"
                          onClick={() => setResetAll(false)}
                          className={`px-2 py-1 rounded border ${!resetAll ? "bg-blue-600 text-white border-blue-600" : "border-gray-300"}`}
                        >
                          Select Tables
                        </button>
                      </div>
                    </div>
                    {!resetAll && (
                      <div className="space-y-2">
                        <Label>Select Tables to Empty</Label>
                        <div className="max-h-48 overflow-auto border rounded p-2 space-y-1 text-sm">
                          {[
                            "Institutions",
                            "Building",
                            "Corporal_Punishment",
                            "ECE_Facilities",
                            "EnrolAgeWise",
                            "Enrolment_Difficulty",
                            "Enrolment_ECEExperience",
                            "Enrolment_Refugee",
                            "Enrolment_Religion",
                            "Facilities",
                            "ICT_Facilities",
                            "Institutions_Otherfacilities",
                            "Institution_Attack",
                            "Institution_Security",
                            "Non_Teachers_Profile",
                            "Repeaters",
                            "Rooms",
                            "Sanctioned_Teaching_Non_Teaching",
                            "Student_Profile",
                            "Teachers_AcademicQualification",
                            "Teachers_ProfessionalQualification",
                            "Teachers_Profile",
                            "TeachingNonTeaching_Category",
                            "TeachingNonTeaching_Designation",
                          ].map((t) => {
                            const selected = selectedTables.includes(t)
                            return (
                              <button
                                type="button"
                                key={t}
                                onClick={() =>
                                  setSelectedTables((prev) =>
                                    prev.includes(t) ? prev.filter((p) => p !== t) : [...prev, t]
                                  )
                                }
                                className={`w-full text-left px-2 py-1 rounded border text-xs ${
                                  selected ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 hover:bg-gray-50"
                                }`}
                              >
                                {t}
                              </button>
                            )
                          })}
                        </div>
                        <p className="text-xs text-gray-600">Selected: {selectedTables.length}</p>
                      </div>
                    )}
                    <div className="space-y-2 pt-2">
                      <Label htmlFor="confirm-reset" className="text-red-700">Type RESET to confirm</Label>
                      <Input
                        id="confirm-reset"
                        placeholder="RESET"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        className="uppercase"
                        disabled={deleteLoading}
                        autoComplete="off"
                      />
                      <p className="text-[11px] text-gray-500">
                        This safeguard prevents accidental mass deletion. Button enables only when you type RESET exactly.
                      </p>
                    </div>
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
                        onClick={handleReset}
                        disabled={
                          deleteLoading ||
                          (!resetAll && selectedTables.length === 0) ||
                          confirmText.trim().toUpperCase() !== "RESET"
                        }
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
                            {resetAll ? "Reset All" : "Delete Selected"}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <p className="text-xs text-red-600 leading-snug max-w-xs text-right">
            Reset Stage Database removes all data from every listed table (or the selected tables). This cannot be
            undone.
          </p>
        </div>
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
      {/* Data Management card removed since reset functionality moved to header */}
    </div>
  )
}
