import { NextResponse } from 'next/server';
import sql from 'mssql';

// Allow long running (Vercel / Next.js) if deployed
export const maxDuration = 300; // seconds
export const dynamic = 'force-dynamic';

// Source (staging) DB config
const sourceConfig: sql.config = {
  user: process.env.SOURCE_DB_USER || 'Stage',
  password: process.env.SOURCE_DB_PASSWORD || 'Sapphire123',
  server: process.env.SOURCE_DB_SERVER || '192.168.1.28',
  database: process.env.SOURCE_DB_NAME || 'Stage',
  options: { encrypt: false, trustServerCertificate: true },
  pool: { max: 5, min: 0, idleTimeoutMillis: 30000 }
};

// Destination (production) DB config (currently "Empty_Database")
const destConfig: sql.config = {
  user: process.env.DEST_DB_USER || 'NODP',
  password: process.env.DEST_DB_PASSWORD || 'Sapphire123',
  server: process.env.DEST_DB_SERVER || '192.168.1.28',
  database: process.env.DEST_DB_NAME || 'Empty_Database',
  options: { encrypt: false, trustServerCertificate: true },
  pool: { max: 5, min: 0, idleTimeoutMillis: 30000 }
};

// Queries to move (tableName -> select statement)
// NOTE: Matches the Python example provided by user. Expand as needed.
const TABLE_QUERIES: Record<string, string> = {
  Institutions: `SELECT Inst_Id, Census_Year, Province_Id, Name, Address, Village, UC_Name, UC_No, Circle_Name, City, District_Id, Tehsil_Id, PA_No, NA_No, Phone_No, Fax_No, Email, Website, Location_Id, Level_Id, FunctionalStatus_Id, Established_Date, Management_Id, Kind_Id, Shift_Id, Gender_Id, Medium_Id, SchoolCommittee_Id, Sector_Id, Latitude, Longitude, Altitude FROM Institutions`
};

interface TableResultSummary {
  table: string;
  extracted: number;
  loaded: number;
  failed: number;
  durationMs: number;
  error?: string;
}

async function logEvent(pool: sql.ConnectionPool, tableName: string, eventType: string, eventMessage: string) {
  try {
    // Truncate message to avoid oversize (similar to Python slice [:4000])
    const msg = eventMessage.length > 3900 ? eventMessage.slice(0, 3900) : eventMessage;
    await pool.request()
      .input('TableName', sql.NVarChar(128), tableName)
      .input('EventType', sql.NVarChar(50), eventType)
      .input('EventMessage', sql.NVarChar(sql.MAX), msg)
      .query('INSERT INTO Pipeline_Log (TableName, EventType, EventMessage) VALUES (@TableName, @EventType, @EventMessage)');
  } catch (e) {
    console.error('Failed to log pipeline event', tableName, e);
  }
}

export async function POST(request: Request) {
  const started = Date.now();
  let sourcePool: sql.ConnectionPool | null = null;
  let destPool: sql.ConnectionPool | null = null;
  const summaries: TableResultSummary[] = [];

  try {
    // Optional body for future extensibility (e.g., specific tables, truncate flag)
    let body: any = {};
    try { body = await request.json(); } catch { /* ignore empty body */ }
    const tablesRequested: string[] | undefined = body?.tables;
    const truncateBeforeLoad: boolean = body?.truncate === true; // default false to match Python behaviour

    sourcePool = await new sql.ConnectionPool(sourceConfig).connect();
    destPool = await new sql.ConnectionPool(destConfig).connect();

    await logEvent(sourcePool, 'PIPELINE', 'INFO', 'Production push started');

    const tableEntries = Object.entries(TABLE_QUERIES).filter(([name]) => !tablesRequested || tablesRequested.includes(name));
    if (tableEntries.length === 0) {
      return NextResponse.json({ success: false, error: 'No tables selected or configured.' }, { status: 400 });
    }

    for (const [tableName, query] of tableEntries) {
      const t0 = Date.now();
      let extracted = 0; let loaded = 0; let failed = 0; let error: string | undefined;
      try {
        await logEvent(sourcePool, tableName, 'INFO', 'Starting table processing');
        const extractResult = await sourcePool.request().query(query);
        const rows = extractResult.recordset || [];
        extracted = rows.length;
        await logEvent(sourcePool, tableName, 'INFO', `Extracted ${extracted} rows`);

        if (extracted === 0) {
          summaries.push({ table: tableName, extracted, loaded, failed, durationMs: Date.now() - t0 });
          continue;
        }

        if (truncateBeforeLoad) {
          try {
            await destPool.request().query(`TRUNCATE TABLE ${tableName}`);
            await logEvent(sourcePool, tableName, 'INFO', 'Destination table truncated');
          } catch (e) {
            await logEvent(sourcePool, tableName, 'ERROR', 'Failed to truncate destination table: ' + (e instanceof Error ? e.message : String(e)));
          }
        }

        // Build dynamic insert statement
        const columns = Object.keys(rows[0]);
        const colList = columns.map(c => `[${c}]`).join(', ');
        const paramList = columns.map((_, idx) => `@p${idx}`).join(', ');
        const insertSQL = `INSERT INTO ${tableName} (${colList}) VALUES (${paramList})`;

        for (const row of rows) {
          const req = destPool.request();
            columns.forEach((col, idx) => {
              const value = (row as any)[col];
              // Let mssql infer type; can be refined per schema if needed
              req.input(`p${idx}`, value);
            });
          try {
            await req.query(insertSQL);
            loaded++;
          } catch (e) {
            failed++;
            await logEvent(sourcePool, tableName, 'ERROR', `Row insert failed: ${(e instanceof Error ? e.message : String(e))}`);
          }
        }

        await logEvent(sourcePool, tableName, 'INFO', `Loaded ${loaded} rows. Failed: ${failed}`);
      } catch (e) {
        error = e instanceof Error ? e.message : String(e);
        await logEvent(sourcePool, tableName, 'ERROR', 'Table processing failed: ' + error);
      } finally {
        summaries.push({ table: tableName, extracted, loaded, failed, durationMs: Date.now() - t0, error });
      }
    }

    await logEvent(sourcePool, 'PIPELINE', 'INFO', 'Production push completed');

    const totalDuration = Date.now() - started;
    return NextResponse.json({ success: true, totalDurationMs: totalDuration, tables: summaries });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (sourcePool) await logEvent(sourcePool, 'PIPELINE', 'ERROR', 'Pipeline fatal error: ' + msg);
    return NextResponse.json({ success: false, error: msg, tables: summaries }, { status: 500 });
  } finally {
    if (sourcePool) await sourcePool.close();
    if (destPool) await destPool.close();
  }
}
