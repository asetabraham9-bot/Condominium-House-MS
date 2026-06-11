<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: text/html; charset=UTF-8");

include_once '../config/Database.php';
$database = new Database();
$db = $database->getConnection();

if (!$db) {
    echo "Failed to connect to database.";
    exit();
}

try {
    // Check fields of payments table
    $stmt = $db->query("DESCRIBE payments");
    $fields = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    // Add columns if they do not exist
    if (!in_array('payment_type', $fields)) {
        $db->exec("ALTER TABLE payments ADD COLUMN payment_type ENUM('application_fee', 'residence_fee') NOT NULL DEFAULT 'residence_fee'");
        echo "Added payment_type.<br>";
    }
    if (!in_array('transaction_id', $fields)) {
        $db->exec("ALTER TABLE payments ADD COLUMN transaction_id VARCHAR(100) NULL");
        echo "Added transaction_id.<br>";
    }
    if (!in_array('screenshot_path', $fields)) {
        $db->exec("ALTER TABLE payments ADD COLUMN screenshot_path VARCHAR(255) NULL");
        echo "Added screenshot_path.<br>";
    }
    
    // Make reference_number nullable
    $db->exec("ALTER TABLE payments MODIFY COLUMN reference_number VARCHAR(120) NULL");
    echo "Modified reference_number to be NULL.<br>";
    
    echo "Database fix completed successfully.";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
