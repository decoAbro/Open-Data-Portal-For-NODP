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

export async function POST(request: NextRequest) {
  let pool: sql.ConnectionPool | null = null;
  try {
    const body = await request.json();
    const { id, status } = body;
    if (!id || !status) {
      return NextResponse.json({ error: "Missing id or status" }, { status: 400 });
    }
    pool = await sql.connect(dbConfig);
    const updateQuery = `UPDATE upload_records SET status = @status WHERE id = @id`;
    const result = await pool.request()
      .input("status", sql.VarChar, status)
      .input("id", sql.Int, id)
      .query(updateQuery);
    if (result.rowsAffected[0] === 0) {
      return NextResponse.json({ error: "Record not found or not updated" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating status:", error);
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}
