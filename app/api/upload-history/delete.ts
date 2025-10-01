import { NextRequest, NextResponse } from "next/server"
import sql from "mssql"

// Use the same dbConfig as other routes
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

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 })
  }

  let pool: sql.ConnectionPool | null = null
  try {
    pool = await sql.connect(dbConfig)
    // Only allow delete if status is 'rejected'
    const check = await pool.request().input("id", sql.Int, id).query(
      `SELECT status FROM upload_records WHERE id = @id`
    )
    if (!check.recordset[0] || check.recordset[0].status.toLowerCase() !== "rejected") {
      return NextResponse.json({ error: "Only rejected records can be deleted" }, { status: 403 })
    }
    await pool.request().input("id", sql.Int, id).query(
      `DELETE FROM upload_records WHERE id = @id`
    )
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete record" }, { status: 500 })
  } finally {
    if (pool) await pool.close()
  }
}
