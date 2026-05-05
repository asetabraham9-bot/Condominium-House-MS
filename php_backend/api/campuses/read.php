<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

include_once '../../config/Database.php';
$database = new Database();
$db = $database->getConnection();

// Fetch all campuses with their campus admin info and stats
$query = "SELECT 
            c.id, c.name, c.location, c.created_at,
            u.id AS adminId,
            CONCAT(u.first_name, ' ', u.last_name) AS adminName,
            u.email AS adminEmail,
            u.phone_number AS adminPhone,
            (SELECT COUNT(*) FROM blocks b WHERE b.campus_id = c.id) AS totalBlocks,
            (SELECT COUNT(*) FROM residents r WHERE r.campus_id = c.id AND r.status = 'active') AS totalResidents
          FROM campuses c
          LEFT JOIN users u ON u.campus_id = c.id AND u.role = 'campus_admin'
          ORDER BY c.created_at DESC";

$stmt = $db->prepare($query);
$stmt->execute();
$records = [];
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $row['id'] = (string)$row['id'];
    $row['adminId'] = $row['adminId'] ? (string)$row['adminId'] : null;
    $row['totalBlocks'] = (int)$row['totalBlocks'];
    $row['totalResidents'] = (int)$row['totalResidents'];
    $row['createdAt'] = date('Y-m-d', strtotime($row['created_at']));
    $records[] = $row;
}

echo json_encode(["records" => $records]);
?>
