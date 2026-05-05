<?php
include_once 'config/Database.php';
$database = new Database();
$db = $database->getConnection();

$q = $db->query("DESCRIBE applicant_details");
$cols = $q->fetchAll(PDO::FETCH_COLUMN);
echo "Columns in applicant_details: " . implode(", ", $cols);
?>
