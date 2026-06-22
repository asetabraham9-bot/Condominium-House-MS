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
    // Check fields of reports table
    $stmt = $db->query("DESCRIBE reports");
    $fields = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo "Current reports columns: " . implode(', ', $fields) . "<br><br>";
    
    // Add admin_feedback if missing
    if (!in_array('admin_feedback', $fields)) {
        $db->exec("ALTER TABLE reports ADD COLUMN admin_feedback TEXT NULL AFTER status");
        echo "Added admin_feedback column.<br>";
    } else {
        echo "admin_feedback column already exists.<br>";
    }
    
    echo "<br>Reports table fix completed successfully.";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
