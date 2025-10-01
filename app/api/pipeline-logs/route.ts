import { NextResponse } from 'next/server';
import sql from 'mssql';

// Fetch logs from Stage.dbo.Pipeline_Log with optional filters
const stageConfig: sql.config = {
  user: process.env.SOURCE_DB_USER || 'NODP',
  password: process.env.SOURCE_DB_PASSWORD || 'Prod123',
  server: process.env.SOURCE_DB_SERVER || '172.16.17.32',
  database: process.env.SOURCE_DB_NAME || 'Stage',
  options: { encrypt: false, trustServerCertificate: true },
  pool: { max: 5, min: 0, idleTimeoutMillis: 30000 }
};

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  // Pagination
  const pageParam = parseInt(url.searchParams.get('page') || '1', 10);
  const pageSizeParam = parseInt(url.searchParams.get('pageSize') || url.searchParams.get('limit') || '50', 10);
  const pageSize = Math.min(Math.max(pageSizeParam, 1), 200); // cap at 200
  const page = Math.max(pageParam, 1);
  const offset = (page - 1) * pageSize;

  const tableFilter = url.searchParams.get('table');
  const eventTypeFilter = url.searchParams.get('eventType');
  const since = url.searchParams.get('since'); // ISO date to filter newer than
  const messageSearch = url.searchParams.get('q'); // substring / token search
  const searchMode = url.searchParams.get('qMode') || 'plain'; // plain | smart | wildcard

  let pool: sql.ConnectionPool | null = null;
  try {
    pool = await new sql.ConnectionPool(stageConfig).connect();

    const where: string[] = [];
    if (tableFilter) where.push('TableName = @tableName');
    if (eventTypeFilter) where.push('EventType = @eventType');
  if (since) where.push('CreatedAt >= @since');
    let searchTokens: string[] = [];
    if (messageSearch) {
      if (searchMode === 'smart') {
        // Split into tokens (AND all tokens)
        searchTokens = messageSearch
          .split(/\s+/)
          .map(t => t.trim())
          .filter(t => t.length > 0)
          .slice(0, 8); // cap tokens
        searchTokens.forEach((t, idx) => {
          where.push(`EventMessage LIKE @tok${idx}`);
        });
      } else if (searchMode === 'wildcard') {
        // Accept * and ? wildcards
        where.push('EventMessage LIKE @messageLike');
      } else { // plain
        where.push('EventMessage LIKE @messageLike');
      }
    }
    const whereClause = where.length ? ' WHERE ' + where.join(' AND ') : '';

    // Total count
    const countQuery = `SELECT COUNT(*) AS total FROM Pipeline_Log${whereClause}`;
    const reqBase = pool.request();
    if (tableFilter) reqBase.input('tableName', sql.NVarChar(128), tableFilter);
    if (eventTypeFilter) reqBase.input('eventType', sql.NVarChar(50), eventTypeFilter);
    if (since) {
      const sinceDate = new Date(since);
      if (!isNaN(sinceDate.getTime())) reqBase.input('since', sql.DateTime, sinceDate);
    }
    if (messageSearch) {
      if (searchMode === 'smart') {
        searchTokens.forEach((t, idx) => {
          reqBase.input(`tok${idx}`, sql.NVarChar(sql.MAX), `%${t.replace(/%/g, '')}%`);
        });
      } else if (searchMode === 'wildcard') {
        // Transform * -> % and ? -> _ while escaping existing % _
        const transformed = messageSearch
          .replace(/[%_]/g, m => `[${m}]`)
          .replace(/\*/g, '%')
          .replace(/\?/g, '_');
        reqBase.input('messageLike', sql.NVarChar(sql.MAX), transformed.includes('%') || transformed.includes('_') ? transformed : `%${transformed}%`);
      } else {
        reqBase.input('messageLike', sql.NVarChar(sql.MAX), `%${messageSearch.replace(/%/g, '')}%`);
      }
    }
    const countResult = await reqBase.query(countQuery);
    const total: number = countResult.recordset[0]?.total || 0;

    // Page query (OFFSET/FETCH for pagination)
    const pageReq = pool.request();
    if (tableFilter) pageReq.input('tableName', sql.NVarChar(128), tableFilter);
    if (eventTypeFilter) pageReq.input('eventType', sql.NVarChar(50), eventTypeFilter);
    if (since) {
      const sinceDate = new Date(since);
      if (!isNaN(sinceDate.getTime())) pageReq.input('since', sql.DateTime, sinceDate);
    }
    if (messageSearch) {
      if (searchMode === 'smart') {
        searchTokens.forEach((t, idx) => {
          pageReq.input(`tok${idx}`, sql.NVarChar(sql.MAX), `%${t.replace(/%/g, '')}%`);
        });
      } else if (searchMode === 'wildcard') {
        const transformed = messageSearch
          .replace(/[%_]/g, m => `[${m}]`)
          .replace(/\*/g, '%')
          .replace(/\?/g, '_');
        pageReq.input('messageLike', sql.NVarChar(sql.MAX), transformed.includes('%') || transformed.includes('_') ? transformed : `%${transformed}%`);
      } else {
        pageReq.input('messageLike', sql.NVarChar(sql.MAX), `%${messageSearch.replace(/%/g, '')}%`);
      }
    }
    pageReq.input('offset', sql.Int, offset);
    pageReq.input('fetch', sql.Int, pageSize);
    const pageQuery = `
      SELECT LogID, TableName, EventType, EventMessage, CreatedAt
      FROM Pipeline_Log
      ${whereClause}
      ORDER BY CreatedAt DESC, LogID DESC
      OFFSET @offset ROWS FETCH NEXT @fetch ROWS ONLY
    `;
    const result = await pageReq.query(pageQuery);

    const logs = result.recordset.map(r => ({
      logID: r.LogID,
      tableName: r.TableName,
      eventType: r.EventType,
      eventMessage: r.EventMessage,
      createdAt: r.CreatedAt instanceof Date ? r.CreatedAt.toISOString() : r.CreatedAt
    }));

    // Distinct tables & event types (could be cached later)
    const distinctQuery = await pool.request().query<{
      TableName?: string;
      EventType?: string;
    }>(`
      SELECT DISTINCT TableName FROM Pipeline_Log ORDER BY TableName ASC;
      SELECT DISTINCT EventType FROM Pipeline_Log ORDER BY EventType ASC;
    `);
    const recordsets = distinctQuery.recordsets as Array<Array<{ TableName?: string; EventType?: string }>>;
    const tablesDistinct = (recordsets[0] || []).map(r => r.TableName!).filter((v): v is string => !!v);
    const eventTypesDistinct = (recordsets[1] || []).map(r => r.EventType!).filter((v): v is string => !!v);

    const totalPages = Math.max(Math.ceil(total / pageSize), 1);
    const hasMore = page < totalPages;

    return NextResponse.json({
      success: true,
      logs,
      page,
      pageSize,
      total,
      totalPages,
      hasMore,
      tablesDistinct,
      eventTypesDistinct,
      searchTokens: messageSearch ? (searchMode === 'smart' ? searchTokens : [messageSearch]) : []
    });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  } finally {
    if (pool) await pool.close();
  }
}
