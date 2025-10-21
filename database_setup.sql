-- Database setup for Organizations System
-- Make sure to create the database first: CREATE DATABASE IF NOT EXISTS org;

USE org;

-- Create student_info table with proper structure for authentication
CREATE TABLE IF NOT EXISTS student_info (
    stud_id INT AUTO_INCREMENT PRIMARY KEY,
    lastname VARCHAR(100) NOT NULL,
    firstname VARCHAR(100) NOT NULL,
    id_number VARCHAR(50) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Add index for faster email lookups
CREATE INDEX idx_email ON student_info(email);

-- Sample query to check existing data
-- SELECT * FROM student_info;

-- If you need to update existing passwords to be hashed, you'll need to reset them
-- DELETE FROM student_info; -- Use with caution!
