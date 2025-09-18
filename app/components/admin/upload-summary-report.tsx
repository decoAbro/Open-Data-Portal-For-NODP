"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Clock, FileText, CheckCircle, XCircle, AlertCircle, Eye, Database, Calendar, HardDrive } from "lucide-react"

interface UploadRecord {
  id: number
  username: string
  tableName: string
  filename: string
  fileSizeBytes: number
  recordCount: number
  uploadDate: string
  censusYear: string
  status: string
  errorMessage?: string
  json_data?: string | null
  pdf_file?: string | null
}


interface UploadHistoryProps {
  username: string
}

export default function UploadHistory({ username }: UploadHistoryProps) {
  const [uploadHistory, setUploadHistory] = useState<UploadRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRecord, setSelectedRecord] = useState<UploadRecord | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [uploadedByFilter, setUploadedByFilter] = useState<string>("")
  const [tableNameFilter, setTableNameFilter] = useState<string>("")
  const [yearFilter, setYearFilter] = useState<string>("")

  useEffect(() => {
    fetchUploadHistory()
  }, [username])

  const fetchUploadHistory = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/upload-history-admin?username=${encodeURIComponent(username)}`)

      if (response.ok) {
        const data = await response.json()
        setUploadHistory(data.uploadHistory || [])
      } else {
        console.error("Failed to fetch upload history")
      }
    } catch (error) {
      console.error("Error fetching upload history:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes >= 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
    } else if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
    } else if (bytes >= 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`
    }
    return `${bytes} B`
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "success":
        return (
          <Badge className="bg-green-100 text-green-800 border-0">
            <CheckCircle className="h-3 w-3 mr-1" />
            Success
          </Badge>
        )
      case "failed":
        return (
          <Badge className="bg-red-100 text-red-800 border-0">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        )
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-0">
            <AlertCircle className="h-3 w-3 mr-1" />
            {status}
          </Badge>
        )
    }
  }

  const handleViewDetails = (record: UploadRecord) => {
    setSelectedRecord(record)
    setShowDetailsDialog(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }


  // Get unique usernames, table names, and years for filter dropdowns
  const uniqueUsernames = Array.from(new Set(uploadHistory.map((r) => r.username))).sort()
  const uniqueTableNames = Array.from(new Set(uploadHistory.map((r) => r.tableName))).sort()
  const uniqueYears = Array.from(new Set(uploadHistory.map((r) => r.censusYear))).filter(Boolean).sort()

  // Filtered upload history
  const filteredUploadHistory = uploadHistory.filter((r) => {
    const byUser = uploadedByFilter ? r.username === uploadedByFilter : true
    const byTable = tableNameFilter ? r.tableName === tableNameFilter : true
    const byYear = yearFilter ? r.censusYear === yearFilter : true
    return byUser && byTable && byYear
  })

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-4 mb-2">
        <div>
          <label htmlFor="uploadedByFilter" className="text-sm font-medium text-gray-700 mr-2">Uploaded By:</label>
          <select
            id="uploadedByFilter"
            className="border rounded px-2 py-1 text-sm"
            value={uploadedByFilter}
            onChange={e => setUploadedByFilter(e.target.value)}
          >
            <option value="">All</option>
            {uniqueUsernames.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="tableNameFilter" className="text-sm font-medium text-gray-700 mr-2">Table Name:</label>
          <select
            id="tableNameFilter"
            className="border rounded px-2 py-1 text-sm"
            value={tableNameFilter}
            onChange={e => setTableNameFilter(e.target.value)}
          >
            <option value="">All</option>
            {uniqueTableNames.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="yearFilter" className="text-sm font-medium text-gray-700 mr-2">Year:</label>
          <select
            id="yearFilter"
            className="border rounded px-2 py-1 text-sm"
            value={yearFilter}
            onChange={e => setYearFilter(e.target.value)}
          >
            <option value="">All</option>
            {uniqueYears.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>
      {/* Summary Cards */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Total Uploads</CardTitle>
            <Database className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{filteredUploadHistory.length}</div>
            <p className="text-xs text-blue-700 mt-1">All time uploads</p>
          </CardContent>
        </Card>
      </div>

      {/* Upload History Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Upload History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredUploadHistory.length > 0 ? (
            <div className="overflow-x-auto" style={{ minWidth: '1200px', width: '100%' }}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Table Name</TableHead>
                    <TableHead>Uploaded By</TableHead>
                    <TableHead>Upload Date</TableHead>
                    <TableHead>Records</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Download Data Summary</TableHead>
                    <TableHead>View Data Summary</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUploadHistory.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.tableName}</TableCell>
                       <TableCell className="font-medium">{record.username}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                          {new Date(record.uploadDate).toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>{record.recordCount?.toLocaleString() || "N/A"}</TableCell>
                      <TableCell>{record.censusYear}</TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                      <TableCell>
                        {record.pdf_file ? (
                          <Button size="sm" variant="outline"
                            onClick={async () => {
                              try {
                                const res = await fetch(record.pdf_file as string);
                                if (!res.ok) throw new Error('Failed to download PDF');
                                const blob = await res.blob();
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = (record.filename || 'file') + '.pdf';
                                document.body.appendChild(a);
                                a.click();
                                a.remove();
                                window.URL.revokeObjectURL(url);
                              } catch (e) {
                                alert('Could not download PDF');
                              }
                            }}
                          >
                            Download Summary
                          </Button>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => handleViewDetails(record)}>
                          View Summary
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Database className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No upload history found</p>
              <p className="text-xs mt-1">Upload data will appear here after you submit files</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Eye className="h-5 w-5 mr-2" />
              Upload Details
            </DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Table Name</label>
                  <p className="text-sm text-gray-900 mt-1">{selectedRecord.tableName}</p>
                </div>
                 <div>
                   <label className="text-sm font-medium text-gray-700">User Name</label>
                   <p className="text-sm text-gray-900 mt-1">{selectedRecord.username}</p>
                 </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Upload Date</label>
                  <p className="text-sm text-gray-900 mt-1">{new Date(selectedRecord.uploadDate).toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Record Count</label>
                  <p className="text-sm text-gray-900 mt-1">{selectedRecord.recordCount?.toLocaleString() || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Census Year</label>
                  <p className="text-sm text-gray-900 mt-1">{selectedRecord.censusYear}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedRecord.status)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">PDF File</label>
                  <div className="mt-1">
                    {selectedRecord.pdf_file ? (
                      <Button size="sm" variant="outline"
                        onClick={async () => {
                          try {
                            const res = await fetch(selectedRecord.pdf_file!);
                            if (!res.ok) throw new Error('Failed to download PDF');
                            const blob = await res.blob();
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = (selectedRecord.filename || 'file') + '.pdf';
                            document.body.appendChild(a);
                            a.click();
                            a.remove();
                            window.URL.revokeObjectURL(url);
                          } catch (e) {
                            alert('Could not download PDF');
                          }
                        }}
                      >
                        Download PDF
                      </Button>
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </div>
                </div>
              </div>

              {selectedRecord.errorMessage && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Error Message</label>
                  <div className="mt-1 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-800">{selectedRecord.errorMessage}</p>
                  </div>
                </div>
              )}

              {selectedRecord?.json_data && (
                <div>
                  <label className="text-sm font-medium text-gray-700">JSON Data</label>
                  <div className="mt-1 p-3 bg-gray-50 border border-gray-200 rounded-md max-h-64 overflow-auto w-full">
                    <pre className="text-xs text-gray-800 font-mono whitespace-pre-wrap break-all">
                      {(() => {
                        try {
                          return JSON.stringify(JSON.parse(selectedRecord.json_data!), null, 2)
                        } catch {
                          return selectedRecord.json_data
                        }
                      })()}
                    </pre>
                  </div>
                </div>
              )}
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
  // ...existing code...
}
