-- Optional upgrade for older `housing_system` databases.
-- Prefer re-importing `php_backend/housing_system.sql` when possible.
-- If any column already exists, remove that line and run again.

USE housing_system;

ALTER TABLE applications
  ADD COLUMN round_label VARCHAR(200) NULL AFTER title,
  ADD COLUMN monthly_payment DECIMAL(12,2) NULL AFTER house_details,
  ADD COLUMN application_fee DECIMAL(12,2) NULL AFTER monthly_payment,
  ADD COLUMN electricity_service VARCHAR(500) NULL AFTER application_fee,
  ADD COLUMN water_service VARCHAR(500) NULL AFTER electricity_service,
  ADD COLUMN house_type VARCHAR(100) NULL AFTER water_service,
  ADD COLUMN campus_id INT NULL AFTER house_type,
  ADD COLUMN block_id INT NULL AFTER campus_id,
  ADD COLUMN house_number VARCHAR(80) NULL AFTER block_id,
  ADD COLUMN bedrooms INT NULL AFTER house_number,
  ADD COLUMN bathrooms INT NULL AFTER bedrooms;

ALTER TABLE applications
  ADD CONSTRAINT fk_applications_campus
    FOREIGN KEY (campus_id) REFERENCES campuses(id)
    ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE applications
  ADD CONSTRAINT fk_applications_block
    FOREIGN KEY (block_id) REFERENCES blocks(id)
    ON UPDATE CASCADE ON DELETE SET NULL;
