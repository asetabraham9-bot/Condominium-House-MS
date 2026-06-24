-- Links specific inventory houses to a launched application cycle.
CREATE TABLE IF NOT EXISTS application_cycle_houses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  application_id INT NOT NULL,
  house_id INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_application_cycle_house (application_id, house_id),
  CONSTRAINT fk_cycle_houses_application
    FOREIGN KEY (application_id) REFERENCES applications(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_cycle_houses_house
    FOREIGN KEY (house_id) REFERENCES houses(id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;
