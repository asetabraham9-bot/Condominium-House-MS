<?php
/**
 * One-time migration: add applicant house type preference columns.
 * Run from CLI: php php_backend/migrations/run_add_applicant_house_type.php
 */
include_once __DIR__ . '/../config/Database.php';
include_once __DIR__ . '/../config/ApplicantSchema.php';

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    fwrite(STDERR, "Database connection failed.\n");
    exit(1);
}

try {
    ensureApplicantSchema($db);
    echo "Migration complete.\n";
} catch (PDOException $e) {
    fwrite(STDERR, "Migration failed: " . $e->getMessage() . "\n");
    exit(1);
}
