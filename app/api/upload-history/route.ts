import { type NextRequest, NextResponse } from "next/server"
import sql from "mssql"

// Database configuration - using the same config as other routes
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
