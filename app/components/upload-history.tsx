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
}

interface UploadHistoryProps {
  username: string
}

export default function UploadHistory({ username }: UploadHistoryProps) {
  const [uploadHistory, setUploadHistory] = useState<UploadRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRecord, setSelectedRecord] = useState<UploadRecord | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)

  useEffect(() => {
    fetchUploadHistory()
  }, [username])

  const fetchUploadHistory = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/upload-history?username=${encodeURIComponent(username)}`)

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

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Total Uploads</CardTitle>
            <Database className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{uploadHistory.length}</div>
            <p className="text-xs text-blue-700 mt-1">All time uploads</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Successful</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">
              {uploadHistory.filter((record) => record.status.toLowerCase() === "success").length}
            </div>
            <p className="text-xs text-green-700 mt-1">Successfully processed</p>
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
          {uploadHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Table Name</TableHead>
                    <TableHead>Filename</TableHead>
                    <TableHead>Upload Date</TableHead>
                    <TableHead>File Size</TableHead>
                    <TableHead>Records</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>JSON Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {uploadHistory.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.tableName}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 mr-2 text-gray-500" />
                          {record.filename}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                          {new Date(record.uploadDate).toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>{formatFileSize(record.fileSizeBytes)}</TableCell>
                      <TableCell>{record.recordCount?.toLocaleString() || "N/A"}</TableCell>
                      <TableCell>{record.censusYear}</TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
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
                  <label className="text-sm font-medium text-gray-700">Filename</label>
                  <p className="text-sm text-gray-900 mt-1">{selectedRecord.filename}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Upload Date</label>
                  <p className="text-sm text-gray-900 mt-1">{new Date(selectedRecord.uploadDate).toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">File Size</label>
                  <p className="text-sm text-gray-900 mt-1">{formatFileSize(selectedRecord.fileSizeBytes)}</p>
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
                  <pre className="mt-1 p-3 bg-gray-50 border border-gray-200 rounded-md overflow-x-auto text-xs text-gray-800 max-h-64">
                    {(() => {
                      try {
                        return JSON.stringify(JSON.parse(selectedRecord.json_data!), null, 2)
                      } catch {
                        return selectedRecord.json_data
                      }
                    })()}
                  </pre>
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
}
