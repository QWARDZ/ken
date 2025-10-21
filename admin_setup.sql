-- Admin table setup for Organizations System

USE org;

-- Create admin table for admin users
CREATE TABLE IF NOT EXISTS admin_users (
    admin_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Add indexes for faster lookups
CREATE INDEX idx_admin_email ON admin_users(email);
CREATE INDEX idx_admin_username ON admin_users(username);

-- Insert a default admin account
-- Default credentials: username: admin, password: admin123
-- Password is hashed with bcrypt (10 rounds): admin123
INSERT INTO admin_users (username, email, password, full_name, role) 
VALUES ('admin', 'admin@organization.com', '$2a$10$CwTycUXWue0Thq9StjUM0uJ8.8UiQC1jK8jJK1Y2TjLLBvZBKGG8m', 'System Administrator', 'admin')
ON DUPLICATE KEY UPDATE admin_id=admin_id;

-- Check admin users
SELECT * FROM admin_users;
