-- Create password_reset_requests table for tracking password reset requests
-- This table stores requests from users who forgot their passwords

-- Check if table exists and create if it doesn't
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='password_reset_requests' AND xtype='U')
BEGIN
    CREATE TABLE password_reset_requests (
        id INT IDENTITY(1,1) PRIMARY KEY,
        username NVARCHAR(50) NOT NULL,
        email NVARCHAR(100) NOT NULL,
        request_date DATETIME2 DEFAULT GETDATE(),
        status NVARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
        admin_notes NVARCHAR(500) NULL,
        completed_date DATETIME2 NULL,
        created_at DATETIME2 DEFAULT GETDATE()
    );
    
    PRINT 'Password reset requests table created successfully';
END
ELSE
BEGIN
    PRINT 'Password reset requests table already exists';
END

-- Create indexes for better performance
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_password_reset_username' AND object_id = OBJECT_ID('password_reset_requests'))
    CREATE INDEX idx_password_reset_username ON password_reset_requests(username);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_password_reset_status' AND object_id = OBJECT_ID('password_reset_requests'))
    CREATE INDEX idx_password_reset_status ON password_reset_requests(status);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_password_reset_date' AND object_id = OBJECT_ID('password_reset_requests'))
    CREATE INDEX idx_password_reset_date ON password_reset_requests(request_date);

-- Show table structure
PRINT 'Password reset requests table structure:';
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'password_reset_requests'
ORDER BY ORDINAL_POSITION;

PRINT 'Password reset requests table setup completed successfully!';
