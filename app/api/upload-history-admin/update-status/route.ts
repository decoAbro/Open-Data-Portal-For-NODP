import { type NextRequest, NextResponse } from "next/server"
import sql from "mssql"

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

export async function POST(request: NextRequest) {
  let pool: sql.ConnectionPool | null = null;
  try {
    const body = await request.json();
    const { id, status } = body;
    if (!id || !status) {
      return NextResponse.json({ error: "Missing id or status" }, { status: 400 });
    }
    pool = await sql.connect(dbConfig);
    // Get username and table name for notification
    const userQuery = `SELECT username, table_name FROM upload_records WHERE id = @id`;
    const userResult = await pool.request().input("id", sql.Int, id).query(userQuery);
    if (!userResult.recordset[0]) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }
    const { username, table_name } = userResult.recordset[0];

    // Update status
    const updateQuery = `UPDATE upload_records SET status = @status WHERE id = @id`;
    const result = await pool.request()
      .input("status", sql.VarChar, status)
      .input("id", sql.Int, id)
      .query(updateQuery);
    if (result.rowsAffected[0] === 0) {
      return NextResponse.json({ error: "Record not updated" }, { status: 404 });
    }

    // Insert notification for user with table name context
    let notifMsg = "";
    const prettyTable = table_name || "(unknown table)";
    const lowerStatus = status.toLowerCase();
    if (lowerStatus === "approved") {
      notifMsg = `Table ${prettyTable}: Your upload has been approved.`;
    } else if (lowerStatus === "rejected") {
      notifMsg = `Table ${prettyTable}: Your upload has been rejected.`;
    } else if (lowerStatus === "in-review") {
      notifMsg = `Table ${prettyTable}: Your upload is now in review.`;
    } else {
      notifMsg = `Table ${prettyTable}: Status updated to ${status}.`;
    }
    const notifQuery = `INSERT INTO notifications (user_id, message, is_read, created_at) VALUES (@user_id, @message, 0, GETDATE())`;
    await pool.request()
      .input("user_id", sql.NVarChar, username)
      .input("message", sql.NVarChar, notifMsg)
      .query(notifQuery);

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
