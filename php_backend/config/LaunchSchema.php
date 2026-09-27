<?php

function ensureLaunchSchema(PDO $db): void
{
    $db->exec(
        "CREATE TABLE IF NOT EXISTS application_houses (
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
        ) ENGINE=InnoDB"
    );

    $db->exec(
        "CREATE TABLE IF NOT EXISTS application_cycle_houses (
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
        ) ENGINE=InnoDB"
    );
}

function normalizeDeadlineForMysql(string $deadline): string
{
    $deadline = trim(str_replace('T', ' ', $deadline));
    if ($deadline === '') {
        return $deadline;
    }
    if (preg_match('/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/', $deadline)) {
        return $deadline . ':00';
    }
    return $deadline;
}
