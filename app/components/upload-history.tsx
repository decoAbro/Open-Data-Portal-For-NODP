"use client"

import { useState } from "react"
import useSWR from "swr"
import { fetcher } from "@/utils/swr-fetcher"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Clock, FileText, CheckCircle, XCircle, AlertCircle, Eye, Database, Calendar, HardDrive } from "lucide-react"
import { PDFDocument } from 'pdf-lib';

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
  const [selectedRecord, setSelectedRecord] = useState<UploadRecord | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [yearFilter, setYearFilter] = useState<string>("")
  const [downloadingAll, setDownloadingAll] = useState(false)
  const [deleteDialogRecord, setDeleteDialogRecord] = useState<UploadRecord | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Use SWR for caching and background refresh
  const { data, isLoading, mutate } = useSWR(
    username ? `/api/upload-history?username=${encodeURIComponent(username)}` : null,
    fetcher,
    { refreshInterval: 60000 } // Optional: auto-refresh every 60s
  )
  const uploadHistory: UploadRecord[] = data?.uploadHistory || []

  // Remove fetchUploadHistory and useEffect (SWR handles fetching)

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
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-800 border-0">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        )
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800 border-0">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        )
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Get unique years for filter dropdown
  const uniqueYears = Array.from(new Set(uploadHistory.map((r) => r.censusYear))).filter(Boolean).sort()

  // Filtered upload history
  const filteredUploadHistory = yearFilter
    ? uploadHistory.filter((r) => r.censusYear === yearFilter)
    : uploadHistory

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-4 mb-2">
        <div>
              <label htmlFor="yearFilter" className="text-sm font-medium text-gray-700 mr-2">Census Year:</label>
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

      {/* Download All Summaries Button */}
      <div className="flex justify-end mb-2">
        <Button
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
          variant="default"
          disabled={downloadingAll}
          onClick={async () => {
            setDownloadingAll(true);
            const recordsToDownload = filteredUploadHistory.filter(r => r.pdf_file);
            if (recordsToDownload.length === 0) {
              alert('No summaries available to download.');
              setDownloadingAll(false);
              return;
            }
            try {
              // Fetch all PDFs as ArrayBuffers
              const pdfBuffers = await Promise.all(
                recordsToDownload.map(async (record) => {
                  const res = await fetch(record.pdf_file as string);
                  if (!res.ok) throw new Error('Failed to download PDF');
                  return await res.arrayBuffer();
                })
              );
              // Merge PDFs using pdf-lib
              const mergedPdf = await PDFDocument.create();
              for (const pdfBytes of pdfBuffers) {
                const pdf = await PDFDocument.load(pdfBytes);
                const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                copiedPages.forEach((page) => mergedPdf.addPage(page));
              }
              const mergedPdfBytes = await mergedPdf.save();
              // Download merged PDF
              const blob = new Blob([new Uint8Array(mergedPdfBytes)], { type: 'application/pdf' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'all-summaries.pdf';
              document.body.appendChild(a);
              a.click();
              a.remove();
              window.URL.revokeObjectURL(url);
            } catch (e) {
              alert('Could not merge and download PDFs.');
            } finally {
              setDownloadingAll(false);
            }
          }}
        >
          {downloadingAll ? (
            <span className="flex items-center">
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
              Downloading...
            </span>
          ) : (
            'Download All Summaries'
          )}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          {filteredUploadHistory.length > 0 ? (
            <div className="overflow-x-auto" style={{ minWidth: '1200px', width: '100%' }}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Table Name</TableHead>
                    <TableHead>Upload Date</TableHead>
                    <TableHead>Records</TableHead>
                    <TableHead>Census Year</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Download Data Summary</TableHead>
                    <TableHead>View Data Summary</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUploadHistory.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.tableName}</TableCell>
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
                      <TableCell>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={record.status.toLowerCase() !== "rejected"}
                          onClick={() => {
                            setDeleteError(null)
                            setDeleteDialogRecord(record)
                          }}
                        >
                          Delete
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
                {/* Filename removed as requested */}
                <div>
                  <label className="text-sm font-medium text-gray-700">Upload Date</label>
                  <p className="text-sm text-gray-900 mt-1">{new Date(selectedRecord.uploadDate).toLocaleString()}</p>
                </div>
                {/* File Size removed as requested */}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteDialogRecord} onOpenChange={(open) => { if (!open) { setDeleteDialogRecord(null); setDeleting(false); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Upload Record</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDialogRecord ? (
                <>
                  You are about to permanently delete the upload for table <span className="font-semibold">{deleteDialogRecord.tableName}</span>
                  {deleteDialogRecord.censusYear && <> (Census Year: {deleteDialogRecord.censusYear})</>}.
                  This action cannot be undone.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
              {deleteError}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              disabled={deleting}
              onClick={async () => {
                if (!deleteDialogRecord) return
                setDeleting(true)
                setDeleteError(null)
                try {
                  const res = await fetch(`/api/upload-history?id=${deleteDialogRecord.id}`, { method: 'DELETE' })
                  let data: any = null
                  try { data = await res.json() } catch {}
                  if (!res.ok) {
                    setDeleteError(data?.error || 'Failed to delete record')
                    setDeleting(false)
                    return
                  }
                  setDeleteDialogRecord(null)
                  setDeleting(false)
                  mutate()
                } catch (err) {
                  setDeleteError('Network error deleting record')
                  setDeleting(false)
                }
              }}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
