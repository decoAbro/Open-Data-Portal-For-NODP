-- Complete Users Table Structure for SQL Server
-- This script creates or updates the users table with all recommended columns

-- Drop table if you want to recreate it completely (CAUTION: This will delete all data)
-- DROP TABLE IF EXISTS users;

-- Create the users table with complete structure
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='users' AND xtype='U')
BEGIN
    CREATE TABLE users (
        id INT IDENTITY(1,1) PRIMARY KEY,
        username NVARCHAR(50) UNIQUE NOT NULL,
        email NVARCHAR(100) UNIQUE NOT NULL,
        password NVARCHAR(255) NOT NULL,
        status NVARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE(),
        last_login DATETIME2 NULL
    );
    PRINT 'Users table created successfully';
END
ELSE
BEGIN
    PRINT 'Users table already exists. Checking for missing columns...';
    
    -- Add missing columns if they don't exist
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'last_login')
    BEGIN
        ALTER TABLE users ADD last_login DATETIME2 NULL;
        PRINT 'Added last_login column';
    END
    
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'updated_at')
    BEGIN
        ALTER TABLE users ADD updated_at DATETIME2 DEFAULT GETDATE();
        PRINT 'Added updated_at column';
    END
    
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'status')
    BEGIN
        ALTER TABLE users ADD status NVARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive'));
        PRINT 'Added status column';
    END
END

-- Create indexes for better performance
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_users_username' AND object_id = OBJECT_ID('users'))
    CREATE INDEX idx_users_username ON users(username);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_users_email' AND object_id = OBJECT_ID('users'))
    CREATE INDEX idx_users_email ON users(email);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_users_status' AND object_id = OBJECT_ID('users'))
    CREATE INDEX idx_users_status ON users(status);

-- Create or update trigger for automatic updated_at timestamp
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'tr_users_updated_at')
    DROP TRIGGER tr_users_updated_at;

GO

CREATE TRIGGER tr_users_updated_at
ON users
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE users 
    SET updated_at = GETDATE()
    FROM users u
    INNER JOIN inserted i ON u.id = i.id;
END

GO

-- Insert sample users if table is empty
IF (SELECT COUNT(*) FROM users) = 0
BEGIN
    INSERT INTO users (username, email, password, status) VALUES
    ('admin', 'admin@pie.gov.pk', 'admin123', 'active'),
    ('piera', 'piera@pie.gov.pk', 'password123', 'active'),
    ('punjab', 'punjab@pie.gov.pk', 'password123', 'active'),
    ('sindh', 'sindh@pie.gov.pk', 'password123', 'active'),
    ('kpk', 'kpk@pie.gov.pk', 'password123', 'active'),
    ('balochistan', 'balochistan@pie.gov.pk', 'password123', 'active');
    
    PRINT 'Sample users inserted';
END

-- Show final table structure
PRINT 'Final table structure:';
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'users'
ORDER BY ORDINAL_POSITION;

-- Show current data
PRINT 'Current users in table:';
SELECT id, username, email, status, created_at, updated_at, last_login FROM users;

PRINT 'Users table setup completed successfully!';
