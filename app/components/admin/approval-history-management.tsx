"use client"

import { useState } from "react"
import usePersistentSWR from '@/hooks/usePersistentSWR'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Clock, FileText, CheckCircle, XCircle, AlertCircle, Eye, Database, Calendar, HardDrive, ArrowUpDown, ChevronUp, ChevronDown, Download } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { PDFDocument } from 'pdf-lib'

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
  // lightweight flags (detail deferred)
  hasPdf?: boolean
  hasJson?: boolean
  // populated only after detail fetch
  json_data?: string | null
  pdf_file?: string | null
}


interface UploadHistoryProps {
  username: string
}

export default function UploadHistory({ username }: UploadHistoryProps) {
  const { data, isLoading, mutate } = usePersistentSWR<{ uploadHistory: UploadRecord[] }>(
    username ? `/api/upload-history-admin?username=${encodeURIComponent(username)}` : null,
    (url: string) => fetch(url).then(r => r.json()),
    { ttl: 5 * 60 * 1000, refreshInterval: 60_000 }
  )
  const uploadHistory = data?.uploadHistory || []
  const [selectedRecord, setSelectedRecord] = useState<UploadRecord | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [uploadedByFilter, setUploadedByFilter] = useState<string>("")
  const [tableNameFilter, setTableNameFilter] = useState<string>("")
  const [yearFilter, setYearFilter] = useState<string>("")
  const [statusUpdating, setStatusUpdating] = useState(false)
  const [statusUpdateError, setStatusUpdateError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [downloadingAll, setDownloadingAll] = useState(false)
  const [inlineMessage, setInlineMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)
  // Multi-column sorting state: earlier items have higher precedence
  type SortKey = 'tableName' | 'uploadDate' | 'recordCount' | 'status'
  const [sortOrder, setSortOrder] = useState<{ key: SortKey; direction: 'asc' | 'desc' }[]>([])
  const pushMessage = (m: { type: 'success' | 'error' | 'info'; text: string }) => {
    setInlineMessage(m)
    setTimeout(() => {
      setInlineMessage(prev => (prev === m ? null : prev))
    }, 6000)
  }

  const handleUpdateStatus = async (recordId: number, newStatus: string) => {
    setStatusUpdating(true)
    setStatusUpdateError(null)
    try {
      const res = await fetch(`/api/upload-history-admin/update-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: recordId, status: newStatus })
      })
      if (!res.ok) throw new Error("Failed to update status")
      mutate(prev => {
        if (!prev) return prev
        return { ...prev, uploadHistory: prev.uploadHistory.map(r => r.id === recordId ? { ...r, status: newStatus } : r) }
      }, { revalidate: false })
      if (selectedRecord && selectedRecord.id === recordId) {
        setSelectedRecord({ ...selectedRecord, status: newStatus })
      }
      mutate() // background revalidate
      pushMessage({ type: 'success', text: `Status set to ${newStatus}.` })
    } catch (e: any) {
      setStatusUpdateError(e.message || 'Error updating status')
      pushMessage({ type: 'error', text: 'Status update failed.' })
    } finally {
      setStatusUpdating(false)
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

  const handleViewDetails = async (record: UploadRecord) => {
    setSelectedRecord(record)
    setShowDetailsDialog(true)
    // If heavy fields missing, fetch detail
    if (record.hasJson && record.json_data === undefined) {
      try {
        const res = await fetch(`/api/upload-history-admin/detail?id=${record.id}`)
        if (res.ok) {
          const data = await res.json()
            ;(record as any).json_data = data.record.json_data
            ;(record as any).pdf_file = data.record.pdf_file
          // force state update
          setSelectedRecord({ ...(record as any) })
        }
      } catch (e) {
        console.warn('Failed to load detail', e)
      }
    }
  }

  if (isLoading) {
    // Reduced skeleton row count for performance
    const skeletonRows = Array.from({ length: 5 })
    return (
      <div className="space-y-6">
        {/* Progressive reveal: show table skeleton immediately, summary cards shimmer separately */}
        {/* Filter Bar Skeleton (shimmer) */}
        <div className="flex flex-wrap items-center gap-4 mb-2">
          {[1,2,3,4].map(i => (
            <div key={i} className="flex flex-col gap-1">
              <Skeleton className="h-3 w-20 shimmer" />
              <Skeleton className="h-8 w-36 shimmer" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <Card key={i} className="h-full">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24 shimmer" />
                  <Skeleton className="h-4 w-4 rounded-full shimmer" />
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-7 w-16 mb-2 shimmer" />
                <Skeleton className="h-3 w-24 shimmer" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-400" />
              <span>Upload History</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table className="w-full mx-auto table-auto">
                <TableHeader>
                  <TableRow>
                    {['Table Name','Uploaded By','Upload Date','Records','Year','Status','Download Data Summary'].map(h => (
                      <TableHead key={h}>
                        <Skeleton className="h-4 w-28 shimmer" />
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {skeletonRows.map((_, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="text-center"><Skeleton className="h-4 w-40 shimmer mx-auto" /></TableCell>
                      <TableCell className="text-center"><Skeleton className="h-4 w-32 shimmer mx-auto" /></TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Skeleton className="h-4 w-4 rounded-full shimmer" />
                          <Skeleton className="h-4 w-44 shimmer" />
                        </div>
                      </TableCell>
                      <TableCell className="text-center"><Skeleton className="h-4 w-16 shimmer mx-auto" /></TableCell>
                      <TableCell className="text-center"><Skeleton className="h-4 w-12 shimmer mx-auto" /></TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Skeleton className="h-6 w-20 shimmer" />
                          <Skeleton className="h-6 w-14 shimmer" />
                          <Skeleton className="h-6 w-14 shimmer" />
                        </div>
                      </TableCell>
                      <TableCell className="text-center"><Skeleton className="h-6 w-32 shimmer mx-auto" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }


  // Dynamically filter dropdown options based on other filters
  const filterForDropdowns = (records: UploadRecord[]) => {
    return {
      usernames: Array.from(new Set(records.map((r) => r.username))).sort(),
      tableNames: Array.from(new Set(records.map((r) => r.tableName))).sort(),
      years: Array.from(new Set(records.map((r) => r.censusYear))).filter(Boolean).sort(),
      statuses: Array.from(new Set(records.map((r) => (r.status || "").toLowerCase()))).filter(Boolean).sort(),
    };
  };

  // For each filter, apply the other filters to get valid options
  const filteredForUsernames = uploadHistory.filter(r =>
    (tableNameFilter ? r.tableName === tableNameFilter : true) &&
    (yearFilter ? r.censusYear === yearFilter : true) &&
    (statusFilter ? (r.status || "").toLowerCase() === statusFilter : true)
  );
  const filteredForTableNames = uploadHistory.filter(r =>
    (uploadedByFilter ? r.username === uploadedByFilter : true) &&
    (yearFilter ? r.censusYear === yearFilter : true) &&
    (statusFilter ? (r.status || "").toLowerCase() === statusFilter : true)
  );
  const filteredForYears = uploadHistory.filter(r =>
    (uploadedByFilter ? r.username === uploadedByFilter : true) &&
    (tableNameFilter ? r.tableName === tableNameFilter : true) &&
    (statusFilter ? (r.status || "").toLowerCase() === statusFilter : true)
  );
  const filteredForStatuses = uploadHistory.filter(r =>
    (uploadedByFilter ? r.username === uploadedByFilter : true) &&
    (tableNameFilter ? r.tableName === tableNameFilter : true) &&
    (yearFilter ? r.censusYear === yearFilter : true)
  );

  const uniqueUsernames = filterForDropdowns(filteredForUsernames).usernames;
  const uniqueTableNames = filterForDropdowns(filteredForTableNames).tableNames;
  const uniqueYears = filterForDropdowns(filteredForYears).years;
  const uniqueStatuses = filterForDropdowns(filteredForStatuses).statuses;

  // Determine if any filters are active (for showing Clear Filters button)
  const filtersActive = !!(uploadedByFilter || tableNameFilter || yearFilter || statusFilter)

  // Filtered upload history
  const filteredUploadHistory = uploadHistory.filter((r) => {
    const byUser = uploadedByFilter ? r.username === uploadedByFilter : true
    const byTable = tableNameFilter ? r.tableName === tableNameFilter : true
    const byYear = yearFilter ? r.censusYear === yearFilter : true
    const byStatus = statusFilter ? (r.status || "").toLowerCase() === statusFilter : true
    return byUser && byTable && byYear && byStatus
  })

  // Apply multi-column sorting
  const sortedUploadHistory = sortOrder.length === 0 ? filteredUploadHistory : [...filteredUploadHistory].sort((a, b) => {
    for (const { key, direction } of sortOrder) {
      let av: any = a[key]
      let bv: any = b[key]
      // Normalize values
      if (key === 'uploadDate') {
        av = new Date(av).getTime() || 0
        bv = new Date(bv).getTime() || 0
      }
      if (key === 'status') {
        av = (av || '').toLowerCase()
        bv = (bv || '').toLowerCase()
      }
      if (av === bv) continue
      const cmp = av > bv ? 1 : -1
      return direction === 'asc' ? cmp : -cmp
    }
    return 0
  })

  const cycleDirection = (current?: 'asc' | 'desc'): 'asc' | 'desc' | null => {
    if (!current) return 'asc'
    if (current === 'asc') return 'desc'
    return null // remove
  }

  const toggleSort = (key: SortKey, additive: boolean) => {
    setSortOrder(prev => {
      let existing = prev.find(s => s.key === key)
      const nextDir = cycleDirection(existing?.direction)
      let next: { key: SortKey; direction: 'asc' | 'desc' }[]
      if (!additive) {
        // Replace entire ordering
        if (!nextDir) return [] // cleared
        return [{ key, direction: nextDir }]
      }
      // Additive (Shift-click): modify within array
      if (!existing) {
        if (!nextDir) return prev // nothing to add
        return [...prev, { key, direction: nextDir }]
      }
      // Existing present
      if (!nextDir) {
        return prev.filter(s => s.key !== key) // remove
      }
      return prev.map(s => (s.key === key ? { ...s, direction: nextDir } : s))
    })
  }

  const getSortMeta = (key: SortKey) => sortOrder.find(s => s.key === key)

  // Status counts for summary cards
  const approvedCount = filteredUploadHistory.filter(r => r.status?.toLowerCase() === "approved").length;
  const rejectedCount = filteredUploadHistory.filter(r => r.status?.toLowerCase() === "rejected").length;
  const inReviewCount = filteredUploadHistory.filter(r => r.status?.toLowerCase() === "in-review").length;

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
        {/* Status Pills */}
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-700">Status:</span>
          <div className="flex flex-wrap gap-1">
            {[
              { label: 'All', value: '' },
              { label: 'In-Review', value: 'in-review' },
              { label: 'Approved', value: 'approved' },
              { label: 'Rejected', value: 'rejected' }
            ].map(pill => {
              const active = statusFilter === pill.value
              return (
                <button
                  key={pill.label}
                  type="button"
                  onClick={() => setStatusFilter(pill.value)}
                  className={
                    'text-xs px-3 py-1 rounded-full border transition-colors ' +
                    (active
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50')
                  }
                  aria-pressed={active}
                >
                  {pill.label}
                </button>
              )
            })}
          </div>
        </div>
        {filtersActive && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="ml-auto"
            onClick={() => {
              setUploadedByFilter('')
              setTableNameFilter('')
              setYearFilter('')
              setStatusFilter('')
            }}
            title="Clear all active filters"
          >
            Clear Filters
          </Button>
        )}
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
            const recordsToDownload = filteredUploadHistory.filter(r => r.hasPdf);
            if (recordsToDownload.length === 0) {
              pushMessage({ type: 'info', text: 'No summaries available to download.' })
              setDownloadingAll(false);
              return;
            }
            try {
              const pdfBuffers = [] as ArrayBuffer[]
              for (const record of recordsToDownload) {
                if (!record.pdf_file) {
                  try {
                    const resDetail = await fetch(`/api/upload-history-admin/detail?id=${record.id}`)
                    if (resDetail.ok) {
                      const d = await resDetail.json()
                      ;(record as any).pdf_file = d.record.pdf_file
                    }
                  } catch {}
                }
                if (!record.pdf_file) continue
                const res = await fetch(record.pdf_file as string)
                if (!res.ok) continue
                pdfBuffers.push(await res.arrayBuffer())
              }
              if (pdfBuffers.length === 0) throw new Error('No PDFs collected')
              const mergedPdf = await PDFDocument.create();
              for (const pdfBytes of pdfBuffers) {
                const pdf = await PDFDocument.load(pdfBytes);
                const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                copiedPages.forEach((page) => mergedPdf.addPage(page));
              }
              const mergedPdfBytes = await mergedPdf.save();
              const blob = new Blob([new Uint8Array(mergedPdfBytes)], { type: 'application/pdf' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'all-summaries.pdf';
              document.body.appendChild(a);
              a.click();
              a.remove();
              window.URL.revokeObjectURL(url);
              pushMessage({ type: 'success', text: 'Merged PDF downloaded.' })
            } catch (e) {
              pushMessage({ type: 'error', text: 'Could not merge and download PDFs.' })
            } finally {
              setDownloadingAll(false)
            }
          }}
        >
          {downloadingAll ? (
            <span className="flex items-center">
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
              Downloading...
            </span>
          ) : (
            <span className="flex items-center">
              <Download className="h-4 w-4 mr-1" />
              Download All Summaries
            </span>
          )}
        </Button>
      </div>
      {/* Status Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <CardTitle className="text-sm font-medium text-green-800">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{approvedCount}</div>
            <p className="text-xs text-green-700 mt-1">Approved uploads</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-800">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">{rejectedCount}</div>
            <p className="text-xs text-red-700 mt-1">Rejected uploads</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-800">In-Review</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-900">{inReviewCount}</div>
            <p className="text-xs text-yellow-700 mt-1">In-Review uploads</p>
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
          {sortOrder.length > 0 && (
            <div className="mb-3 text-xs text-gray-500 flex flex-wrap items-center gap-2">
              <span className="font-medium">Sorting:</span>
              {sortOrder.map((s, idx) => (
                <span key={s.key} className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-1">
                  <span className="font-mono text-gray-700">{s.key}</span>
                  <span className="text-gray-500">{s.direction}</span>
                  <button
                    onClick={() => toggleSort(s.key, true)}
                    className="text-gray-400 hover:text-gray-600"
                    title="Cycle direction / remove"
                  >
                    {s.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>
                  {idx < sortOrder.length - 1 && <span className="text-gray-300">→</span>}
                </span>
              ))}
              <button
                onClick={() => setSortOrder([])}
                className="ml-2 text-blue-600 hover:underline"
              >Clear</button>
              <span className="ml-auto italic text-gray-400">Tip: Shift+Click to multi-sort</span>
            </div>
          )}
          {filteredUploadHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <Table className="w-full mx-auto table-auto">
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="cursor-pointer select-none text-center"
                      onClick={(e) => toggleSort('tableName', e.shiftKey)}
                      aria-sort={getSortMeta('tableName') ? (getSortMeta('tableName')!.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                      title="Sort by table name"
                    >
                      <span className="inline-flex items-center gap-1">
                        Table Name
                        {getSortMeta('tableName') ? (
                          getSortMeta('tableName')!.direction === 'asc' ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3 w-3 text-gray-300" />
                        )}
                      </span>
                    </TableHead>
                    <TableHead className="text-center">Uploaded By</TableHead>
                    <TableHead
                      className="cursor-pointer select-none text-center"
                      onClick={(e) => toggleSort('uploadDate', e.shiftKey)}
                      aria-sort={getSortMeta('uploadDate') ? (getSortMeta('uploadDate')!.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                      title="Sort by upload date"
                    >
                      <span className="inline-flex items-center gap-1">
                        Upload Date
                        {getSortMeta('uploadDate') ? (
                          getSortMeta('uploadDate')!.direction === 'asc' ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3 w-3 text-gray-300" />
                        )}
                      </span>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none text-center"
                      onClick={(e) => toggleSort('recordCount', e.shiftKey)}
                      aria-sort={getSortMeta('recordCount') ? (getSortMeta('recordCount')!.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                      title="Sort by record count"
                    >
                      <span className="inline-flex items-center gap-1">
                        Records
                        {getSortMeta('recordCount') ? (
                          getSortMeta('recordCount')!.direction === 'asc' ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3 w-3 text-gray-300" />
                        )}
                      </span>
                    </TableHead>
                    <TableHead className="text-center">Year</TableHead>
                    <TableHead
                      className="cursor-pointer select-none text-center"
                      onClick={(e) => toggleSort('status', e.shiftKey)}
                      aria-sort={getSortMeta('status') ? (getSortMeta('status')!.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                      title="Sort by status"
                    >
                      <span className="inline-flex items-center gap-1">
                        Status
                        {getSortMeta('status') ? (
                          getSortMeta('status')!.direction === 'asc' ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3 w-3 text-gray-300" />
                        )}
                      </span>
                    </TableHead>
                    <TableHead className="text-center">Download Data Summary</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedUploadHistory.map((record) => (
                    <TableRow
                      key={record.id}
                      onClick={() => handleViewDetails(record)}
                      className="cursor-pointer hover:bg-gray-50 transition-colors"
                      title="Click to view details"
                    >
                      <TableCell className="font-medium text-center">{record.tableName}</TableCell>
                      <TableCell className="font-medium text-center">{record.username}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center">
                          <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                          {new Date(record.uploadDate).toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{record.recordCount?.toLocaleString() || "N/A"}</TableCell>
                      <TableCell className="text-center">{record.censusYear}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                          {getStatusBadge(record.status)}
                          {record.status?.toLowerCase() === 'in-review' && (
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 px-2 text-green-700 border-green-300 hover:bg-green-50 leading-none"
                                disabled={statusUpdating}
                                onClick={() => handleUpdateStatus(record.id, 'Approved')}
                                title="Approve this upload"
                              >
                                {statusUpdating ? (
                                  <span className="animate-spin h-3 w-3 border-b-2 border-green-600 rounded-full" />
                                ) : (
                                  'Approve'
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 px-2 text-red-700 border-red-300 hover:bg-red-50 leading-none"
                                disabled={statusUpdating}
                                onClick={() => handleUpdateStatus(record.id, 'Rejected')}
                                title="Reject this upload"
                              >
                                {statusUpdating ? (
                                  <span className="animate-spin h-3 w-3 border-b-2 border-red-600 rounded-full" />
                                ) : (
                                  'Reject'
                                )}
                              </Button>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {record.hasPdf ? (
                          <Button
                            size="sm"
                            variant="default"
                            className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                            title="Download summary PDF"
                            onClick={async (e) => {
                              e.stopPropagation()
                              try {
                                // ensure pdf link present (fetch detail if not yet)
                                if (!record.pdf_file) {
                                  const resDetail = await fetch(`/api/upload-history-admin/detail?id=${record.id}`)
                                  if (resDetail.ok) {
                                    const d = await resDetail.json()
                                    ;(record as any).pdf_file = d.record.pdf_file
                                  }
                                }
                                if (!record.pdf_file) throw new Error('No PDF link')
                                const res = await fetch(record.pdf_file as string)
                                if (!res.ok) throw new Error('Failed to download PDF')
                                const blob = await res.blob()
                                const url = window.URL.createObjectURL(blob)
                                const a = document.createElement('a')
                                a.href = url
                                a.download = (record.filename || 'file') + '.pdf'
                                document.body.appendChild(a)
                                a.click()
                                a.remove()
                                window.URL.revokeObjectURL(url)
                              } catch (e) {
                                alert('Could not download PDF')
                              }
                            }}
                          >
                            <span className="flex items-center">
                              <Download className="h-4 w-4 mr-1" />
                              Download Summary
                            </span>
                          </Button>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
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

      {/* Inline Message Banner */}
      {inlineMessage && (
        <div
          className={
            'rounded-md border px-4 py-3 text-sm flex items-start gap-2 ' +
            (inlineMessage.type === 'error'
              ? 'border-red-200 bg-red-50 text-red-800'
              : inlineMessage.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-800'
              : 'border-blue-200 bg-blue-50 text-blue-800')
          }
        >
          {inlineMessage.type === 'error' && <AlertCircle className="h-4 w-4 mt-0.5" />}
          {inlineMessage.type === 'success' && <CheckCircle className="h-4 w-4 mt-0.5" />}
          {inlineMessage.type === 'info' && <Clock className="h-4 w-4 mt-0.5" />}
          <span>{inlineMessage.text}</span>
          <button
            onClick={() => setInlineMessage(null)}
            className="ml-auto text-xs underline decoration-dotted hover:opacity-80"
          >Dismiss</button>
        </div>
      )}

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
                  <p className="text-sm text-gray-900 mt-1">{selectedRecord.recordCount?.toLocaleString() || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Census Year</label>
                  <p className="text-sm text-gray-900 mt-1">{selectedRecord.censusYear}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <div className="mt-1 flex items-center gap-2">
                    {getStatusBadge(selectedRecord.status)}
                    {selectedRecord.status.toLowerCase() === 'in-review' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={statusUpdating}
                          onClick={() => handleUpdateStatus(selectedRecord.id, 'Approved')}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={statusUpdating}
                          onClick={() => handleUpdateStatus(selectedRecord.id, 'Rejected')}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                  {statusUpdateError && <div className="text-xs text-red-600 mt-1">{statusUpdateError}</div>}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">PDF File</label>
                  <div className="mt-1">
                    {selectedRecord.hasPdf ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          try {
                            if (!selectedRecord.pdf_file) {
                              const resDetail = await fetch(`/api/upload-history-admin/detail?id=${selectedRecord.id}`)
                              if (resDetail.ok) {
                                const d = await resDetail.json()
                                setSelectedRecord(prev => prev ? { ...prev, pdf_file: d.record.pdf_file, json_data: prev.json_data ?? d.record.json_data } : prev)
                              }
                            }
                            if (!selectedRecord.pdf_file) throw new Error('No PDF link')
                            const res = await fetch(selectedRecord.pdf_file)
                            if (!res.ok) throw new Error('Failed to download PDF')
                            const blob = await res.blob()
                            const url = window.URL.createObjectURL(blob)
                            const a = document.createElement('a')
                            a.href = url
                            a.download = (selectedRecord.filename || 'file') + '.pdf'
                            document.body.appendChild(a)
                            a.click()
                            a.remove()
                            window.URL.revokeObjectURL(url)
                          } catch (e) {
                            alert('Could not download PDF')
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
