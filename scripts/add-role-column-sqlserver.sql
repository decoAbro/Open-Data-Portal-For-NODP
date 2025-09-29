-- Migration: Add role column to users table (SQL Server)
-- Safe to run multiple times.
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'role')
BEGIN
    ALTER TABLE users ADD role NVARCHAR(30) CONSTRAINT df_users_role DEFAULT 'user';
END

-- Backfill any NULL roles
UPDATE users SET role = 'user' WHERE role IS NULL;

-- Optional index
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_users_role' AND object_id = OBJECT_ID('users'))
    CREATE INDEX idx_users_role ON users(role);
