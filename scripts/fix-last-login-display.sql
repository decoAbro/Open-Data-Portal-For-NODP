-- Script to verify and fix last_login display issues

-- Check if last_login column exists in users table
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'last_login';

-- Sample query to check last_login values
SELECT id, username, email, status, created_at, last_login
FROM users
ORDER BY id;

-- Update a sample last_login value for testing (uncomment to use)
-- UPDATE users SET last_login = GETDATE() WHERE username = 'punjab';

-- Check if any triggers might be affecting last_login updates
SELECT 
    name, 
    is_disabled
FROM sys.triggers
WHERE parent_id = OBJECT_ID('users');

-- Verify the login update query is working correctly
-- This is the query used in the login API to update last_login
-- UPDATE users SET last_login = GETDATE() WHERE id = @userId
