import { NextResponse } from "next/server"
import sql from "mssql"

// Reuse the same DB settings used elsewhere (e.g., upload-history)
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

export async function GET() {
  let pool: sql.ConnectionPool | null = null
  try {
    pool = await sql.connect(dbConfig)

    // Fetch latest logs from Stage.dbo.job_logs (schema provided)
    const query = `
      SELECT TOP 100
        ROW_NUMBER() OVER (ORDER BY [Timestamp] DESC) AS id,
        [Timestamp] AS timestamp,
        User_Id AS user_id,
        Table_name AS table_name,
        Inst_Id AS inst_id,
        Census_Year AS census_year,
        Error_Message AS error_message,
        Java_Error_Message AS java_error_message
      FROM Stage.dbo.job_logs
      ORDER BY [Timestamp] DESC
    `

    const result = await pool.request().query(query)

    const logs = result.recordset.map((r) => ({
      id: r.id,
      timestamp: r.timestamp,
      userId: r.user_id,
      tableName: r.table_name,
      instId: r.inst_id,
      censusYear: r.census_year,
      errorMessage: r.error_message,
      javaErrorMessage: r.java_error_message,
    }))

    return NextResponse.json({ logs })
  } catch (error: any) {
    console.error("Error fetching production push logs:", error)
    // Return empty logs with error detail for graceful frontend handling
    return NextResponse.json(
      { logs: [], error: "Failed to fetch production push logs" },
      { status: 500 }
    )
  } finally {
    if (pool) await pool.close()
  }
}
