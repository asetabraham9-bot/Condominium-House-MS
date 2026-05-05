<?php
include_once 'config/Database.php';

$database = new Database();
$db = $database->getConnection();

try {
    // 1. Add missing columns to applicant_details if they don't exist
    $columns = [
        'academic_level' => "VARCHAR(100)",
        'years_of_service' => "INT DEFAULT 0",
        'marital_status' => "VARCHAR(50)",
        'job_responsibility' => "VARCHAR(100)",
        'is_disabled' => "BOOLEAN DEFAULT FALSE",
        'score' => "INT DEFAULT 0",
        'application_id' => "INT NULL",
        'status' => "ENUM('pending', 'approved', 'rejected', 'lottery_won', 'placed') DEFAULT 'pending'"
    ];

    foreach ($columns as $col => $def) {
        $check = $db->query("SHOW COLUMNS FROM applicant_details LIKE '$col'");
        if ($check->rowCount() == 0) {
            $db->exec("ALTER TABLE applicant_details ADD $col $def");
            echo "Added column '$col' to applicant_details.<br>";
        } else {
            echo "Column '$col' already exists.<br>";
        }
    }

    // 2. Add foreign key for application_id if not exists
    try {
        $db->exec("ALTER TABLE applicant_details ADD FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE SET NULL");
        echo "Added foreign key for application_id.<br>";
    } catch (Exception $e) {
        // FK likely already exists
        echo "Foreign key note: " . $e->getMessage() . "<br>";
    }

    echo "Migration completed.";
} catch (Exception $e) {
    echo "Migration failed: " . $e->getMessage();
}
?>
