import { NextResponse } from "next/server"
import sql from "mssql"

// SQL Server database configuration with alternative options
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
  requestTimeout: 30000,
  connectionTimeout: 30000,
}

export async function GET() {
  try {
    console.log("Attempting alternative connection to SQL Server...")

    // Create a new connection (not using pool)
    await sql.connect(dbConfig)
    console.log("Connected successfully")

    // Simple test query
    const result = await sql.query`SELECT @@VERSION as version`
    const sqlVersion = result.recordset[0].version

    // Close the connection
    await sql.close()

    return NextResponse.json({
      success: true,
      message: "Alternative connection method successful",
      sqlVersion,
      server: "192.168.1.28",
      database: "Stage",
    })
  } catch (error) {
    console.error("Alternative connection error:", error)

    let errorMessage = "Unknown error"
    let errorDetails = ""

    if (error instanceof Error) {
      errorMessage = error.message
      errorDetails = error.stack || ""
    }

    return NextResponse.json(
      {
        success: false,
        error: `Alternative connection failed: ${errorMessage}`,
        details: errorDetails,
        server: "192.168.1.28",
        database: "Stage",
      },
      { status: 500 },
    )
  } finally {
    try {
      await sql.close()
    } catch (err) {
      console.error("Error closing SQL connection:", err)
    }
  }
}
