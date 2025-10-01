import { NextRequest, NextResponse } from 'next/server'
import sql from 'mssql'

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
  const idParam = searchParams.get('id')
  if (!idParam) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  }
  const id = parseInt(idParam, 10)
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }

  let pool: sql.ConnectionPool | null = null
  try {
    pool = await sql.connect(dbConfig)
    const q = `SELECT id, username, table_name, filename, file_size_bytes, record_count, upload_date, census_year, status, error_message, json_data, CASE WHEN pdf_file IS NOT NULL THEN 1 ELSE 0 END AS has_pdf FROM upload_records WHERE id = @id`
    const result = await pool.request().input('id', sql.Int, id).query(q)
    if (!result.recordset[0]) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    const r = result.recordset[0]
    return NextResponse.json({
      record: {
        id: r.id,
        username: r.username,
        tableName: r.table_name,
        filename: r.filename,
        fileSizeBytes: r.file_size_bytes,
        recordCount: r.record_count,
        uploadDate: r.upload_date,
        censusYear: r.census_year,
        status: r.status,
        errorMessage: r.error_message,
        json_data: r.json_data,
        hasPdf: r.has_pdf === 1,
        pdf_file: r.has_pdf === 1 ? `/api/upload-history-admin?downloadPdfId=${r.id}` : null,
      }
    })
  } catch (e) {
    console.error('Detail fetch error', e)
    return NextResponse.json({ error: 'Failed to fetch detail' }, { status: 500 })
  } finally {
    if (pool) await pool.close()
  }
}
