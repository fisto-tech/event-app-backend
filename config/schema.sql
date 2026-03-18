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


ALTER TABLE customers
  ADD COLUMN sms_sent       TINYINT(1) NOT NULL DEFAULT 0  COMMENT '1 = SMS send was requested',
  ADD COLUMN sms_delivered  TINYINT(1) NOT NULL DEFAULT 0  COMMENT '1 = SMS delivered confirmed',
  ADD COLUMN wa_sent        TINYINT(1) NOT NULL DEFAULT 0  COMMENT '1 = WhatsApp send was requested',
  ADD COLUMN wa_delivered   TINYINT(1) NOT NULL DEFAULT 0  COMMENT '1 = WhatsApp delivered confirmed';


CREATE TABLE IF NOT EXISTS followup_logs (
  id                INT(11)       NOT NULL AUTO_INCREMENT,
  customer_id       INT(11)       NOT NULL,
  -- Contact person captured at time of followup
  contact_name      VARCHAR(255)  NOT NULL,
  contact_designation VARCHAR(255) DEFAULT NULL,
  contact_phone     VARCHAR(20)   NOT NULL,
  contact_email     VARCHAR(255)  DEFAULT NULL,
  -- Stage at the time of this followup entry
  followup_stage    ENUM('first_followup','proposal','lead','confirm') NOT NULL DEFAULT 'first_followup',
  remarks           TEXT          DEFAULT NULL,
  -- When the NEXT follow-up should happen (set by employee)
  next_followup_date DATE         DEFAULT NULL,
  -- Share flags (only relevant for proposal stage; locked once saved=1)
  share_whatsapp    TINYINT(1)    NOT NULL DEFAULT 0,
  share_email       TINYINT(1)    NOT NULL DEFAULT 0,
  shares_locked     TINYINT(1)    NOT NULL DEFAULT 0,  -- set to 1 on first save with share flags
  -- Meta
  employee_id       INT(11)       NOT NULL,
  created_at        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_customer_id      (customer_id),
  KEY idx_next_followup    (next_followup_date),
  KEY idx_followup_stage   (followup_stage),
  KEY idx_employee_id      (employee_id),
  CONSTRAINT fk_fl_customer  FOREIGN KEY (customer_id)  REFERENCES customers (id) ON DELETE CASCADE,
  CONSTRAINT fk_fl_employee  FOREIGN KEY (employee_id)  REFERENCES employees (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Add current_stage to customers so the main listing always shows
--    the latest stage without a JOIN on followup_logs.
ALTER TABLE customers
  ADD COLUMN current_stage
    ENUM('first_followup','proposal','lead','confirm')
    NOT NULL DEFAULT 'first_followup'
    AFTER followup_date;

-- ─── Indexes that help the main queries ──────────────────────────────────────
-- Fetch customers due on a date for a given stage
CREATE INDEX idx_customers_stage_followup
  ON customers (current_stage, followup_date);


-- ──────────────────────────────────────────────────────────────────────────────
-- DATABASE SCHEMA UPDATES
-- ──────────────────────────────────────────────────────────────────────────────

-- ─── 1. SOURCES TABLE (for "Others" entries in expo dropdown) ───────────────────
CREATE TABLE IF NOT EXISTS sources (
  id INT AUTO_INCREMENT PRIMARY KEY,
  source_name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── 2. ADD NEW CUSTOMER FIELDS ────────────────────────────────────────────────
-- Add mobile_no_2, email_2, and website to customers table (if not already present)
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS mobile_no_2 VARCHAR(20),
ADD COLUMN IF NOT EXISTS email_2 VARCHAR(255),
ADD COLUMN IF NOT EXISTS website VARCHAR(255);

-- ─── 3. CUSTOMIZABLE TEMPLATES STRUCTURE ──────────────────────────────────────
-- Modify SMS Templates to be customizable per expo/enquiry_type
CREATE TABLE IF NOT EXISTS sms_templates_custom (
  id INT AUTO_INCREMENT PRIMARY KEY,
  template_id INT,
  expo_id INT,
  enquiry_type_id INT,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  is_general TINYINT(1) DEFAULT 0 COMMENT '1 = This is a general template available to all',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (template_id) REFERENCES sms_templates(id) ON DELETE CASCADE,
  FOREIGN KEY (expo_id) REFERENCES expo_master(id) ON DELETE CASCADE,
  KEY idx_expo_enquiry (expo_id, enquiry_type_id),
  KEY idx_general (is_general)
);

-- WhatsApp Templates - customizable per expo/enquiry_type
CREATE TABLE IF NOT EXISTS whatsapp_templates_custom (
  id INT AUTO_INCREMENT PRIMARY KEY,
  template_id INT,
  expo_id INT,
  enquiry_type_id INT,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  is_general TINYINT(1) DEFAULT 0 COMMENT '1 = This is a general template available to all',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (template_id) REFERENCES whatsapp_templates(id) ON DELETE CASCADE,
  FOREIGN KEY (expo_id) REFERENCES expo_master(id) ON DELETE CASCADE,
  KEY idx_expo_enquiry (expo_id, enquiry_type_id),
  KEY idx_general (is_general)
);

-- Email Templates - customizable per expo/enquiry_type
CREATE TABLE IF NOT EXISTS email_templates_custom (
  id INT AUTO_INCREMENT PRIMARY KEY,
  template_id INT,
  expo_id INT,
  enquiry_type_id INT,
  title VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  is_general TINYINT(1) DEFAULT 0 COMMENT '1 = This is a general template available to all',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (template_id) REFERENCES email_templates(id) ON DELETE CASCADE,
  FOREIGN KEY (expo_id) REFERENCES expo_master(id) ON DELETE CASCADE,
  KEY idx_expo_enquiry (expo_id, enquiry_type_id),
  KEY idx_general (is_general)
);

-- Industry Types - customizable per expo/enquiry_type
CREATE TABLE IF NOT EXISTS industry_types_custom (
  id INT AUTO_INCREMENT PRIMARY KEY,
  industry_type_id INT,
  expo_id INT,
  enquiry_type_id INT,
  name VARCHAR(255) NOT NULL,
  is_general TINYINT(1) DEFAULT 0 COMMENT '1 = This is a general industry type available to all',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (industry_type_id) REFERENCES industry_types(id) ON DELETE CASCADE,
  FOREIGN KEY (expo_id) REFERENCES expo_master(id) ON DELETE CASCADE,
  KEY idx_expo_enquiry (expo_id, enquiry_type_id),
  KEY idx_general (is_general)
);

-- ─── 4. ALTER ENQUIRY_TYPES TABLE TO ADD ID ──────────────────────────────────
-- (Ensure enquiry_types has id column for foreign key relationships)
-- The table already has id from the original schema, this is just for reference

-- ─── 5. SAMPLE DATA FOR SOURCES ───────────────────────────────────────────────
-- Insert sample sources (these come from "Others" entries by users)
INSERT INTO sources (source_name) VALUES 
('LinkedIn Conference'),
('Trade Show'),
('Referral'),
('Cold Call'),
('Email Campaign')
ON DUPLICATE KEY UPDATE id=id;

ALTER TABLE expo_master
  ADD COLUMN is_current TINYINT(1) NOT NULL DEFAULT 0
    COMMENT '1 = this is the globally selected current expo for all users';


ALTER TABLE customers
  ADD COLUMN additional_contacts JSON DEFAULT NULL
    COMMENT 'JSON array of {name, designation, phone, phone_2, email} objects';

 
ALTER TABLE expo_master
ADD COLUMN conduct_dates JSON DEFAULT NULL
  COMMENT 'JSON array of date strings ["YYYY-MM-DD", ...] for dates this expo is conducted',
ADD COLUMN remarks TEXT DEFAULT NULL
  COMMENT 'Optional notes/remarks about the expo';