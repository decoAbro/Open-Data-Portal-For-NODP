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

export async function PATCH(request: NextRequest) {
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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
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


    // Query upload_records table for all users
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
        json_data,
        pdf_file
      FROM upload_records 
      ORDER BY upload_date DESC
    `

    const result = await pool.request().query(query)

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
      json_data: record.json_data,
      pdf_file: record.pdf_file ? `/api/upload-history-admin?downloadPdfId=${record.id}` : null,
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
