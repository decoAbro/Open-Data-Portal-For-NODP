import { type NextRequest, NextResponse } from "next/server"
import sql from "mssql"

// Database configuration - using the same config as other routes
const dbConfig = {
  user: "Stage",
  password: "Sapphire123",
  server: "192.168.1.28",
  database: "Stage",
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const username = searchParams.get("username")

  if (!username) {
    return NextResponse.json({ error: "Username is required" }, { status: 400 })
  }

  let pool: sql.ConnectionPool | null = null

  try {
    pool = await sql.connect(dbConfig)

    // Query upload_records table for the specific user
    const query = `
      SELECT 
        id,
        username,
        table_name,
        filename,
        file_size_bytes,
        record_count,
        upload_date,
        census_year,
        status,
        error_message
      FROM upload_records 
      WHERE username = @username
      ORDER BY upload_date DESC
    `

    const result = await pool.request().input("username", sql.NVarChar, username).query(query)

    // Format the data for the frontend
    const uploadHistory = result.recordset.map((record) => ({
      id: record.id,
      username: record.username,
      tableName: record.table_name,
      filename: record.filename,
      fileSizeBytes: record.file_size_bytes,
      recordCount: record.record_count,
      uploadDate: record.upload_date,
      censusYear: record.census_year,
      status: record.status,
      errorMessage: record.error_message,
    }))

    return NextResponse.json({ uploadHistory })
  } catch (error) {
    console.error("Error fetching upload history:", error)
    return NextResponse.json({ error: "Failed to fetch upload history" }, { status: 500 })
  } finally {
    if (pool) {
      await pool.close()
    }
  }
}
