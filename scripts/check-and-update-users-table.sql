-- Check current table structure
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'users'
ORDER BY ORDINAL_POSITION;

-- Check if last_login column exists and add it if it doesn't
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'last_login'
)
BEGIN
    ALTER TABLE users ADD last_login DATETIME2 NULL;
    PRINT 'Added last_login column to users table';
END
ELSE
BEGIN
    PRINT 'last_login column already exists';
END

-- Check if updated_at column exists and add it if it doesn't
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'updated_at'
)
BEGIN
    ALTER TABLE users ADD updated_at DATETIME2 NULL;
    PRINT 'Added updated_at column to users table';
END
ELSE
BEGIN
    PRINT 'updated_at column already exists';
END

-- Show final table structure
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'users'
ORDER BY ORDINAL_POSITION;

-- Show sample data
SELECT TOP 5 * FROM users;
