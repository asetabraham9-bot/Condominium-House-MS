<?php
// Read applicants for individual notification targeting
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

include_once '../../config/Database.php';
$database = new Database();
$db = $database->getConnection();

$query = "SELECT u.id, CONCAT(u.first_name, ' ', u.last_name) AS name, u.email, u.role,
                 c.name AS campusName
          FROM users u
          LEFT JOIN campuses c ON u.campus_id = c.id
          WHERE u.role IN ('applicant', 'campus_admin')
          ORDER BY u.role, u.first_name";

$stmt = $db->prepare($query);
$stmt->execute();
$records = [];
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $row['id'] = (string)$row['id'];
    $records[] = $row;
}

echo json_encode(["records" => $records]);
?>
