-- Create notifications table for in-app notifications
CREATE TABLE notifications (
  id INT IDENTITY(1,1) PRIMARY KEY,
  user_id NVARCHAR(255) NOT NULL,
  message NVARCHAR(1000) NOT NULL,
  is_read BIT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT GETDATE()
);
