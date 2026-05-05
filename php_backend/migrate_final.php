<?php
include_once 'config/Database.php';

$database = new Database();
$db = $database->getConnection();

try {
    // 1. Ensure the applicant_details table matches EXACTLY
    // We will check for each column and add it if it's missing.
    // We already did this, but maybe the table was locked or something.
    
    $colsToAdd = [
        'staff_id' => "VARCHAR(50) NULL",
        'department' => "VARCHAR(100) NULL",
        'job_title' => "VARCHAR(100) NULL",
        'gender' => "ENUM('Male', 'Female') NULL",
        'academic_level' => "VARCHAR(100) NULL",
        'years_of_service' => "INT DEFAULT 0",
        'marital_status' => "VARCHAR(50) NULL",
        'job_responsibility' => "VARCHAR(100) NULL",
        'is_disabled' => "BOOLEAN DEFAULT FALSE",
        'score' => "INT DEFAULT 0",
        'application_id' => "INT NULL",
        'status' => "ENUM('pending', 'approved', 'rejected', 'lottery_won', 'placed') DEFAULT 'pending'"
    ];

    foreach ($colsToAdd as $col => $def) {
        $check = $db->query("SHOW COLUMNS FROM applicant_details LIKE '$col'");
        if ($check->rowCount() == 0) {
            $db->exec("ALTER TABLE applicant_details ADD `$col` $def");
            echo "Successfully added column: $col <br>";
        }
    }

    // 2. Clear any potential schema cache (unlikely to help with 1054 but good practice)
    $db->exec("FLUSH TABLES");

    echo "Aggressive migration completed.";
} catch (Exception $e) {
    echo "Aggressive migration failed: " . $e->getMessage();
}
?>
