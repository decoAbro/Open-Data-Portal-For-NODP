import { NextResponse } from 'next/server';
import { ensureUploadWindowTable, getUploadWindowState, updateUploadWindowState, addUploadWindowUsers } from './database';
import sql from 'mssql';

// (Lightweight) user lookup helper for userAllowed calculation when selective
async function getUserIdByUsername(username: string): Promise<number | null> {
  const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER || '',
    database: process.env.DB_NAME,
    options: { encrypt: true, trustServerCertificate: true }
  };
  let pool: sql.ConnectionPool | undefined;
  try {
    pool = await new sql.ConnectionPool(config).connect();
    const res = await pool.request().input('username', sql.NVarChar(255), username).query('SELECT id FROM users WHERE username = @username');
    if (res.recordset[0]) return res.recordset[0].id;
    return null;
  } catch (e) {
    console.error('Error looking up user by username', e);
    return null;
  } finally {
    if (pool) await pool.close();
  }
}

export async function GET(request: Request) {
  try {
    await ensureUploadWindowTable(); // Ensure table exists
    const url = new URL(request.url);
    const userIdParam = url.searchParams.get('userId');
    const usernameParam = url.searchParams.get('username');
    const state = await getUploadWindowState();

    let userAllowed: boolean | null = null;
    let resolvedUserId: number | null = null;
    if (userIdParam) {
      const parsed = parseInt(userIdParam, 10);
      if (!isNaN(parsed)) resolvedUserId = parsed;
    } else if (usernameParam) {
      resolvedUserId = await getUserIdByUsername(usernameParam);
    }

    if (resolvedUserId != null && state.scope === 'selective' && state.allowedUserIds) {
      userAllowed = state.allowedUserIds.includes(resolvedUserId);
    } else if (resolvedUserId != null && state.scope === 'global') {
      userAllowed = state.isOpen; // global window open means allowed
    }

    console.log('GET upload window state:', { ...state, userAllowed });
    return NextResponse.json({ ...state, userAllowed });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Failed to get upload window state' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log('POST received data:', data); // Add logging
    
    // Validate the incoming data
    if (typeof data.isOpen !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid isOpen value' },
        { status: 400 }
      );
    }

    const scope = (data.scope === 'selective') ? 'selective' : 'global';
    if (data.isOpen && scope === 'selective') {
      if (!Array.isArray(data.userIds) || data.userIds.length === 0) {
        return NextResponse.json(
          { error: 'userIds array required when opening a selective window' },
          { status: 400 }
        );
      }
    }

    await ensureUploadWindowTable(); // Ensure table exists

    // Update the upload window state in the database
    const insertedId = await updateUploadWindowState({
      isOpen: data.isOpen,
      deadline: data.deadline || null,
      message: data.message || '',
      year: data.year || new Date().getFullYear().toString(),
      scope
    });

    if (!insertedId) {
      throw new Error('Failed to insert upload window state');
    }

    if (data.isOpen && scope === 'selective') {
      // Deduplicate & sanitize user IDs (numbers only)
  const parsedIds: number[] = (data.userIds as any[]).map(x => parseInt(x as any, 10)).filter(n => !isNaN(n));
  const uniqueIds: number[] = [...new Set(parsedIds)];
      if (uniqueIds.length === 0) {
        return NextResponse.json({ error: 'No valid userIds provided' }, { status: 400 });
      }
      await addUploadWindowUsers(insertedId, uniqueIds);
    }

    const updatedState = await getUploadWindowState();
    console.log('POST updated state:', updatedState); // Add logging
    return NextResponse.json(updatedState);
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Failed to update upload window state' },
      { status: 500 }
    );
  }
}
