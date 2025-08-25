import { type NextRequest, NextResponse } from "next/server"
import sql from "mssql"
import pg from "pg"

export async function POST(request: NextRequest) {
  try {
    const { config, query } = await request.json()

    if (!config || !query) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required parameters (config and query)",
        },
        { status: 400 },
      )
    }

    if (!query.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Query cannot be empty",
        },
        { status: 400 },
      )
    }

    console.log("Executing query on", config.type, "database:", query.substring(0, 100) + "...")

    let queryResult

    switch (config.type) {
      case "sqlserver":
        queryResult = await executeSqlServerQuery(config, query)
        break
      case "postgresql":
        queryResult = await executePostgresQuery(config, query)
        break
      default:
        return NextResponse.json(
          {
            success: false,
            error: "Unsupported database type",
          },
          { status: 400 },
        )
    }

    if (queryResult.success) {
      return NextResponse.json({
        success: true,
        results: queryResult.results,
        rowCount: queryResult.rowCount,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: queryResult.error,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Query execution error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown query execution error",
      },
      { status: 500 },
    )
  }
}

async function executeSqlServerQuery(config: any, query: string) {
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
        requestTimeout: 60000,
      },
      pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
      },
    }

    pool = new sql.ConnectionPool(sqlConfig)
    await pool.connect()

    const result = await pool.request().query(query)

    return {
      success: true,
      results: result.recordset || [],
      rowCount: result.recordset?.length || 0,
    }
  } catch (error) {
    console.error("SQL Server query error:", error)

    let errorMessage = "Unknown SQL Server query error"

    if (error instanceof Error) {
      if (error.message.includes("Invalid object name")) {
        errorMessage = "Table or view does not exist. Please check your table names."
      } else if (error.message.includes("Invalid column name")) {
        errorMessage = "Invalid column name in query. Please check your column names."
      } else if (error.message.includes("Syntax error")) {
        errorMessage = "SQL syntax error. Please check your query syntax."
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

async function executePostgresQuery(config: any, query: string) {
  let client: pg.Client | null = null

  try {
    const clientConfig = {
      host: config.server,
      port: config.port ? Number.parseInt(config.port) : 5432,
      database: config.database,
      user: config.username,
      password: config.password || "",
      connectionTimeoutMillis: 30000,
      query_timeout: 60000,
    }

    client = new pg.Client(clientConfig)
    await client.connect()

    const result = await client.query(query)

    return {
      success: true,
      results: result.rows || [],
      rowCount: result.rowCount || 0,
    }
  } catch (error) {
    console.error("PostgreSQL query error:", error)

    let errorMessage = "Unknown PostgreSQL query error"

    if (error instanceof Error) {
      if (error.message.includes("relation") && error.message.includes("does not exist")) {
        errorMessage = "Table or view does not exist. Please check your table names."
      } else if (error.message.includes("column") && error.message.includes("does not exist")) {
        errorMessage = "Column does not exist. Please check your column names."
      } else if (error.message.includes("syntax error")) {
        errorMessage = "SQL syntax error. Please check your query syntax."
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
