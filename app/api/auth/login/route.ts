import { type NextRequest, NextResponse } from "next/server"
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
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ success: false, error: "Username and password are required" }, { status: 400 })
    }

    // Check if user exists and get their details (attempt to include role if column exists)
    let userQuery = "SELECT id, username, email, password, status, role FROM users WHERE username = @param1"
    const userResult = await executeQuery(userQuery, [username])

    // Fallback: try without role column if first attempt failed due to invalid column
    if (userResult.rowCount === 0) {
      // It's possible simply no user. We'll not fallback automatically unless an error happened earlier.
      // (We would have thrown on query error). Continue.
    }

    if (userResult.rowCount === 0) {
      return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 })
    }

    const user = userResult.rows[0]

    // Check if user is active
    if (user.status !== "active") {
      return NextResponse.json(
        { success: false, error: "Account is inactive. Please contact administrator." },
        { status: 403 },
      )
    }

    // In a real application, you should hash and compare passwords
    // For now, we'll do a simple comparison
    if (user.password !== password) {
      return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 })
    }

    // Update last_login timestamp
    const updateLoginQuery = "UPDATE users SET last_login = GETDATE() WHERE id = @param1"
    await executeQuery(updateLoginQuery, [user.id])

    return NextResponse.json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        status: user.status,
        role: user.role || 'user',
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Login failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
