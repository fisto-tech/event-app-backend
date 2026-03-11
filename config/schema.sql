-- Expo CRM Database Schema
-- Run this file to initialize the database

CREATE DATABASE IF NOT EXISTS expo_crm;
USE expo_crm;

-- Employees Table
CREATE TABLE IF NOT EXISTS employees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role ENUM('admin', 'employee') DEFAULT 'employee',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Expo Master Table
CREATE TABLE IF NOT EXISTS expo_master (
  id INT AUTO_INCREMENT PRIMARY KEY,
  expo_name VARCHAR(255) NOT NULL,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enquiry Types Table
CREATE TABLE IF NOT EXISTS enquiry_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Industry Types Table
CREATE TABLE IF NOT EXISTS industry_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SMS Templates Table
CREATE TABLE IF NOT EXISTS sms_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- WhatsApp Templates Table
CREATE TABLE IF NOT EXISTS whatsapp_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Email Templates Table
CREATE TABLE IF NOT EXISTS email_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customers Table
CREATE TABLE IF NOT EXISTS customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  expo_id INT,
  expo_name VARCHAR(255),
  company_name VARCHAR(255) NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  designation VARCHAR(255),
  phone_number VARCHAR(20) NOT NULL,
  enquiry_type VARCHAR(255),
  email VARCHAR(255),
  location VARCHAR(255),
  city VARCHAR(255),
  industry_type VARCHAR(255),
  followup_date DATE,
  remarks TEXT,
  employee_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL
);

-- Insert default admin user (password: admin123)
INSERT INTO employees (name, username, password_hash, phone, role) VALUES 
('Admin User', 'admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '9999999999', 'admin')
ON DUPLICATE KEY UPDATE id=id;

-- Insert default enquiry types
INSERT INTO enquiry_types (name) VALUES 
('Website'), ('Web App'), ('Android App'), ('Customised Software'), ('ERP'), ('CRM'), ('Other')
ON DUPLICATE KEY UPDATE id=id;

-- Insert default industry types
INSERT INTO industry_types (name) VALUES 
('Agriculture'), ('Adhesives'), ('Packaging'), ('Manufacturing'), ('Education'), ('Retail'), ('IT'), ('Healthcare'), ('Other')
ON DUPLICATE KEY UPDATE id=id;

-- Insert sample expo
INSERT INTO expo_master (expo_name, status) VALUES 
('Tech Expo 2025', 'active'),
('Business Summit 2025', 'active')
ON DUPLICATE KEY UPDATE id=id;
