-- Create users table for the National Open Data Portal
-- This script creates the users table with all necessary fields

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Insert some sample users (optional)
INSERT INTO users (username, email, password, status) VALUES
('piera', 'piera@pie.gov.pk', 'password123', 'active'),
('punjab', 'punjab@pie.gov.pk', 'password123', 'active'),
('sindh', 'sindh@pie.gov.pk', 'password123', 'active'),
('kpk', 'kpk@pie.gov.pk', 'password123', 'active'),
('balochistan', 'balochistan@pie.gov.pk', 'password123', 'active')
ON CONFLICT (username) DO NOTHING;

-- Update trigger to automatically set updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
