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

export async function POST(request: Request) {
  let pool: sql.ConnectionPool | null = null;
  try {
    const body = await request.json();
    const ids: unknown = body?.ids;
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ success: false, error: 'ids array required' }, { status: 400 });
    }
    const numericIds = ids.map(v => Number(v)).filter(v => Number.isInteger(v));
    if (numericIds.length === 0) {
      return NextResponse.json({ success: false, error: 'No valid numeric ids' }, { status: 400 });
    }
    pool = await new sql.ConnectionPool(stageConfig).connect();
    // Build parameterized IN clause
    const params: string[] = [];
    const requestSql = pool.request();
    numericIds.forEach((id, idx) => {
      const p = `id${idx}`;
      params.push(`@${p}`);
      requestSql.input(p, sql.Int, id);
    });
    const deleteSql = `DELETE FROM Pipeline_Log WHERE LogID IN (${params.join(',')})`;
    const result = await requestSql.query(deleteSql);
    const deleted = result.rowsAffected?.[0] || 0;
    return NextResponse.json({ success: true, deleted });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  } finally {
    if (pool) await pool.close();
  }
}
