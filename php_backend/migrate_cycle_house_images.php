<?php
/**
 * Run once: adds house_images JSON column to applications (admin-launched rounds).
 */
include_once 'config/Database.php';

$database = new Database();
$db = $database->getConnection();

try {
    $db->exec(
        'ALTER TABLE applications ADD COLUMN house_images TEXT NULL AFTER bathrooms'
    );
    echo 'Added applications.house_images column.<br>';
} catch (Exception $e) {
    echo 'Note: house_images may already exist: ' . htmlspecialchars($e->getMessage()) . '<br>';
}

echo 'Done.';
