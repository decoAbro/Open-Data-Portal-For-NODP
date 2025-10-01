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
  let pool: sql.ConnectionPool | null = null

  try {
    const { censusYear, deadline, message, adminUser } = await request.json()

    if (!censusYear || !deadline || !message) {
      return new NextResponse("Missing required fields", { status: 400 })
    }

    pool = await sql.connect(dbConfig)

    // Create census_years table if it doesn't exist
    const createTableQuery = `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='census_years' AND xtype='U')
      CREATE TABLE census_years (
        id INT IDENTITY(1,1) PRIMARY KEY,
        census_year NVARCHAR(10) NOT NULL,
        upload_deadline DATETIME2 NOT NULL,
        notification_message NVARCHAR(MAX) NOT NULL,
        created_by NVARCHAR(50) NOT NULL,
        created_date DATETIME2 DEFAULT GETDATE(),
        status NVARCHAR(20) DEFAULT 'active',
        is_current BIT DEFAULT 0
      )
    `

    await pool.request().query(createTableQuery)

    // Set all previous years as not current
    const updatePreviousQuery = `
      UPDATE census_years SET is_current = 0
    `
    await pool.request().query(updatePreviousQuery)

    // Insert new census year record
    const insertQuery = `
      INSERT INTO census_years (
        census_year, upload_deadline, notification_message, created_by, is_current
      )
      VALUES (
        @censusYear, @deadline, @message, @adminUser, 1
      )
    `

    await pool
      .request()
      .input("censusYear", sql.NVarChar, censusYear)
      .input("deadline", sql.DateTime2, new Date(deadline))
      .input("message", sql.NVarChar, message)
      .input("adminUser", sql.NVarChar, adminUser || "admin")
      .query(insertQuery)

    console.log(`Census year ${censusYear} stored successfully`)

    return new NextResponse("Census year stored successfully", { status: 200 })
  } catch (error) {
    console.error("Database error:", error)
    return new NextResponse(`Database error: ${error instanceof Error ? error.message : "Unknown error"}`, {
      status: 500,
    })
  } finally {
    if (pool) {
      await pool.close()
    }
  }
}

export async function GET() {
  let pool: sql.ConnectionPool | null = null

  try {
    pool = await sql.connect(dbConfig)

    const query = `
      SELECT 
        id, census_year, upload_deadline, notification_message, 
        created_by, created_date, status, is_current
      FROM census_years 
      ORDER BY created_date DESC
    `

    const result = await pool.request().query(query)

    return NextResponse.json(result.recordset)
  } catch (error) {
    console.error("Database error:", error)
    return new NextResponse(`Database error: ${error instanceof Error ? error.message : "Unknown error"}`, {
      status: 500,
    })
  } finally {
    if (pool) {
      await pool.close()
    }
  }
}
