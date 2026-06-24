<?php
/**
 * One-time migration: add applicant house type preference columns.
 * Run from CLI: php php_backend/migrations/run_add_applicant_house_type.php
 */
include_once __DIR__ . '/../config/Database.php';

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    fwrite(STDERR, "Database connection failed.\n");
    exit(1);
}

function columnExists(PDO $db, string $table, string $column): bool {
    $stmt = $db->prepare(
        "SELECT COUNT(*) FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table AND COLUMN_NAME = :column"
    );
    $stmt->execute([':table' => $table, ':column' => $column]);
    return (int)$stmt->fetchColumn() > 0;
}

try {
    if (!columnExists($db, 'applicant_details', 'house_type')) {
        $db->exec("ALTER TABLE applicant_details ADD COLUMN house_type VARCHAR(100) NULL AFTER children_count");
        echo "Added column house_type\n";
    } else {
        echo "Column house_type already exists\n";
    }

    if (!columnExists($db, 'applicant_details', 'preferred_campus_id')) {
        $db->exec("ALTER TABLE applicant_details ADD COLUMN preferred_campus_id INT NULL AFTER house_type");
        echo "Added column preferred_campus_id\n";
    } else {
        echo "Column preferred_campus_id already exists\n";
    }

    $fkCheck = $db->query(
        "SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'applicant_details'
           AND CONSTRAINT_NAME = 'fk_applicant_details_preferred_campus'"
    )->fetchColumn();

    if ((int)$fkCheck === 0) {
        $db->exec(
            "ALTER TABLE applicant_details
             ADD CONSTRAINT fk_applicant_details_preferred_campus
               FOREIGN KEY (preferred_campus_id) REFERENCES campuses(id)
               ON UPDATE CASCADE ON DELETE SET NULL"
        );
        echo "Added foreign key fk_applicant_details_preferred_campus\n";
    } else {
        echo "Foreign key already exists\n";
    }

    echo "Migration complete.\n";
} catch (PDOException $e) {
    fwrite(STDERR, "Migration failed: " . $e->getMessage() . "\n");
    exit(1);
}
