<?php
include_once '../config/Database.php';

$database = new Database();
$db = $database->getConnection();

try {
    $db->exec("ALTER TABLE houses ADD COLUMN electric_service TINYINT(1) DEFAULT 0, ADD COLUMN water_service TINYINT(1) DEFAULT 0;");
    echo "Successfully added electric_service and water_service to houses table.\n";
} catch (Exception $e) {
    echo "Error or columns already exist: " . $e->getMessage() . "\n";
}
?>
