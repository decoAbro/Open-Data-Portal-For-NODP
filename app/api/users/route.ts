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
      console.log("Creating new SQL Server connection pool...")
      pool = new sql.ConnectionPool(dbConfig)
      await pool.connect()
      console.log("Connection pool created successfully")
    } catch (error) {
      console.error("Failed to create connection pool:", error)
      throw error
    }
  }
  return pool
}

// Execute SQL query with better error handling
async function executeQuery(query: string, params: any[] = []) {
  try {
    console.log("Executing query:", query)
    console.log("With parameters:", params)

    const connection = await getConnection()
    const request = connection.request()

    // Add parameters to the request
    params.forEach((param, index) => {
      request.input(`param${index + 1}`, param)
    })

    const result = await request.query(query)
    console.log("Query result:", {
      rowCount: result.rowsAffected[0] || 0,
      recordCount: result.recordset?.length || 0,
    })

    return {
      rows: result.recordset || [],
      rowCount: result.rowsAffected[0] || 0,
    }
  } catch (error) {
    console.error("Database query error:", error)
    throw error
  }
}

// GET - Fetch all users (using only basic columns that should exist)
export async function GET() {
  try {
    console.log("GET /api/users - Starting to fetch users...")

    // Start with basic columns that are most likely to exist
    const query = `SELECT id, username, email, status, created_at, last_login FROM users ORDER BY id`
    console.log("Executing query:", query)

    const result = await executeQuery(query)
    console.log("Query executed successfully. Result:", result)

    // Transform the data to ensure proper format
    const users = result.rows.map((user: any) => ({
      id: user.id,
      username: user.username || "",
      email: user.email || "",
      status: user.status || "active",
      created_at: user.created_at,
      last_login: user.last_login || null,
    }))

    console.log("Transformed users:", users)

    return NextResponse.json({
      success: true,
      users: users,
      count: users.length,
    })
  } catch (error) {
    console.error("Error fetching users:", error)

    // If the query fails, try an even simpler one
    try {
      console.log("Trying fallback query with minimal columns...")
      const fallbackQuery = `SELECT * FROM users ORDER BY id`
      const fallbackResult = await executeQuery(fallbackQuery)

      const users = fallbackResult.rows.map((user: any) => ({
        id: user.id || 0,
        username: user.username || user.Username || "",
        email: user.email || user.Email || "",
        status: user.status || user.Status || "active",
        created_at: user.created_at || user.CreatedAt || user.created_date || new Date().toISOString(),
        last_login: user.last_login || user.LastLogin || null,
      }))

      return NextResponse.json({
        success: true,
        users: users,
        count: users.length,
        note: "Used fallback query with flexible column mapping",
      })
    } catch (fallbackError) {
      console.error("Fallback query also failed:", fallbackError)

      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch users",
          details: error instanceof Error ? error.message : "Unknown error",
          fallbackError: fallbackError instanceof Error ? fallbackError.message : "Unknown fallback error",
        },
        { status: 500 },
      )
    }
  }
}

// POST - Create new user (using only basic columns)
export async function POST(request: NextRequest) {
  try {
    const { username, email, password, status = "active" } = await request.json()

    if (!username || !email || !password) {
      return NextResponse.json({ success: false, error: "Username, email, and password are required" }, { status: 400 })
    }

    // Check if user already exists
    const checkQuery = "SELECT id FROM users WHERE username = @param1 OR email = @param2"
    const existingUser = await executeQuery(checkQuery, [username, email])

    if (existingUser.rowCount > 0) {
      return NextResponse.json(
        { success: false, error: "User with this username or email already exists" },
        { status: 409 },
      )
    }

    // Insert new user with basic columns
    const insertQuery = `
      INSERT INTO users (username, email, password, status, created_at) 
      OUTPUT INSERTED.id, INSERTED.username, INSERTED.email, INSERTED.status, INSERTED.created_at
      VALUES (@param1, @param2, @param3, @param4, GETDATE())
    `
    const result = await executeQuery(insertQuery, [username, email, password, status])

    return NextResponse.json({
      success: true,
      message: "User created successfully",
      user: result.rows[0],
    })
  } catch (error) {
    console.error("Error creating user:", error)

    // Try a simpler insert if the first one fails
    try {
      console.log("Trying simpler insert...")
      const simpleInsertQuery = `
        INSERT INTO users (username, email, password) 
        VALUES (@param1, @param2, @param3)
      `
      const { username, email, password } = await request.json() // Declare variables here
      await executeQuery(simpleInsertQuery, [username, email, password])

      return NextResponse.json({
        success: true,
        message: "User created successfully (simple insert)",
      })
    } catch (simpleError) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to create user",
          details: error instanceof Error ? error.message : "Unknown error",
          simpleError: simpleError instanceof Error ? simpleError.message : "Unknown simple error",
        },
        { status: 500 },
      )
    }
  }
}

// PUT - Update user
export async function PUT(request: NextRequest) {
  try {
    const { id, username, email, password, status } = await request.json()

    if (!id) {
      return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 })
    }

    // Build dynamic update query with basic columns
    const updates = []
    const params = []
    let paramCount = 1

    if (username) {
      updates.push(`username = @param${paramCount}`)
      params.push(username)
      paramCount++
    }
    if (email) {
      updates.push(`email = @param${paramCount}`)
      params.push(email)
      paramCount++
    }
    if (password) {
      updates.push(`password = @param${paramCount}`)
      params.push(password)
      paramCount++
    }
    if (status) {
      updates.push(`status = @param${paramCount}`)
      params.push(status)
      paramCount++
    }

    if (updates.length === 0) {
      return NextResponse.json({ success: false, error: "No fields to update" }, { status: 400 })
    }

    params.push(id)
    const updateQuery = `
      UPDATE users 
      SET ${updates.join(", ")}
      WHERE id = @param${paramCount}
    `

    const result = await executeQuery(updateQuery, params)

    if (result.rowCount === 0) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
    })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update user",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// DELETE - Delete user
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 })
    }

    // First get the username before deleting
    const getUserQuery = "SELECT username FROM users WHERE id = @param1"
    const userResult = await executeQuery(getUserQuery, [id])

    if (userResult.rowCount === 0) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    const username = userResult.rows[0].username

    // Delete the user
    const deleteQuery = "DELETE FROM users WHERE id = @param1"
    const result = await executeQuery(deleteQuery, [id])

    if (result.rowCount === 0) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: `User ${username} deleted successfully`,
    })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete user",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
