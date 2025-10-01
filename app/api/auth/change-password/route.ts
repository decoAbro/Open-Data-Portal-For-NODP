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
    const { username, currentPassword, newPassword } = await request.json()

    if (!username || !currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: "Username, current password, and new password are required" },
        { status: 400 },
      )
    }

    // Validate new password length
    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: "New password must be at least 6 characters long" },
        { status: 400 },
      )
    }

    // Check if current password is correct
    const userQuery = "SELECT id, username, password, status FROM users WHERE username = @param1"
    const userResult = await executeQuery(userQuery, [username])

    if (userResult.rowCount === 0) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    const user = userResult.rows[0]

    // Check if user is active
    if (user.status !== "active") {
      return NextResponse.json({ success: false, error: "Account is inactive" }, { status: 403 })
    }

    // Verify current password
    if (user.password !== currentPassword) {
      return NextResponse.json({ success: false, error: "Current password is incorrect" }, { status: 401 })
    }

    // Check if new password is different from current
    if (currentPassword === newPassword) {
      return NextResponse.json(
        { success: false, error: "New password must be different from current password" },
        { status: 400 },
      )
    }

    // Update password
    const updateQuery = "UPDATE users SET password = @param1, updated_at = GETDATE() WHERE id = @param2"
    const updateResult = await executeQuery(updateQuery, [newPassword, user.id])

    if (updateResult.rowCount === 0) {
      return NextResponse.json({ success: false, error: "Failed to update password" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Password updated successfully",
    })
  } catch (error) {
    console.error("Password change error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to change password",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
