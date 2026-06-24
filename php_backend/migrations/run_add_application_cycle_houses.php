<?php
/**
 * One-time migration for application_cycle_houses table.
 * Run: php php_backend/migrations/run_add_application_cycle_houses.php
 */
include_once __DIR__ . '/../config/Database.php';

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    fwrite(STDERR, "Database connection failed.\n");
    exit(1);
}

$sql = file_get_contents(__DIR__ . '/add_application_cycle_houses.sql');
if ($sql === false) {
    fwrite(STDERR, "Could not read migration SQL file.\n");
    exit(1);
}

try {
    $db->exec($sql);
    echo "application_cycle_houses migration complete.\n";
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'already exists') !== false) {
        echo "application_cycle_houses table already exists.\n";
        exit(0);
    }
    fwrite(STDERR, "Migration failed: " . $e->getMessage() . "\n");
    exit(1);
}
