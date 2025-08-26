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
          [lastUpdated] [datetime] NOT NULL
        )
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
        isOpen,
        deadline,
        message,
        year,
        lastUpdated
      FROM UploadWindow
      ORDER BY lastUpdated DESC
    `;
    
    if (result.recordset[0]) {
      const record = result.recordset[0];
      return {
        isOpen: record.isOpen,
        deadline: record.deadline ? record.deadline.toISOString() : null,
        message: record.message,
        year: record.year,
        lastUpdated: record.lastUpdated.toISOString()
      };
    }
    
    return { 
      isOpen: false, 
      deadline: null, 
      message: null, 
      year: null,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting upload window state:', error);
    return { 
      isOpen: false, 
      deadline: null, 
      message: null, 
      year: null,
      lastUpdated: new Date().toISOString()
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
}) {
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
    
    await request.query(`
      INSERT INTO UploadWindow (isOpen, deadline, message, year, lastUpdated)
      VALUES (@isOpen, @deadline, @message, @year, GETDATE())
    `);
    
    return true;
  } catch (error) {
    console.error('Error updating upload window state:', error);
    return false;
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}
