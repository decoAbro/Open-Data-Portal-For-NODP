import { type NextRequest, NextResponse } from "next/server"
import sql from "mssql"
import pg from "pg"

export async function POST(request: NextRequest) {
  try {
    const config = await request.json()
    console.log("Connection attempt with config:", { ...config, password: "[HIDDEN]" })

    if (!config.type || !config.server || !config.database || !config.username) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required connection parameters. Please fill in all required fields.",
        },
        { status: 400 },
      )
    }

    let connectionResult

    switch (config.type) {
      case "sqlserver":
        connectionResult = await testSqlServerConnection(config)
        break
      case "postgresql":
        connectionResult = await testPostgresConnection(config)
        break
      default:
        return NextResponse.json(
          {
            success: false,
            error: "Unsupported database type. Please select SQL Server or PostgreSQL.",
          },
          { status: 400 },
        )
    }

    if (connectionResult.success) {
      return NextResponse.json({
        success: true,
        message: `Successfully connected to ${config.database} on ${config.server}`,
        tables: connectionResult.tables || [],
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: connectionResult.error,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Connection test error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown connection error occurred",
      },
      { status: 500 },
    )
  }
}

async function testSqlServerConnection(config: any) {
  let pool: sql.ConnectionPool | null = null

  try {
    const sqlConfig: sql.config = {
      server: config.server,
      database: config.database,
      user: config.username,
      password: config.password || "",
      port: config.port ? Number.parseInt(config.port) : 1433,
      options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
        connectTimeout: 30000,
        requestTimeout: 30000,
      },
      pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
      },
    }

    console.log("Attempting SQL Server connection to:", `${config.server}:${sqlConfig.port}/${config.database}`)

    pool = new sql.ConnectionPool(sqlConfig)
    await pool.connect()

    console.log("SQL Server connection successful, fetching tables...")

    // Get list of tables for verification
    const result = await pool.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `)

    const tables = result.recordset.map((row: any) => row.TABLE_NAME)
    console.log(`Found ${tables.length} tables`)

    return {
      success: true,
      tables: tables,
    }
  } catch (error) {
    console.error("SQL Server connection error:", error)

    let errorMessage = "Unknown SQL Server connection error"

    if (error instanceof Error) {
      if (error.message.includes("ECONNREFUSED")) {
        errorMessage = `Cannot connect to SQL Server at ${config.server}:${config.port}. Please check if the server is running and accessible.`
      } else if (error.message.includes("Login failed")) {
        errorMessage = "Login failed. Please check your username and password."
      } else if (error.message.includes("Cannot open database")) {
        errorMessage = `Cannot open database '${config.database}'. Please check if the database exists.`
      } else if (error.message.includes("timeout")) {
        errorMessage = "Connection timeout. Please check your server address and network connectivity."
      } else {
        errorMessage = error.message
      }
    }

    return {
      success: false,
      error: errorMessage,
    }
  } finally {
    if (pool) {
      try {
        await pool.close()
      } catch (closeError) {
        console.error("Error closing SQL Server connection:", closeError)
      }
    }
  }
}

async function testPostgresConnection(config: any) {
  let client: pg.Client | null = null

  try {
    const clientConfig = {
      host: config.server,
      port: config.port ? Number.parseInt(config.port) : 5432,
      database: config.database,
      user: config.username,
      password: config.password || "",
      connectionTimeoutMillis: 30000,
      query_timeout: 30000,
    }

    console.log("Attempting PostgreSQL connection to:", `${config.server}:${clientConfig.port}/${config.database}`)

    client = new pg.Client(clientConfig)
    await client.connect()

    console.log("PostgreSQL connection successful, fetching tables...")

    // Get list of tables for verification
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `)

    const tables = result.rows.map((row) => row.table_name)
    console.log(`Found ${tables.length} tables`)

    return {
      success: true,
      tables: tables,
    }
  } catch (error) {
    console.error("PostgreSQL connection error:", error)

    let errorMessage = "Unknown PostgreSQL connection error"

    if (error instanceof Error) {
      if (error.message.includes("ECONNREFUSED")) {
        errorMessage = `Cannot connect to PostgreSQL at ${config.server}:${config.port}. Please check if the server is running and accessible.`
      } else if (error.message.includes("password authentication failed")) {
        errorMessage = "Password authentication failed. Please check your username and password."
      } else if (error.message.includes("database") && error.message.includes("does not exist")) {
        errorMessage = `Database '${config.database}' does not exist. Please check the database name.`
      } else if (error.message.includes("timeout")) {
        errorMessage = "Connection timeout. Please check your server address and network connectivity."
      } else {
        errorMessage = error.message
      }
    }

    return {
      success: false,
      error: errorMessage,
    }
  } finally {
    if (client) {
      try {
        await client.end()
      } catch (closeError) {
        console.error("Error closing PostgreSQL connection:", closeError)
      }
    }
  }
}
