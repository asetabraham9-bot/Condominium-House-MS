<?php
include_once 'config/Database.php';

$database = new Database();
$db = $database->getConnection();

try {
    // 1. Add house_details to applications table
    $query = "ALTER TABLE applications ADD COLUMN house_details TEXT NULL AFTER description";
    $db->exec($query);
    echo "Added house_details to applications table.<br>";
} catch (Exception $e) {
    echo "Note: Column house_details might already exist or transition error: " . $e->getMessage() . "<br>";
}

echo "Database updated.";
?>
