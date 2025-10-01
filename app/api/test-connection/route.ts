import { NextResponse } from "next/server"
import sql from "mssql"

// SQL Server database configuration
const dbConfig = {
  server: "172.16.17.32",
  database: "Stage",
  user: "NODP",
  password: "Prod123",
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
    connectTimeout: 30000, // Increase connection timeout to 30 seconds
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
  // Try to connect with a specific port if needed
  // port: 1433, // Uncomment if you need to specify a different port
}

// Update the GET function with better error handling
export async function GET() {
  try {
    console.log("Attempting to connect to SQL Server at 172.16.17.32...")

    // Test database connection with timeout
    const pool = new sql.ConnectionPool(dbConfig)

    // Add a timeout for the connection attempt
    const connectionPromise = pool.connect()
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Connection timeout after 30 seconds")), 30000),
    )

    await Promise.race([connectionPromise, timeoutPromise])
    console.log("Connected to database successfully")

    // Test query to check if users table exists
    const request = pool.request()
    const result = await request.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'users'
    `)

    const tableExists = result.recordset.length > 0
    console.log("Table check complete. Users table exists:", tableExists)

    // If table exists, get user count
    let userCount = 0
    if (tableExists) {
      const countResult = await request.query("SELECT COUNT(*) as count FROM users")
      userCount = countResult.recordset[0].count
      console.log("User count:", userCount)
    }

    await pool.close()

    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      tableExists,
      userCount,
      database: "Stage",
    })
  } catch (error) {
    console.error("Database connection error:", error)

    // Provide more detailed error information
    let errorMessage = "Unknown error"
    let errorDetails = ""

    if (error instanceof Error) {
      errorMessage = error.message
      errorDetails = error.stack || ""
    }

    return NextResponse.json(
      {
        success: false,
        error: `Failed to connect to database: ${errorMessage}`,
        details: errorDetails,
        server: "192.168.1.28",
        database: "Stage",
      },
      { status: 500 },
    )
  }
}
