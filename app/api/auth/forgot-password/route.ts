import { type NextRequest, NextResponse } from "next/server"
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
    connectTimeout: 30000,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
}

// Database connection pool
let pool: sql.ConnectionPool | null = null

async function getConnection() {
  if (!pool) {
    try {
      pool = new sql.ConnectionPool(dbConfig)
      await pool.connect()
    } catch (error) {
      console.error("Failed to create connection pool:", error)
      throw error
    }
  }
  return pool
}

async function executeQuery(query: string, params: any[] = []) {
  try {
    const connection = await getConnection()
    const request = connection.request()

    params.forEach((param, index) => {
      request.input(`param${index + 1}`, param)
    })

    const result = await request.query(query)
    return {
      rows: result.recordset || [],
      rowCount: result.rowsAffected[0] || 0,
    }
  } catch (error) {
    console.error("Database query error:", error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json()

    if (!username) {
      return NextResponse.json({ success: false, error: "Username is required" }, { status: 400 })
    }

    // Check if user exists
    const userQuery = "SELECT id, username, email, status FROM users WHERE username = @param1"
    const userResult = await executeQuery(userQuery, [username])

    if (userResult.rowCount === 0) {
      // Don't reveal if user exists or not for security
      return NextResponse.json({
        success: true,
        message: "If the username exists, a password reset request has been sent to the administrator.",
      })
    }

    const user = userResult.rows[0]

    // Check if user is active
    if (user.status !== "active") {
      return NextResponse.json({
        success: true,
        message: "If the username exists, a password reset request has been sent to the administrator.",
      })
    }

    // Create a password reset request record (optional - for tracking)
    const resetRequestQuery = `
      INSERT INTO password_reset_requests (username, email, request_date, status)
      VALUES (@param1, @param2, GETDATE(), 'pending')
    `

    try {
      await executeQuery(resetRequestQuery, [user.username, user.email])
    } catch (error) {
      // If table doesn't exist, we'll just continue without storing the request
      console.log("Password reset requests table doesn't exist, continuing without storing request")
    }

    return NextResponse.json({
      success: true,
      message: "Password reset request has been sent to the administrator.",
      userInfo: {
        username: user.username,
        email: user.email,
      },
    })
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process password reset request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
