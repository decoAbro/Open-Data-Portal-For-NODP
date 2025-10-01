import { NextRequest, NextResponse } from 'next/server';
import { ConnectionPool } from 'mssql';

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
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { filename, census_year, uploaded_by, json_data } = body;
    if (!filename || !census_year || !json_data) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    // Ensure all required DB config fields are present
    if (!dbConfig.user || !dbConfig.password || !dbConfig.server || !dbConfig.database) {
      return NextResponse.json({ error: 'Database configuration is incomplete.' }, { status: 500 });
    }

    const pool = new ConnectionPool({
      ...dbConfig,
      user: dbConfig.user!,
      password: dbConfig.password!,
      server: dbConfig.server!,
      database: dbConfig.database!,
    });
    await pool.connect();
    await pool.request()
      .input('filename', filename)
      .input('census_year', census_year)
      .input('uploaded_by', uploaded_by || null)
      .input('json_data', JSON.stringify(json_data))
      .query(`INSERT INTO uploaded_json_files (filename, census_year, uploaded_by, json_data) VALUES (@filename, @census_year, @uploaded_by, @json_data)`);
    await pool.close();

    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
