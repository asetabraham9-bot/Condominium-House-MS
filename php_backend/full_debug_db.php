<?php
include_once 'config/Database.php';
$database = new Database();
$db = $database->getConnection();

echo "Table: users<br>";
$q = $db->query("DESCRIBE users");
$cols = $q->fetchAll(PDO::FETCH_COLUMN);
echo implode(", ", $cols) . "<br><br>";

echo "Table: applicant_details<br>";
$q = $db->query("DESCRIBE applicant_details");
$cols = $q->fetchAll(PDO::FETCH_COLUMN);
echo implode(", ", $cols) . "<br><br>";

echo "Table: applications<br>";
$q = $db->query("DESCRIBE applications");
$cols = $q->fetchAll(PDO::FETCH_COLUMN);
echo implode(", ", $cols) . "<br>";
?>
