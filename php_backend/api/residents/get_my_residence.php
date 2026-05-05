<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

include_once '../../config/Database.php';
$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (empty($data->userId)) {
    http_response_code(400);
    echo json_encode(["message" => "userId is required."]);
    exit();
}

// Fetch the active resident record for this user
$q = "SELECT r.id, r.house_id, h.house_number, b.name as blockName, c.name as campusName, r.assigned_date
      FROM residents r
      JOIN houses h ON r.house_id = h.id
      JOIN blocks b ON h.block_id = b.id
      JOIN campuses c ON r.campus_id = c.id
      WHERE r.user_id = :userId AND r.status = 'active'
      LIMIT 1";

$stmt = $db->prepare($q);
$stmt->bindParam(':userId', $data->userId);
$stmt->execute();
$resident = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$resident) {
    http_response_code(404);
    echo json_encode(["message" => "No active resident record found for this user."]);
    exit();
}

echo json_encode([
    "resident" => [
        "id"           => (string)$resident['id'],
        "houseId"      => (string)$resident['house_id'],
        "houseNumber"  => $resident['house_number'],
        "blockName"    => $resident['blockName'],
        "campusName"   => $resident['campusName'],
        "moveInDate"   => date('Y-m-d', strtotime($resident['assigned_date'])),
    ]
]);
?>
