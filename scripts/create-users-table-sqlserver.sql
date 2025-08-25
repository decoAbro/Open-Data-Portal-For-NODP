-- Create users table for SQL Server
-- This script creates the users table with all necessary fields for SQL Server

-- Check if table exists and create if it doesn't
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
END

-- Create indexes for better performance
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_users_username')
    CREATE INDEX idx_users_username ON users(username);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_users_email')
    CREATE INDEX idx_users_email ON users(email);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_users_status')
    CREATE INDEX idx_users_status ON users(status);

-- Insert sample users if they don't exist
IF NOT EXISTS (SELECT * FROM users WHERE username = 'piera')
BEGIN
    INSERT INTO users (username, email, password, status) VALUES
    ('piera', 'piera@pie.gov.pk', 'password123', 'active'),
    ('punjab', 'punjab@pie.gov.pk', 'password123', 'active'),
    ('sindh', 'sindh@pie.gov.pk', 'password123', 'active'),
    ('kpk', 'kpk@pie.gov.pk', 'password123', 'active'),
    ('balochistan', 'balochistan@pie.gov.pk', 'password123', 'active');
END

-- Create trigger to automatically update updated_at column
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

PRINT 'Users table and related objects created successfully for SQL Server';
