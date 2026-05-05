<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

include_once '../../config/Database.php';
$database = new Database();
$db = $database->getConnection();

// Read all campuses for campus selector
$stmt = $db->prepare("SELECT id, name FROM campuses ORDER BY name");
$stmt->execute();
$campuses = [];
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $campuses[] = $row;
}
echo json_encode(["records" => $campuses]);
?>
