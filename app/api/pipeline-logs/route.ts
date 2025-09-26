import { NextResponse } from 'next/server';
import sql from 'mssql';

// Fetch logs from Stage.dbo.Pipeline_Log with optional filters
const stageConfig: sql.config = {
  user: process.env.SOURCE_DB_USER || 'Stage',
  password: process.env.SOURCE_DB_PASSWORD || 'Sapphire123',
  server: process.env.SOURCE_DB_SERVER || '192.168.1.28',
  database: process.env.SOURCE_DB_NAME || 'Stage',
  options: { encrypt: false, trustServerCertificate: true },
  pool: { max: 5, min: 0, idleTimeoutMillis: 30000 }
};

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 500); // cap at 500
  const tableFilter = url.searchParams.get('table');
  const eventTypeFilter = url.searchParams.get('eventType');
  const since = url.searchParams.get('since'); // ISO date to filter newer than

  let pool: sql.ConnectionPool | null = null;
  try {
    pool = await new sql.ConnectionPool(stageConfig).connect();
    let query = `SELECT TOP (${limit}) LogID, TableName, EventType, EventMessage, CreatedAt FROM Pipeline_Log`;
    const where: string[] = [];
    if (tableFilter) where.push('TableName = @tableName');
    if (eventTypeFilter) where.push('EventType = @eventType');
    if (since) where.push('CreatedAt >= @since');
    if (where.length) query += ' WHERE ' + where.join(' AND ');
    query += ' ORDER BY CreatedAt DESC, LogID DESC';

    const req = pool.request();
    if (tableFilter) req.input('tableName', sql.NVarChar(128), tableFilter);
    if (eventTypeFilter) req.input('eventType', sql.NVarChar(50), eventTypeFilter);
    if (since) {
      const sinceDate = new Date(since);
      if (!isNaN(sinceDate.getTime())) req.input('since', sql.DateTime, sinceDate);
    }
    const result = await req.query(query);
    const logs = result.recordset.map(r => ({
      logID: r.LogID,
      tableName: r.TableName,
      eventType: r.EventType,
      eventMessage: r.EventMessage,
      createdAt: r.CreatedAt instanceof Date ? r.CreatedAt.toISOString() : r.CreatedAt
    }));
    return NextResponse.json({ success: true, logs });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  } finally {
    if (pool) await pool.close();
  }
}
