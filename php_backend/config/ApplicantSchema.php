<?php

function applicantColumnExists(PDO $db, string $column): bool
{
    $stmt = $db->prepare(
        "SELECT COUNT(*) FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'applicant_details'
           AND COLUMN_NAME = :column"
    );
    $stmt->execute([':column' => $column]);
    return (int)$stmt->fetchColumn() > 0;
}

function applicantConstraintExists(PDO $db, string $constraintName): bool
{
    $stmt = $db->prepare(
        "SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'applicant_details'
           AND CONSTRAINT_NAME = :name"
    );
    $stmt->execute([':name' => $constraintName]);
    return (int)$stmt->fetchColumn() > 0;
}

/**
 * Ensure applicant_details has house preference columns used by apply/read APIs.
 */
function ensureApplicantSchema(PDO $db): void
{
    if (!applicantColumnExists($db, 'house_type')) {
        $db->exec(
            "ALTER TABLE applicant_details
             ADD COLUMN house_type VARCHAR(100) NULL AFTER children_count"
        );
    }

    if (!applicantColumnExists($db, 'preferred_campus_id')) {
        $db->exec(
            "ALTER TABLE applicant_details
             ADD COLUMN preferred_campus_id INT NULL AFTER house_type"
        );
    }

    if (
        applicantColumnExists($db, 'preferred_campus_id') &&
        !applicantConstraintExists($db, 'fk_applicant_details_preferred_campus')
    ) {
        try {
            $db->exec(
                "ALTER TABLE applicant_details
                 ADD CONSTRAINT fk_applicant_details_preferred_campus
                   FOREIGN KEY (preferred_campus_id) REFERENCES campuses(id)
                   ON UPDATE CASCADE ON DELETE SET NULL"
            );
        } catch (PDOException $e) {
            // Non-fatal: column still works without FK if campuses/data conflict.
        }
    }
}
