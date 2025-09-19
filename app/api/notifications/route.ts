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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")
  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 })
  }
  let pool: sql.ConnectionPool | null = null
  try {
    pool = await sql.connect(dbConfig)
    const notifQuery = `SELECT id, message, is_read, created_at FROM notifications WHERE user_id = @user_id ORDER BY created_at DESC`
    const result = await pool.request().input("user_id", sql.NVarChar, userId).query(notifQuery)
    return NextResponse.json({ notifications: result.recordset })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
  } finally {
    if (pool) await pool.close()
  }
}

export async function PATCH(request: NextRequest) {
  // Mark notification as read
  let pool: sql.ConnectionPool | null = null
  try {
    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: "Missing notification id" }, { status: 400 })
    pool = await sql.connect(dbConfig)
    await pool.request().input("id", sql.Int, id).query("UPDATE notifications SET is_read = 1 WHERE id = @id")
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to update notification" }, { status: 500 })
  } finally {
    if (pool) await pool.close()
  }
}
