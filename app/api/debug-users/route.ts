import { NextResponse } from "next/server"
import sql from "mssql"

// SQL Server database configuration
const dbConfig = {
  server: "192.168.1.28",
  database: "Stage",
  user: "Stage",
  password: "Sapphire123",
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
    connectTimeout: 30000,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
}

export async function GET() {
  let pool: sql.ConnectionPool | null = null

  try {
    console.log("Debug: Connecting to database...")
    pool = new sql.ConnectionPool(dbConfig)
    await pool.connect()
    console.log("Debug: Connected successfully")

    const request = pool.request()

    // First, check what columns exist in the users table
    console.log("Debug: Checking table structure...")
    const tableCheck = await request.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'users'
      ORDER BY ORDINAL_POSITION
    `)
    console.log("Debug: Table structure:", tableCheck.recordset)

    // Get the count of users
    console.log("Debug: Getting user count...")
    const countResult = await request.query("SELECT COUNT(*) as total FROM users")
    console.log("Debug: User count:", countResult.recordset[0])

    // Get all users with only existing columns
    console.log("Debug: Fetching all users...")
    const usersResult = await request.query("SELECT * FROM users")
    console.log("Debug: Users data:", usersResult.recordset)

    return NextResponse.json({
      success: true,
      tableStructure: tableCheck.recordset,
      userCount: countResult.recordset[0].total,
      allUsers: usersResult.recordset,
      message: "Debug information retrieved successfully",
    })
  } catch (error) {
    console.error("Debug error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        details: error instanceof Error ? error.stack : "",
      },
      { status: 500 },
    )
  } finally {
    if (pool) {
      try {
        await pool.close()
      } catch (err) {
        console.error("Error closing pool:", err)
      }
    }
  }
}
