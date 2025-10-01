import { NextResponse } from 'next/server';
import sql from 'mssql';

const stageConfig: sql.config = {
  user: process.env.SOURCE_DB_USER || 'NODP',
  password: process.env.SOURCE_DB_PASSWORD || 'Prod123',
  server: process.env.SOURCE_DB_SERVER || '172.16.17.32',
  database: process.env.SOURCE_DB_NAME || 'Stage',
  options: { encrypt: false, trustServerCertificate: true },
  pool: { max: 5, min: 0, idleTimeoutMillis: 30000 }
};

export const dynamic = 'force-dynamic';

function csvEscape(value: any): string {
  if (value == null) return '';
  const str = String(value).replace(/\r\n|\r|\n/g, ' ');
  if (/[",\n]/.test(str)) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '1000', 10), 5000); // hard cap 5000
  const tableFilter = url.searchParams.get('table');
  const eventTypeFilter = url.searchParams.get('eventType');
  const since = url.searchParams.get('since');

  let pool: sql.ConnectionPool | null = null;
  try {
    pool = await new sql.ConnectionPool(stageConfig).connect();
    const where: string[] = [];
    if (tableFilter) where.push('TableName = @tableName');
    if (eventTypeFilter) where.push('EventType = @eventType');
    if (since) where.push('CreatedAt >= @since');
    const whereClause = where.length ? ' WHERE ' + where.join(' AND ') : '';
    const query = `SELECT TOP (@limit) LogID, TableName, EventType, EventMessage, CreatedAt FROM Pipeline_Log${whereClause} ORDER BY CreatedAt DESC, LogID DESC`;
    const req = pool.request();
    req.input('limit', sql.Int, limit);
    if (tableFilter) req.input('tableName', sql.NVarChar(128), tableFilter);
    if (eventTypeFilter) req.input('eventType', sql.NVarChar(50), eventTypeFilter);
    if (since) {
      const sinceDate = new Date(since);
      if (!isNaN(sinceDate.getTime())) req.input('since', sql.DateTime, sinceDate);
    }
    const result = await req.query(query);
    const rows = result.recordset;
    const header = ['LogID','TableName','EventType','EventMessage','CreatedAt'];
    const lines = [header.join(',')];
    for (const r of rows) {
      lines.push([
        csvEscape(r.LogID),
        csvEscape(r.TableName),
        csvEscape(r.EventType),
        csvEscape(r.EventMessage),
        csvEscape(r.CreatedAt instanceof Date ? r.CreatedAt.toISOString() : r.CreatedAt)
      ].join(','));
    }
    const csv = lines.join('\n');
    const ts = new Date().toISOString().replace(/[:T]/g,'-').slice(0,19);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="pipeline_logs_${ts}.csv"`,
        'Cache-Control': 'no-store'
      }
    });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  } finally {
    if (pool) await pool.close();
  }
}
