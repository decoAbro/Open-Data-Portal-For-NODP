import sql from 'mssql';

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER || '',
  database: process.env.DB_NAME,
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};

// Create the upload window table if it doesn't exist
export async function ensureUploadWindowTable() {
  let pool: sql.ConnectionPool | undefined;
  try {
    pool = await new sql.ConnectionPool(config).connect();
    
    const createTableQuery = `
      IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[UploadWindow]') AND type in (N'U'))
      BEGIN
        CREATE TABLE [dbo].[UploadWindow] (
          [id] [int] IDENTITY(1,1) PRIMARY KEY,
          [isOpen] [bit] NOT NULL,
          [deadline] [datetime] NULL,
          [message] [nvarchar](500) NULL,
          [year] [nvarchar](4) NULL,
          [lastUpdated] [datetime] NOT NULL,
          [scope] [nvarchar](20) NOT NULL DEFAULT 'global'
        )
      END
      -- Add scope column if table exists but column missing
      IF COL_LENGTH('dbo.UploadWindow', 'scope') IS NULL
      BEGIN
        ALTER TABLE dbo.UploadWindow ADD [scope] [nvarchar](20) NOT NULL CONSTRAINT DF_UploadWindow_Scope DEFAULT 'global'
      END
      -- Create mapping table for selective windows
      IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[UploadWindowUser]') AND type in (N'U'))
      BEGIN
        CREATE TABLE [dbo].[UploadWindowUser] (
          [id] [int] IDENTITY(1,1) PRIMARY KEY,
          [uploadWindowId] [int] NOT NULL,
          [userId] [int] NOT NULL,
          CONSTRAINT FK_UploadWindowUser_Window FOREIGN KEY (uploadWindowId) REFERENCES UploadWindow(id) ON DELETE CASCADE,
          CONSTRAINT UQ_UploadWindowUser UNIQUE (uploadWindowId, userId)
        );
        CREATE INDEX IX_UploadWindowUser_User ON UploadWindowUser(userId);
      END
    `;

    await pool.request().query(createTableQuery);
  } catch (error) {
    console.error('Error ensuring upload window table exists:', error);
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

// Get current upload window state
export async function getUploadWindowState() {
  let pool: sql.ConnectionPool | undefined;
  try {
    pool = await new sql.ConnectionPool(config).connect();
    
    const result = await pool.request().query`
      SELECT TOP 1 
        id,
        isOpen,
        deadline,
        message,
        year,
        lastUpdated,
        scope
      FROM UploadWindow
      ORDER BY lastUpdated DESC
    `;
    
    if (result.recordset[0]) {
      const record = result.recordset[0];
      // If selective, fetch associated users
      let allowedUserIds: number[] | undefined = undefined;
      if (record.scope === 'selective') {
        const usersRes = await pool.request().query`SELECT userId FROM UploadWindowUser WHERE uploadWindowId = ${record.id}`;
        allowedUserIds = usersRes.recordset.map((r: any) => r.userId);
      }
      return {
        id: record.id,
        isOpen: record.isOpen,
        deadline: record.deadline ? record.deadline.toISOString() : null,
        message: record.message,
        year: record.year,
        lastUpdated: record.lastUpdated.toISOString(),
        scope: record.scope || 'global',
        allowedUserIds
      };
    }
    
    return { 
      isOpen: false, 
      deadline: null, 
      message: null, 
      year: null,
      lastUpdated: new Date().toISOString(),
      scope: 'global'
    };
  } catch (error) {
    console.error('Error getting upload window state:', error);
    return { 
      isOpen: false, 
      deadline: null, 
      message: null, 
      year: null,
      lastUpdated: new Date().toISOString(),
      scope: 'global'
    };
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

// Update upload window state
export async function updateUploadWindowState(state: {
  isOpen: boolean;
  deadline?: string | null;
  message?: string;
  year?: string;
  scope?: 'global' | 'selective';
}): Promise<number | undefined> {
  let pool: sql.ConnectionPool | undefined;
  try {
    pool = await new sql.ConnectionPool(config).connect();
    
    // Convert deadline string to Date object if it exists
    const deadlineDate = state.deadline ? new Date(state.deadline) : null;
    
    // Use request to properly handle parameter types
    const request = pool.request();
    request.input('isOpen', sql.Bit, state.isOpen);
    request.input('deadline', sql.DateTime, deadlineDate);
    request.input('message', sql.NVarChar(500), state.message || '');
    request.input('year', sql.NVarChar(4), state.year || '');
    request.input('scope', sql.NVarChar(20), state.scope || 'global');
    
    const result = await request.query(`
      INSERT INTO UploadWindow (isOpen, deadline, message, year, lastUpdated, scope)
      OUTPUT INSERTED.id
      VALUES (@isOpen, @deadline, @message, @year, GETDATE(), @scope)
    `);
    return result.recordset[0]?.id;
  } catch (error) {
    console.error('Error updating upload window state:', error);
    return undefined;
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

// Add users for a selective upload window
export async function addUploadWindowUsers(uploadWindowId: number, userIds: number[]) {
  if (!userIds || userIds.length === 0) return;
  let pool: sql.ConnectionPool | undefined;
  try {
    pool = await new sql.ConnectionPool(config).connect();
    const table = new sql.Table('UploadWindowUser');
    table.columns.add('uploadWindowId', sql.Int, { nullable: false });
    table.columns.add('userId', sql.Int, { nullable: false });
    userIds.forEach(id => table.rows.add(uploadWindowId, id));
    const request = pool.request();
    await request.bulk(table);
  } catch (error) {
    console.error('Error adding users to upload window:', error);
  } finally {
    if (pool) await pool.close();
  }
}
