-- Migration: Add role column to users table (PostgreSQL)
-- Safe to run multiple times.
ALTER TABLE users
ADD COLUMN IF NOT EXISTS role VARCHAR(30) DEFAULT 'user';

-- Optional: backfill nulls
UPDATE users SET role = 'user' WHERE role IS NULL;

-- Create index (optional for filtering)
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
