import { type NextRequest, NextResponse } from "next/server"
import sql from "mssql"

// Database configuration - using the same config as other routes
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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const username = searchParams.get("username")
  const downloadPdfId = searchParams.get("downloadPdfId")

  let pool: sql.ConnectionPool | null = null

  try {
    pool = await sql.connect(dbConfig)

    if (downloadPdfId) {
      // Download PDF blob for a specific record
      const pdfQuery = `SELECT filename, pdf_file FROM upload_records WHERE id = @id`;
      const pdfResult = await pool.request().input("id", sql.Int, downloadPdfId).query(pdfQuery);
      if (!pdfResult.recordset[0] || !pdfResult.recordset[0].pdf_file) {
        return new NextResponse("PDF not found", { status: 404 });
      }
      const { filename, pdf_file } = pdfResult.recordset[0];
      // pdf_file is likely a Buffer (MSSQL varbinary)
      const buffer = Buffer.isBuffer(pdf_file) ? pdf_file : Buffer.from(pdf_file);
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename || 'file'}.pdf"`,
        },
      });
    }

    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 })
    }

    // Query upload_records table for the specific user (exclude pdf_file and json_data for speed)
    const query = `
      SELECT 
        id,
        username,
        table_name,
        filename,
        file_size_bytes,
        record_count,
        upload_date,
        census_year,
        status,
        error_message,
        -- json_data, -- Exclude from main query
        -- pdf_file   -- Exclude from main query
        CASE WHEN pdf_file IS NOT NULL THEN 1 ELSE 0 END AS has_pdf
      FROM upload_records 
      WHERE username = @username
      ORDER BY upload_date DESC
    `

    const result = await pool.request().input("username", sql.NVarChar, username).query(query)

    // Format the data for the frontend
    const uploadHistory = result.recordset.map((record) => ({
      id: record.id,
      username: record.username,
      tableName: record.table_name,
      filename: record.filename,
      fileSizeBytes: record.file_size_bytes,
      recordCount: record.record_count,
      uploadDate: record.upload_date,
      censusYear: record.census_year,
      status: record.status,
      errorMessage: record.error_message,
      // Only provide download link if PDF exists
      pdf_file: record.has_pdf ? `/api/upload-history?downloadPdfId=${record.id}` : null,
      // json_data: not included for speed
    }))

    return NextResponse.json({ uploadHistory })
  } catch (error) {
    console.error("Error fetching upload history:", error)
    return NextResponse.json({ error: "Failed to fetch upload history" }, { status: 500 })
  } finally {
    if (pool) {
      await pool.close()
    }
  }
}

// DELETE /api/upload-history?id=123
// Only allows deletion of records whose status is 'rejected'.
// Also attempts to delete related data rows from the original data table, matching any supported user column variant.
// Supported user column candidates (case-insensitive): username, user_name, uploadedBy, uploaded_by, uploaded_by_user, created_by.
// Resolves table schema (defaults to dbo) and uses QUOTENAME for safety; only proceeds if a user column exists.
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 })
  }

  let pool: sql.ConnectionPool | null = null
  try {
    pool = await sql.connect(dbConfig)
    const check = await pool
      .request()
      .input("id", sql.Int, id)
      .query(`SELECT id, status, username, table_name, census_year FROM upload_records WHERE id = @id`)

    if (!check.recordset[0]) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 })
    }

    if (check.recordset[0].status?.toLowerCase() !== "rejected") {
      return NextResponse.json({ error: "Only rejected records can be deleted" }, { status: 403 })
    }
  const { username, table_name } = check.recordset[0]

    // Whitelist pattern for table names to avoid injection. Only allow letters, numbers, underscore.
    if (!/^[A-Za-z0-9_]+$/.test(table_name)) {
      return NextResponse.json({ error: "Unsafe table name" }, { status: 400 })
    }

    // Begin transaction for cascading delete
    const transaction = new sql.Transaction(pool)
    await transaction.begin()
    try {
      const requestTx = new sql.Request(transaction)

      // Identify schema & user column variant
      const columnCandidates = [
        'username', 'user_name', 'uploadedBy', 'uploaded_by', 'uploaded_by_user', 'created_by'
      ]
      // Fetch columns for the target table across schemas
      const columnsQuery = `
        SELECT s.name AS schema_name, o.name AS table_name, c.name AS column_name
        FROM sys.objects o
        INNER JOIN sys.schemas s ON o.schema_id = s.schema_id
        INNER JOIN sys.columns c ON c.object_id = o.object_id
        WHERE o.type = 'U' AND o.name = @tbl
      `
      const columnsResult = await requestTx.input('tbl', sql.NVarChar, table_name).query(columnsQuery)

      let schemaName: string | null = null
      let matchedUserColumn: string | null = null
      if (columnsResult.recordset.length > 0) {
        schemaName = columnsResult.recordset[0].schema_name || 'dbo'
        const availableColumnsLower = columnsResult.recordset.map(r => r.column_name.toLowerCase())
        for (const candidate of columnCandidates) {
          if (availableColumnsLower.includes(candidate.toLowerCase())) {
            matchedUserColumn = columnsResult.recordset.find(r => r.column_name.toLowerCase() === candidate.toLowerCase())!.column_name
            break
          }
        }
      }

      let deletedDataRows = 0
      let cascadeReason = ''
      if (!schemaName) {
        cascadeReason = 'Table not found in any schema'
      } else if (!matchedUserColumn) {
        cascadeReason = 'No user ownership column found'
      } else {
        // Safe dynamic SQL using QUOTENAME for schema & table; parameterize username
        const deleteStatement = `DELETE FROM ` +
          `QUOTENAME(@sch) + '.' + QUOTENAME(@tbl) + ' WHERE ' + QUOTENAME(@col) + ' = @username'`
        // Build dynamic SQL via sp_executesql pattern
        const dynSql = `DECLARE @sql NVARCHAR(MAX);\n` +
          `SET @sql = N'DELETE FROM ' + QUOTENAME(@sch) + '.' + QUOTENAME(@tbl) + N' WHERE ' + QUOTENAME(@col) + N' = @u';\n` +
          `EXEC sp_executesql @sql, N'@u NVARCHAR(255)', @u = @usernameParam;`
        // Because QUOTENAME cannot be parameterized directly inside dynamic string easily with sp_executesql when using variables, we emulate manually
        // Simpler approach: construct final SQL in JS with validated identifiers.
        const finalSql = `DELETE FROM ${schemaName ? `[${schemaName}]` : '[dbo]'}.[${table_name}] WHERE [${matchedUserColumn}] = @username`;
        const delDataResult = await requestTx
          .input('username', sql.NVarChar, username)
          .query(finalSql)
        deletedDataRows = delDataResult.rowsAffected[0] || 0
        cascadeReason = deletedDataRows === 0 ? 'No matching rows' : 'OK'
      }

      // Delete upload record itself
      await new sql.Request(transaction).input("id", sql.Int, id).query(`DELETE FROM upload_records WHERE id = @id`)
      await transaction.commit()
      return NextResponse.json({ success: true, deletedDataRows, userColumn: matchedUserColumn, schema: schemaName, cascadeReason })
    } catch (innerErr) {
      await transaction.rollback()
      console.error('Cascade delete failed', innerErr)
      return NextResponse.json({ error: 'Failed during cascading delete' }, { status: 500 })
    }
  } catch (error) {
    console.error("Failed to delete upload record", error)
    return NextResponse.json({ error: "Failed to delete record" }, { status: 500 })
  } finally {
    if (pool) await pool.close()
  }
}
