<?php
include_once 'config/Database.php';

$database = new Database();
$db = $database->getConnection();

try {
    // 1. Update houses table with new attributes
    $newColumns = [
        'house_type' => "VARCHAR(50) NULL",
        'price' => "DECIMAL(10, 2) DEFAULT 0.00",
        'monthly_payment' => "DECIMAL(10, 2) DEFAULT 0.00",
        'location' => "VARCHAR(255) NULL",
        'bedrooms' => "INT DEFAULT 0",
        'bathrooms' => "INT DEFAULT 0",
        'description' => "TEXT NULL"
    ];

    foreach ($newColumns as $col => $def) {
        $check = $db->query("SHOW COLUMNS FROM houses LIKE '$col'");
        if ($check->rowCount() == 0) {
            $db->exec("ALTER TABLE houses ADD `$col` $def");
            echo "Added column '$col' to houses.<br>";
        }
    }

    echo "House table migration completed successfully.";
} catch (Exception $e) {
    echo "Migration failed: " . $e->getMessage();
}
?>
