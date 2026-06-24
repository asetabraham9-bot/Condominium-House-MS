-- Run once on existing databases to store applicant house type preferences.
ALTER TABLE applicant_details
  ADD COLUMN house_type VARCHAR(100) NULL AFTER children_count;

ALTER TABLE applicant_details
  ADD COLUMN preferred_campus_id INT NULL AFTER house_type;

ALTER TABLE applicant_details
  ADD CONSTRAINT fk_applicant_details_preferred_campus
    FOREIGN KEY (preferred_campus_id) REFERENCES campuses(id)
    ON UPDATE CASCADE ON DELETE SET NULL;
