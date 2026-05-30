
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP DATABASE IF EXISTS housing_system;
CREATE DATABASE housing_system
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE housing_system;

CREATE TABLE campuses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL UNIQUE,
  location VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(191) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone_number VARCHAR(30) NULL,
  role ENUM('applicant', 'campus_admin', 'system_admin', 'manager') NOT NULL DEFAULT 'applicant',
  campus_id INT NULL,
  notification_preferences TEXT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_campus
    FOREIGN KEY (campus_id) REFERENCES campuses(id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_campus ON users(campus_id);

CREATE TABLE applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NULL,
  round_label VARCHAR(200) NULL,
  description TEXT NULL,
  house_details TEXT NULL,
  monthly_payment DECIMAL(12,2) NULL,
  application_fee DECIMAL(12,2) NULL,
  electricity_service VARCHAR(500) NULL,
  water_service VARCHAR(500) NULL,
  house_type VARCHAR(100) NULL,
  campus_id INT NULL,
  block_id INT NULL,
  house_number VARCHAR(80) NULL,
  bedrooms INT NULL,
  bathrooms INT NULL,
  house_images TEXT NULL,
  deadline DATETIME NULL,
  status ENUM('open', 'closed') NOT NULL DEFAULT 'closed',
  user_id INT NULL,
  points DECIMAL(10,2) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_applications_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_applications_campus
    FOREIGN KEY (campus_id) REFERENCES campuses(id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_applications_status ON applications(status);

CREATE TABLE applicant_details (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  application_id INT NULL,
  gender ENUM('Male', 'Female') NULL,
  academic_level VARCHAR(100) NULL,
  years_of_service INT NOT NULL DEFAULT 0,
  marital_status ENUM('Single', 'Married', 'Divorced', 'Widowed') NULL,
  job_responsibility VARCHAR(150) NULL,
  is_disabled TINYINT(1) NOT NULL DEFAULT 0,
  disability_type VARCHAR(100) NULL,
  children_count INT NOT NULL DEFAULT 0,
  status ENUM('pending', 'approved', 'rejected', 'lottery_won', 'placed') NOT NULL DEFAULT 'pending',
  score DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_applicant_details_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_applicant_details_application
    FOREIGN KEY (application_id) REFERENCES applications(id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_applicant_status ON applicant_details(status);

CREATE TABLE blocks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  campus_id INT NOT NULL,
  name VARCHAR(120) NOT NULL,
  total_houses INT NOT NULL DEFAULT 0,
  occupied_houses INT NOT NULL DEFAULT 0,
  available_houses INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_blocks_campus
    FOREIGN KEY (campus_id) REFERENCES campuses(id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_blocks_campus ON blocks(campus_id);
CREATE UNIQUE INDEX uq_block_name_per_campus ON blocks(campus_id, name);

ALTER TABLE applications
  ADD CONSTRAINT fk_applications_block
    FOREIGN KEY (block_id) REFERENCES blocks(id)
    ON UPDATE CASCADE ON DELETE SET NULL;

CREATE TABLE houses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  block_id INT NOT NULL,
  house_number VARCHAR(80) NOT NULL,
  house_type VARCHAR(80) NULL,
  price DECIMAL(12,2) NULL,
  monthly_payment DECIMAL(12,2) NULL,
  location VARCHAR(255) NULL,
  bedrooms INT NULL,
  bathrooms INT NULL,
  electric_service VARCHAR(50) NOT NULL DEFAULT 'yes',
  water_service VARCHAR(50) NOT NULL DEFAULT 'yes',
  description TEXT NULL,
  status ENUM('available', 'occupied', 'maintenance') NOT NULL DEFAULT 'available',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_houses_block
    FOREIGN KEY (block_id) REFERENCES blocks(id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_houses_block ON houses(block_id);
CREATE INDEX idx_houses_status ON houses(status);
CREATE UNIQUE INDEX uq_house_number_per_block ON houses(block_id, house_number);

CREATE TABLE house_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  house_id INT NOT NULL,
  image_path VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_house_images_house
    FOREIGN KEY (house_id) REFERENCES houses(id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_house_images_house ON house_images(house_id);

CREATE TABLE residents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  applicant_id INT NULL,
  house_id INT NOT NULL,
  campus_id INT NOT NULL,
  assigned_date DATE NOT NULL,
  leave_date DATE NULL,
  status ENUM('active', 'leaving', 'left') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_residents_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_residents_applicant
    FOREIGN KEY (applicant_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_residents_house
    FOREIGN KEY (house_id) REFERENCES houses(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_residents_campus
    FOREIGN KEY (campus_id) REFERENCES campuses(id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE INDEX idx_residents_user ON residents(user_id);
CREATE INDEX idx_residents_campus_status ON residents(campus_id, status);

DELIMITER $$
CREATE TRIGGER trg_residents_before_insert
BEFORE INSERT ON residents
FOR EACH ROW
BEGIN
  IF NEW.applicant_id IS NULL THEN
    SET NEW.applicant_id = NEW.user_id;
  END IF;
END$$
DELIMITER ;

-- Status values used by resident_requests/update_status.php and submit_leave.php
CREATE TABLE resident_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  resident_id INT NOT NULL,
  campus_id INT NOT NULL,
  request_type VARCHAR(100) NOT NULL,
  priority ENUM('low', 'medium', 'high', 'urgent') NOT NULL DEFAULT 'medium',
  subject VARCHAR(200) NULL,
  description TEXT NOT NULL,
  status ENUM('pending', 'verified_by_campus_admin', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  leave_date DATE NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_requests_resident
    FOREIGN KEY (resident_id) REFERENCES residents(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_requests_campus
    FOREIGN KEY (campus_id) REFERENCES campuses(id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE INDEX idx_requests_campus_status ON resident_requests(campus_id, status);

CREATE TABLE payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  payment_method VARCHAR(80) NOT NULL,
  reference_number VARCHAR(120) NOT NULL,
  status ENUM('pending', 'verified', 'rejected') NOT NULL DEFAULT 'pending',
  payment_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  verified_by INT NULL,
  verified_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_payments_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_payments_verified_by
    FOREIGN KEY (verified_by) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_payments_user_status ON payments(user_id, status);
CREATE UNIQUE INDEX uq_payments_reference ON payments(reference_number);

CREATE TABLE reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uploader_id INT NOT NULL,
  campus_id INT NOT NULL,
  report_type VARCHAR(120) NOT NULL,
  description TEXT NOT NULL,
  file_path VARCHAR(255) NULL,
  generated_date DATE NULL,
  status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_reports_uploader
    FOREIGN KEY (uploader_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_reports_campus
    FOREIGN KEY (campus_id) REFERENCES campuses(id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sender_id INT NOT NULL,
  recipient_group ENUM('all_users', 'applicants_only', 'residents_only', 'individual') NOT NULL,
  recipient_id INT NULL,
  message TEXT NOT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notifications_sender
    FOREIGN KEY (sender_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_notifications_recipient
    FOREIGN KEY (recipient_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

-- Seed campuses (match Register dropdown labels; IDs 1-4 used by frontend)
INSERT INTO campuses (id, name, location) VALUES
  (1, 'Main', 'Main Campus'),
  (2, 'Techno', 'Techno Campus'),
  (3, 'Otona', 'Otona Campus'),
  (4, 'Tercha', 'Tercha Campus');

-- password for seed users: password
SET @pwd := '$2y$10$5f0Qh1jME5j6Q6pUr6l1euk9v2vR6j0dN4nO8H3E0iWm1Qx7lX9vO';

INSERT INTO users (first_name, last_name, email, password_hash, phone_number, role, campus_id) VALUES
  ('System', 'Admin', 'admin@wsu.edu', @pwd, '+251900000001', 'system_admin', NULL),
  ('Campus', 'Admin', 'campus@wsu.edu', @pwd, '+251900000002', 'campus_admin', 1),
  ('Applicant', 'User', 'applicant@wsu.edu', @pwd, '+251900000003', 'applicant', 1),
  ('System', 'Manager', 'manager@chms.wsu.edu', @pwd, '0935451235', 'manager', NULL);

INSERT INTO applications (
  title, round_label, description, house_details,
  monthly_payment, application_fee, electricity_service, water_service,
  house_type, campus_id, block_id, house_number, bedrooms, bathrooms,
  deadline, status
) VALUES (
  '2026 Housing Cycle',
  'Round 1',
  'Annual housing application cycle',
  'University condominium allocation',
  3500.00,
  500.00,
  'Three-phase supply to unit',
  'Municipal + backup tank',
  'Two Bedroom',
  1,
  NULL,
  'TBD',
  2,
  2,
  DATE_ADD(NOW(), INTERVAL 30 DAY),
  'open'
);

CREATE TABLE application_houses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  application_id INT NOT NULL,
  house_type VARCHAR(100) NOT NULL,
  campus_id INT NOT NULL,
  monthly_payment DECIMAL(12,2) NOT NULL,
  number_of_houses INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_app_houses_application
    FOREIGN KEY (application_id) REFERENCES applications(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_app_houses_campus
    FOREIGN KEY (campus_id) REFERENCES campuses(id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE inform_house_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  informer_id INT NOT NULL,
  campus_id INT NOT NULL,
  block VARCHAR(100) NOT NULL,
  house_type ENUM('Studio', 'one bed', 'two bed', 'three bed') NOT NULL,
  house_status ENUM('available', 'maintenance') NOT NULL,
  maintenance_description TEXT NULL,
  status ENUM('pending', 'resolved', 'rejected') NOT NULL DEFAULT 'pending',
  forwarded_to_admin TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_inform_requests_informer
    FOREIGN KEY (informer_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_inform_requests_campus
    FOREIGN KEY (campus_id) REFERENCES campuses(id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;
