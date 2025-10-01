import { type NextRequest, NextResponse } from "next/server"
import sql from "mssql"

// Database configuration - using the same config as your working routes
const dbConfig = {
  user: "NODP",
  password: "Prod123",
  server: "172.16.17.32",
  database: "Stage",
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
}

export async function POST(request: NextRequest) {
  try {
  const { jsonData, username, password, tableName, pdfBase64 } = await request.json()

    // Validate credentials (in a real app, this would check against a database)
    if (!username || !password) {
      return new NextResponse("Unauthorized: Missing credentials", { status: 401 })
    }

    // Validate JSON data
    if (!jsonData) {
      return new NextResponse("Bad Request: Missing JSON data", { status: 400 })
    }

    // If tableName is provided, validate that the JSON has that table
    if (tableName && !jsonData[tableName]) {
      return new NextResponse(`Bad Request: JSON data does not contain the table "${tableName}"`, { status: 400 })
    }

    console.log("Sending data to external API:", {
      endpoint: "http://172.16.17.32:5000/upload_data",
      username,
      tableName: tableName || "bulk_upload",
      dataSize: JSON.stringify(jsonData).length,
    })

    // Store upload record in localStorage first (for immediate UI update)
    const uploadRecord = {
      id: Date.now(),
      username: username || "unknown",
      filename: tableName ? `${tableName}.json` : "bulk_upload.json",
      uploadDate: new Date().toISOString(),
      fileSize: `${Math.round(JSON.stringify(jsonData).length / 1024)} KB`,
      year: new Date().getFullYear().toString(),
      status: "pending" as const,
      message: "Upload in progress...",
    }

    // Add to localStorage immediately
    if (typeof window !== "undefined") {
      const existingHistory = JSON.parse(localStorage.getItem("pie-portal-upload-history") || "[]")
      localStorage.setItem("pie-portal-upload-history", JSON.stringify([uploadRecord, ...existingHistory]))
    }

    // Send data to the external API endpoint
    const externalApiResponse = await fetch("http://172.16.17.101:5000/upload_data", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Add basic auth if required by the external API
        Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`,
      },
      body: JSON.stringify(jsonData),
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(1000000), // 30 second timeout
    })

    console.log("External API response status:", externalApiResponse.status)

    if (!externalApiResponse.ok) {
      const errorText = await externalApiResponse.text()
      console.error("External API error:", errorText)

      // Update localStorage with failed status
      if (typeof window !== "undefined") {
        const existingHistory = JSON.parse(localStorage.getItem("pie-portal-upload-history") || "[]")
        const updatedHistory = existingHistory.map((record: any) =>
          record.id === uploadRecord.id ? { ...record, status: "failed", message: errorText } : record,
        )
        localStorage.setItem("pie-portal-upload-history", JSON.stringify(updatedHistory))
      }

      // Store failed upload record in database
        await storeUploadRecord({
          username: username || "unknown",
          filename: tableName ? `${tableName}.json` : "bulk_upload.json",
          fileSize: JSON.stringify(jsonData).length,
          tableName: tableName || "bulk_upload",
          recordCount: tableName ? jsonData[tableName].length : Object.keys(jsonData).length,
          status: "failed",
          errorMessage: errorText,
          jsonData: JSON.stringify(jsonData),
          pdfBuffer: pdfBase64 ? Buffer.from(pdfBase64, 'base64') : null,
        })

      return new NextResponse(`External API Error (${externalApiResponse.status}): ${errorText}`, {
        status: externalApiResponse.status,
      })
    }

    // Get response from external API
    const externalApiResult = await externalApiResponse.text()
    console.log("External API success response:", externalApiResult)

    // Calculate record count for response
    const recordCount = tableName ? jsonData[tableName].length : Object.keys(jsonData).length
    const externalMessage = externalApiResult.trim();
    const message = externalMessage; // Just use the external API message

    // Update localStorage with success status
    if (typeof window !== "undefined") {
      const existingHistory = JSON.parse(localStorage.getItem("pie-portal-upload-history") || "[]")
      const updatedHistory = existingHistory.map((record: any) =>
        record.id === uploadRecord.id ? { ...record, status: "In-Review", message: message } : record,
      )
      localStorage.setItem("pie-portal-upload-history", JSON.stringify(updatedHistory))
    }

    // Store successful upload record in database
    await storeUploadRecord({
      username: username || "unknown",
      filename: tableName ? `${tableName}.json` : "bulk_upload.json",
      fileSize: JSON.stringify(jsonData).length,
      tableName: tableName || "bulk_upload",
      recordCount,
      status: "In-Review",
      errorMessage: null,
      jsonData: JSON.stringify(jsonData),
      pdfBuffer: pdfBase64 ? Buffer.from(pdfBase64, 'base64') : null,
    })

    return new NextResponse(message, { status: 200 })
  } catch (error) {
    console.error("Upload error:", error)

    // Store failed upload record in database
    await storeUploadRecord({
      username: "unknown",
      filename: "bulk_upload.json",
      fileSize: 0,
      tableName: "bulk_upload",
      recordCount: 0,
      status: "failed",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
      jsonData: null,
      pdfBuffer: null,
    })

    // Handle specific error types
    if (error instanceof TypeError && error.message.includes("fetch")) {
      return new NextResponse(
        "Network Error: Unable to connect to the data upload service. Please check if the service is running.",
        { status: 503 },
      )
    }

    if (error instanceof Error && error.name === "AbortError") {
      return new NextResponse("Timeout Error: The upload request timed out. Please try again.", { status: 408 })
    }

    return new NextResponse(`Server Error: ${error instanceof Error ? error.message : "Unknown error"}`, {
      status: 500,
    })
  }
}

// Function to store upload records in database
async function storeUploadRecord({
  username,
  filename,
  fileSize,
  tableName,
  recordCount,
  status,
  errorMessage,
  jsonData,
  pdfBuffer,
}: {
  username: string
  filename: string
  fileSize: number
  tableName: string
  recordCount: number
  status: "success" | "failed" | "In-Review" | "Rejected"
  errorMessage: string | null
  jsonData: string | null
  pdfBuffer: Buffer | null
}) {
  let pool: sql.ConnectionPool | null = null

  try {
    pool = await sql.connect(dbConfig)

    // Create upload_records table if it doesn't exist
    const createTableQuery = `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='upload_records' AND xtype='U')
      CREATE TABLE upload_records (
        id INT IDENTITY(1,1) PRIMARY KEY,
        username NVARCHAR(50) NOT NULL,
        filename NVARCHAR(255) NOT NULL,
        file_size_bytes BIGINT NOT NULL,
        table_name NVARCHAR(100) NOT NULL,
        record_count INT NOT NULL,
        upload_date DATETIME2 DEFAULT GETDATE(),
        status NVARCHAR(20) NOT NULL,
        error_message NVARCHAR(MAX) NULL,
        census_year NVARCHAR(10) NULL,
        json_data NVARCHAR(MAX) NULL,
        pdf_file VARBINARY(MAX) NULL
      )
    `

    await pool.request().query(createTableQuery)

    // Get current census year from the UploadWindow table since that's what's currently active
    const windowQuery = `
      SELECT TOP 1 year
      FROM UploadWindow
      WHERE isOpen = 1
      ORDER BY lastUpdated DESC
    `
    const windowResult = await pool.request().query(windowQuery)
    const currentCensusYear = windowResult.recordset[0]?.year

    // Insert upload record
    const insertQuery = `
      INSERT INTO upload_records (
        username, filename, file_size_bytes, table_name, record_count, 
        status, error_message, census_year, json_data, pdf_file
      )
      VALUES (
        @username, @filename, @fileSize, @tableName, @recordCount, 
        @status, @errorMessage, @censusYear, @jsonData, @pdfFile
      )
    `

    await pool
      .request()
      .input("username", sql.NVarChar, username)
      .input("filename", sql.NVarChar, filename)
      .input("fileSize", sql.BigInt, fileSize)
      .input("tableName", sql.NVarChar, tableName)
      .input("recordCount", sql.Int, recordCount)
      .input("status", sql.NVarChar, status)
      .input("errorMessage", sql.NVarChar, errorMessage)
      .input("censusYear", sql.NVarChar, currentCensusYear)
      .input("jsonData", sql.NVarChar, jsonData)
      .input("pdfFile", sql.VarBinary(sql.MAX), pdfBuffer)
      .query(insertQuery)

    if (!currentCensusYear) {
      console.error("No active upload window found. Census year could not be determined.")
      throw new Error("No active upload window found")
    }

    console.log(`Upload record stored for user: ${username}, status: ${status}`)
  } catch (dbError) {
    console.error("Error storing upload record:", dbError)
    // Don't throw error here to avoid breaking the main upload flow
  } finally {
    if (pool) {
      await pool.close()
    }
  }
}
