import { type NextRequest, NextResponse } from "next/server"
import sql from "mssql"

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

// GET: Read data-not-available status for a user
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const username = searchParams.get("username")
  if (!username) {
    return NextResponse.json({ error: "Username is required" }, { status: 400 })
  }
  let pool: sql.ConnectionPool | null = null
  try {
    pool = await sql.connect(dbConfig)
  const query = `SELECT id, username, table_name, census_year, reason, created_at, report_date FROM data_not_available WHERE username = @username ORDER BY created_at DESC`
  const result = await pool.request().input("username", sql.NVarChar, username).query(query)
  return NextResponse.json({ dataNotAvailable: result.recordset })
  } catch (error) {
    console.error("Error fetching data-not-available:", error)
    return NextResponse.json({ error: "Failed to fetch data-not-available" }, { status: 500 })
  } finally {
    if (pool) await pool.close()
  }
}

// POST: Mark data-not-available for a user
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { username, tableName, year, reason } = body
  if (!username || !tableName || !year) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }
  let pool: sql.ConnectionPool | null = null
  try {
    pool = await sql.connect(dbConfig)
    const query = `INSERT INTO data_not_available (username, table_name, census_year, reason) VALUES (@username, @tableName, @censusYear, @reason)`
    await pool.request()
      .input("username", sql.NVarChar, username)
      .input("tableName", sql.NVarChar, tableName)
      .input("censusYear", sql.NVarChar, year)
      .input("reason", sql.NVarChar, reason || "data_not_available")
      .query(query)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error marking data-not-available:", error)
    return NextResponse.json({ error: "Failed to mark data-not-available" }, { status: 500 })
  } finally {
    if (pool) await pool.close()
  }
}
