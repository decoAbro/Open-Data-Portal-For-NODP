"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Upload, CheckCircle, FileJson, AlertCircle, BarChart3, Eye } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  getTablesList,
  getTableUploadsByUsername,
  addTableUploadRecord,
  getCurrentYear,
  getUploadWindowStatus,
  updateUserByUsername,
} from "../utils/storage"

interface TableUploadTrackerProps {
  username: string
  password: string
  hasUploadPermission: boolean
  hasUploaded: boolean
  uploadDeadline: string | null
}

interface InstitutionSummary {
  totalInstitutions: number
  byLevel: { [key: string]: number }
  byGender: { [key: string]: number }
  byLocation: { [key: string]: number }
  ByFunctionalStatus: { [key: string]: number }
  bySector: { [key: string]: number }
  bySchoolCommittee: { [key: string]: number }
  byMedium: { [key: string]: number }
  byShift: { [key: string]: number }
  byKind: { [key: string]: number }
}

export default function TableUploadTracker({
  username,
  password,
  hasUploadPermission,
  hasUploaded,
  uploadDeadline,
}: TableUploadTrackerProps) {
  const [uploadedTables, setUploadedTables] = useState<string[]>([])
  const [dataNotAvailableTables, setDataNotAvailableTables] = useState<string[]>([])
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [showNotification, setShowNotification] = useState(false)
  const [notificationContent, setNotificationContent] = useState<{
    title: string;
    message: React.ReactNode;
    type: 'success' | 'error' | 'info';
  } | null>(null)
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const [isClient, setIsClient] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [parsedJsonData, setParsedJsonData] = useState<any>(null)
  const [institutionSummary, setInstitutionSummary] = useState<InstitutionSummary | null>(null)

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

  useEffect(() => {
    if (!isClient || !currentYear) return

    const loadData = async () => {
      // Load uploaded tables for this user
      const userUploads = getTableUploadsByUsername(username)
      const uploadedTableNames = userUploads
        .filter((upload) => upload.year === currentYear)
        .map((upload) => upload.tableName)
      setUploadedTables(uploadedTableNames)

      // Load data not available tables for this user
      const dataNotAvailableRecords = JSON.parse(localStorage.getItem("pie-portal-data-not-available") || "[]")
      const userDataNotAvailable = dataNotAvailableRecords
        .filter((record: any) => record.username === username && record.year === currentYear)
        .map((record: any) => record.tableName)
      setDataNotAvailableTables(userDataNotAvailable)

      // Check upload window status from server
      const windowStatus = await getUploadWindowStatus();
      if (windowStatus.year && windowStatus.year !== currentYear) {
        // Year has changed, update local state
        setCurrentYear(windowStatus.year);
      }
      
      // Update permissions based on window status
      if (!windowStatus.isOpen) {
        updateUserByUsername(username, { uploadPermission: false, uploadDeadline: undefined });
      } else {
        updateUserByUsername(username, { 
          uploadPermission: true, 
          uploadDeadline: windowStatus.deadline || undefined 
        });
      }
    }

    loadData();

    // Set up polling to check upload window status
    const intervalId = setInterval(loadData, 30000); // Check every 30 seconds

    return () => clearInterval(intervalId);
  }, [isClient, username, currentYear])

  // Calculate progress (uploaded + data not available = completed)
  const completedTables = uploadedTables.length + dataNotAvailableTables.length
  const progress = tables.length > 0 ? (completedTables / tables.length) * 100 : 0

  // Analyze Institution data for preview
  const analyzeInstitutionData = (data: any[]): InstitutionSummary => {
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

    // Functional Status ID mappings
    const StatusMappings: { [key: string]: string } = {
      "0": "Not Reported",
      "1": "Functional",
      "2": "Non-Functional",
      "3": "Closed",
      "4": "Merged",
      "5": "Shifted",
      "6": "Denationalized",
      "7": "Consolidated",
    }

    // Sector ID mappings
    const SectorMappings: { [key: string]: string } = {
      "0": "Not Reported",
      "1": "Public",
      "2": "Other Public",
      "3": "Private",
    }

    // School Committee ID mappings
    const committeeMappings: { [key: string]: string } = {
      "0": "Not Reported",
      "1": "Yes (PTA/PTC/SMC etc.)",
      "2": "No",
    }

    // Medium ID mappings
    const mediumMappings: { [key: string]: string } = {
      "0": "Not Reported",
      "1": "Urdu",
      "2": "English",
      "3": "Arabic",
      "4": "Sindhi",
      "5": "Pushto",
      "6": "Punjabi",
      "7": "Balochi",
      "8": "Others",
      "9": "Urdu and English",
    }

    // Shift ID mappings
    const ShiftMappings: { [key: string]: string } = {
      "0": "Not Reported",
      "1": "Morning",
      "2": "Evening",
      "3": "Both",
    }

    // Kind ID mappings
    const kindMappings: { [key: string]: string } = {
      "0": "Not Reported",
      "1": "EMIS",
      "2": "Private",
      "3": "Colleges",
      "4": "Technical and Vocation Education (TVET)",
      "5": "Higher Education",
      "6": "Deeni Madaris",
      "7": "Education Foundation",
      "8": "Non-Formal Education",
      "9": "Special Education",
      "10": "Teacher Training",
      "11": "Other Public",
      "12": "Distance Learning",
    }

    const summary: InstitutionSummary = {
      totalInstitutions: data.length,
      byLevel: {},
      byGender: {},
      byLocation: {},
      ByFunctionalStatus: {},
      bySector: {},
      bySchoolCommittee: {},
      byMedium: {},
      byShift: {},
      byKind: {}
    }

    data.forEach((institution) => {
      // Count by Level_Id with proper mapping
      const levelId = String(institution.level_Id || institution.Level_Id || "Unknown")
      const levelLabel = levelMappings[levelId] || `Unknown Level Id (${levelId})`
      summary.byLevel[levelLabel] = (summary.byLevel[levelLabel] || 0) + 1

      // Count by Gender_Id with proper mapping
      const genderId = String(institution.gender_Id || institution.Gender_Id || "Unknown")
      const genderLabel = genderMappings[genderId] || `Unknown Gender Id (${genderId})`
      summary.byGender[genderLabel] = (summary.byGender[genderLabel] || 0) + 1

      // Count by Location_Id with proper mapping
      const locationId = String(institution.location_Id || institution.Location_Id || "Unknown")
      const locationLabel = locationMappings[locationId] || `Unknown Location Id (${locationId})`
      summary.byLocation[locationLabel] = (summary.byLocation[locationLabel] || 0) + 1

      // Count by Status_Id with proper mapping
      const FunctionalStatus_Id = String(institution.FunctionalStatus_Id || institution.FunctionalStatus_Id || "Unknown")
      const statusLabel = StatusMappings[FunctionalStatus_Id] || `Unknown Functional Status Id (${FunctionalStatus_Id})`
      summary.ByFunctionalStatus[statusLabel] = (summary.ByFunctionalStatus[statusLabel] || 0) + 1

      // Count by Sector_Id with proper mapping
      const sectorId = String(institution.sector_Id || institution.Sector_Id || "Unknown")
      const sectorLabel = SectorMappings[sectorId] || `Unknown Sector Id (${sectorId})`
      summary.bySector[sectorLabel] = (summary.bySector[sectorLabel] || 0) + 1

      // Count by SchoolCommittee_Id with proper mapping
      const committeeId = String(institution.schoolCommittee_Id || institution.SchoolCommittee_Id || "Unknown")
      const committeeLabel = committeeMappings[committeeId] || `Unknown School Committee Id (${committeeId})`
      summary.bySchoolCommittee[committeeLabel] = (summary.bySchoolCommittee[committeeLabel] || 0) + 1

      // Count by Medium_Id with proper mapping
      const mediumId = String(institution.medium_Id || institution.Medium_Id || "Unknown")
      const mediumLabel = mediumMappings[mediumId] || `Unknown Medium Id (${mediumId})`
      summary.byMedium[mediumLabel] = (summary.byMedium[mediumLabel] || 0) + 1

      // Count by Shift_Id with proper mapping
      const shiftId = String(institution.shift_Id || institution.Shift_Id || "Unknown")
      const shiftLabel = ShiftMappings[shiftId] || `Unknown Shift Id (${shiftId})`
      summary.byShift[shiftLabel] = (summary.byShift[shiftLabel] || 0) + 1

      // Count by Kind_Id with proper mapping
      const kindId = String(institution.kind_Id || institution.Kind_Id || "Unknown")
      const kindLabel = kindMappings[kindId] || `Unknown Kind Id (${kindId})`
      summary.byKind[kindLabel] = (summary.byKind[kindLabel] || 0) + 1
    })

    return summary
  }

  // Handle file selection and validation
  const handleFileSelection = async (tableName: string, file: File) => {
    setUploadError("")

    try {
      // Check upload permissions first
      if (!hasUploadPermission) {
        throw new Error(
          "You don't have permission to upload data. Please wait for the administrator to open an upload window.",
        )
      }

      if (hasUploaded) {
        throw new Error("You have already uploaded data for this window.")
      }

      // Check if deadline has passed
      if (uploadDeadline) {
        const deadline = new Date(uploadDeadline)
        const now = new Date()
        if (now > deadline) {
          throw new Error("Upload deadline has passed. The upload window is now closed.")
        }
      }

      // Validate file type
      if (!file.name.endsWith(".json")) {
        throw new Error("Please select a JSON file")
      }

      // Validate file size (10MB limit)
      if (file.size > 100 * 1024 * 1024) {
        throw new Error("File size must be less than 10MB")
      }

      // Read and parse JSON
      const fileContent = await file.text()
      let jsonData

      try {
        jsonData = JSON.parse(fileContent)
      } catch (error) {
        throw new Error("Invalid JSON file format")
      }

      // Validate that JSON contains the expected table
      if (!jsonData[tableName]) {
        throw new Error(`JSON file must contain data for table "${tableName}"`)
      }

      // Validate that data is an array
      if (!Array.isArray(jsonData[tableName])) {
        throw new Error(`Data for table "${tableName}" must be an array`)
      }

      const recordCount = jsonData[tableName].length

      if (recordCount === 0) {
        throw new Error(`Table "${tableName}" cannot be empty`)
      }

      // Store file and parsed data for preview
      setSelectedFile(file)
      setParsedJsonData(jsonData)

      // If it's Institution table, analyze the data
      if (tableName === "Institutions") {
        const summary = analyzeInstitutionData(jsonData[tableName])
        setInstitutionSummary(summary)
      }

      // Close upload dialog and show preview dialog
      setShowUploadDialog(false)
      setShowPreviewDialog(true)
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed")
    }
  }

  // Handle confirmed upload
  const handleConfirmedUpload = async () => {
    if (!selectedFile || !parsedJsonData || !selectedTable) return

    setUploading(true)
    setUploadError("")

    try {
      // Simulate API call to upload data
      const response = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonData: parsedJsonData,
          username,
          password,
          tableName: selectedTable,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || "Upload failed")
      }

      // Get the API response message
      const responseText = await response.text();
      
      // Store the complete response without any filtering
      const formattedMessage = responseText;
      
      // Record successful upload
      addTableUploadRecord({
        username,
        tableName: selectedTable,
        filename: selectedFile.name,
        uploadDate: new Date().toISOString(),
        fileSize: `${Math.round(selectedFile.size / 1024)} KB`,
        year: currentYear,
        status: "success",
        recordCount: parsedJsonData[selectedTable].length,
        message: formattedMessage
      })

      // Update local state
      setUploadedTables((prev) => [...prev, selectedTable])
      
      // Show toast notification with a slight delay to ensure state is updated
      // Store the complete API response, just split into lines for readability
      const cleanedApiResponse = responseText
        .split('.')
        .map(sentence => sentence.trim())
        .filter(sentence => sentence.length > 0)
        .join('.\n');

      // Show notification with formatted response
      setNotificationContent({
        title: "Upload Successful",
        message: (
          <div className="mt-2 space-y-3">
            <div className="pb-2">
              <p className="text-sm text-gray-700 whitespace-pre-line bg-gray-50 p-3 rounded-md border border-gray-200">
                {responseText}
              </p>
            </div>
          </div>
        ),
        type: 'success'
      });
      setShowNotification(true);
      


      // Close dialogs and reset state
      setShowPreviewDialog(false)
      setSelectedTable(null)
      setSelectedFile(null)
      setParsedJsonData(null)
      setInstitutionSummary(null)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Upload failed";
      setUploadError(errorMessage);
      
      // Show error toast for critical errors
      setNotificationContent({
        title: "Upload Error",
        message: (
          <p className="text-sm text-red-600">
            {errorMessage}
          </p>
        ),
        type: 'error'
      });
      setShowNotification(true);
    } finally {
      setUploading(false)
    }
  }

  // Handle upload rejection
  const handleUploadRejection = () => {
    setShowPreviewDialog(false)
    setShowUploadDialog(true)
    setSelectedFile(null)
    setParsedJsonData(null)
    setInstitutionSummary(null)
    setUploadError("")
  }

  // Handle data not available notification
  const handleDataNotAvailable = (tableName: string) => {
    // Record that this user doesn't have data for this table
    const dataNotAvailableRecord = {
      id: Date.now(),
      username,
      tableName,
      year: currentYear,
      timestamp: new Date().toISOString(),
      status: "data_not_available",
    }

    // Store in data not available records
    const existingRecords = JSON.parse(localStorage.getItem("pie-portal-data-not-available") || "[]")

    // Remove any existing record for this user/table/year combination
    const filteredRecords = existingRecords.filter(
      (record: any) => !(record.username === username && record.tableName === tableName && record.year === currentYear),
    )

    // Add the new record
    filteredRecords.push(dataNotAvailableRecord)
    localStorage.setItem("pie-portal-data-not-available", JSON.stringify(filteredRecords))

    // Send notification to admin
    const notification = {
      id: Date.now() + 1, // Different ID from the record
      username,
      tableName,
      message: `User ${username} reports that data is not available for table: ${tableName} (Census Year: ${currentYear})`,
      timestamp: new Date().toISOString(),
      type: "data_not_available",
      read: false,
      year: currentYear // Add the year to the notification
    }

    const existingNotifications = JSON.parse(localStorage.getItem("pie-portal-notifications") || "[]")
    existingNotifications.push(notification)
    localStorage.setItem("pie-portal-notifications", JSON.stringify(existingNotifications))

    // Update local state
    setDataNotAvailableTables((prev) => [...prev, tableName])

    // Show success message to user
    setNotificationContent({
      title: "Notification Sent",
      message: (
        <p className="text-sm">
          Admin has been notified that data is not available for <strong>{tableName}</strong>.
        </p>
      ),
      type: 'info'
    });
    setShowNotification(true);
  }

  // Download sample file
  const downloadSample = (tableName: string) => {
    // Create sample data structure
    const sampleData = {
      [tableName]: [
        {
          id: 1,
          census_year: Number.parseInt(currentYear),
          // Add more sample fields based on table type
          ...(tableName === "Institutions" && {
            Inst_Id: "INST001",
            institution_name: "Sample School",
            level_Id: 1,
            gender_Id: 1,
            location_Id: 1,
            district: "Sample District",
            tehsil: "Sample Tehsil",
          }),
          ...(tableName === "Teachers Profile" && {
            teacher_name: "Sample Teacher",
            qualification: "Masters",
            experience_years: 5,
          }),
          // Add more table-specific sample fields as needed
        },
      ],
    }

    const blob = new Blob([JSON.stringify(sampleData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${tableName.toLowerCase().replace(/\s+/g, "-")}-sample.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (!isClient) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="bg-blue-50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-blue-700">Table Upload Progress - Year {currentYear}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium">
                Overall Progress: {completedTables} of {tables.length} tables completed
                <span className="text-xs text-gray-500 ml-2">
                  ({uploadedTables.length} uploaded, {dataNotAvailableTables.length} data not available)
                </span>
              </div>
              <div className="text-sm font-medium">{Math.round(progress)}%</div>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {progress === 100 && (
            <Alert className="mb-6 bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Congratulations! You have completed all {tables.length} tables ({uploadedTables.length} uploaded,{" "}
                {dataNotAvailableTables.length} marked as data not available).
              </AlertDescription>
            </Alert>
          )}

          {!hasUploadPermission && (
            <Alert className="mb-6 border-amber-200 bg-amber-50">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                Upload window is currently closed. Please wait for the administrator to open an upload window before you
                can upload data.
              </AlertDescription>
            </Alert>
          )}

          {hasUploaded && (
            <Alert className="mb-6 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                You have already uploaded data for this window. If you need to make changes, please contact the
                administrator.
              </AlertDescription>
            </Alert>
          )}

          <div className="rounded-md border">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Table Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tables.map((tableName, index) => {
                  const isUploaded = uploadedTables.includes(tableName)
                  const isDataNotAvailable = dataNotAvailableTables.includes(tableName)

                  return (
                    <tr
                      key={tableName}
                      className={isUploaded ? "bg-green-50" : isDataNotAvailable ? "bg-orange-50" : ""}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{tableName}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isUploaded ? (
                          <Badge className="bg-green-100 text-green-800 border-0">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Uploaded
                          </Badge>
                        ) : isDataNotAvailable ? (
                          <Badge className="bg-orange-100 text-orange-800 border-0">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Data Not Available
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center space-x-2">
                          <Dialog
                            open={showUploadDialog && selectedTable === tableName}
                            onOpenChange={(open) => {
                              if (!open) {
                                setShowUploadDialog(false)
                                setSelectedTable(null)
                                setUploadError("")
                              }
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                className="text-xs h-8"
                                disabled={isUploaded || isDataNotAvailable || !hasUploadPermission || hasUploaded}
                                onClick={() => {
                                  setSelectedTable(tableName)
                                  setShowUploadDialog(true)
                                  setUploadError("")
                                }}
                              >
                                <Upload className="h-3 w-3 mr-1" />
                                {isUploaded ? "Uploaded" : "Upload"}
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Upload {tableName} Data</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                {uploadError && (
                                  <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{uploadError}</AlertDescription>
                                  </Alert>
                                )}

                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                  <FileJson className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                                  <p className="text-sm text-gray-600 mb-2">Select your JSON file for {tableName}</p>
                                  <input
                                    type="file"
                                    accept=".json"
                                    className="hidden"
                                    id={`file-upload-list-${tableName}`}
                                    onChange={(e) => {
                                      if (e.target.files && e.target.files[0]) {
                                        handleFileSelection(tableName, e.target.files[0])
                                      }
                                    }}
                                    disabled={uploading}
                                  />
                                  <label htmlFor={`file-upload-list-${tableName}`}>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="mx-auto bg-transparent"
                                      disabled={uploading}
                                      asChild
                                    >
                                      <span>{uploading ? "Processing..." : "Select File"}</span>
                                    </Button>
                                  </label>
                                </div>

                                <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-800">
                                  <p className="font-medium mb-1">Requirements:</p>
                                  <ul className="list-disc list-inside space-y-1">
                                    <li>File must be in JSON format</li>
                                    <li>Maximum file size: 10MB</li>
                                    <li>Must contain data for "{tableName}" table</li>
                                    <li>Data must include census_year: {currentYear}</li>
                                    <li>
                                      <Button
                                        variant="link"
                                        size="sm"
                                        className="h-auto p-0 text-blue-600"
                                        onClick={() => downloadSample(tableName)}
                                      >
                                        Download sample file
                                      </Button>
                                    </li>
                                  </ul>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>

                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-8 text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
                            disabled={isUploaded || isDataNotAvailable || !hasUploadPermission}
                            onClick={() => handleDataNotAvailable(tableName)}
                          >
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Data Not Available
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Data Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Eye className="h-5 w-5 mr-2" />
              Data Preview - {selectedTable}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {uploadError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{uploadError}</AlertDescription>
              </Alert>
            )}

            {selectedFile && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">File Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700 font-medium">Filename:</span>
                    <span className="ml-2 text-blue-800">{selectedFile.name}</span>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">File Size:</span>
                    <span className="ml-2 text-blue-800">{Math.round(selectedFile.size / 1024)} KB</span>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Table:</span>
                    <span className="ml-2 text-blue-800">{selectedTable}</span>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Total Records:</span>
                    <span className="ml-2 text-blue-800">
                      {parsedJsonData && selectedTable ? parsedJsonData[selectedTable].length : 0}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Institution-specific summary */}
            {selectedTable === "Institutions" && institutionSummary && (
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
                      <div className="space-y-2">
                        {Object.entries(institutionSummary.byLevel)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([levelId, count]) => (
                          <div key={levelId} className="flex justify-between text-sm">
                            <span className={`${levelId.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{levelId}:</span>
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
                        {Object.entries(institutionSummary.byGender)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([genderId, count]) => (
                          <div key={genderId} className="flex justify-between text-sm">
                            <span className={`${genderId.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{genderId}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
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
                        {Object.entries(institutionSummary.byLocation)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([locationId, count]) => (
                          <div key={locationId} className="flex justify-between text-sm">
                            <span className={`${locationId.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{locationId}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* By Status */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Functional Status</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(institutionSummary.ByFunctionalStatus)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([ByFunctionalStatus, count]) => (
                          <div key={ByFunctionalStatus} className="flex justify-between text-sm">
                            <span className={`${ByFunctionalStatus.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{ByFunctionalStatus}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* By Sector */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Sector</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(institutionSummary.bySector)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([sector, count]) => (
                          <div key={sector} className="flex justify-between text-sm">
                            <span className={`${sector.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{sector}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* By School Committee */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By School Committee</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(institutionSummary.bySchoolCommittee)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([committee, count]) => (
                          <div key={committee} className="flex justify-between text-sm">
                            <span className={`${committee.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{committee}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* By Medium */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Medium</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(institutionSummary.byMedium)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([medium, count]) => (
                          <div key={medium} className="flex justify-between text-sm">
                            <span className={`${medium.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{medium}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* By Shift */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Shift</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(institutionSummary.byShift)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([shift, count]) => (
                          <div key={shift} className="flex justify-between text-sm">
                            <span className={`${shift.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{shift}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* By Kind */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Kind</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(institutionSummary.byKind)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([kind, count]) => (
                          <div key={kind} className="flex justify-between text-sm">
                            <span className={`${kind.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{kind}:</span>
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
                    Total of <strong>{institutionSummary.totalInstitutions}</strong> institutions will be uploaded. The
                    data includes {Object.keys(institutionSummary.byLevel).length} different education levels,
                    {Object.keys(institutionSummary.byGender).length} gender categories,
                    {Object.keys(institutionSummary.byLocation).length} different location types,
                    {Object.keys(institutionSummary.ByFunctionalStatus).length} functional status types,
                    {Object.keys(institutionSummary.bySector).length} different sectors,
                    {Object.keys(institutionSummary.bySchoolCommittee).length} school committee statuses,
                    {Object.keys(institutionSummary.byMedium).length} different mediums of instruction,
                    {Object.keys(institutionSummary.byShift).length} shift types,
                    and {Object.keys(institutionSummary.byKind).length} kinds of institutions.
                  </p>
                </div>
              </div>
            )}

            {/* Generic summary for other tables */}
            {selectedTable !== "Institutions" && parsedJsonData && selectedTable && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Data Summary</h3>
                <p className="text-sm text-gray-700">
                  Ready to upload <strong>{parsedJsonData[selectedTable].length}</strong> records for {selectedTable}{" "}
                  table.
                </p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button variant="outline" onClick={handleUploadRejection} disabled={uploading}>
                Cancel & Select Different File
              </Button>
              <Button onClick={handleConfirmedUpload} disabled={uploading} className="bg-green-600 hover:bg-green-700">
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirm & Upload Data
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Notification Dialog */}
      <AlertDialog open={showNotification} onOpenChange={setShowNotification}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className={
              notificationContent?.type === 'success' ? 'text-green-600' :
              notificationContent?.type === 'error' ? 'text-red-600' :
              'text-blue-600'
            }>
              {notificationContent?.title}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              {notificationContent?.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowNotification(false)}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
