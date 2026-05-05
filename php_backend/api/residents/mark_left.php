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

if (empty($data->id)) {
    http_response_code(400);
    echo json_encode(["message" => "Resident ID is required."]);
    exit();
}

// Optional campus guard (prevents cross-campus actions)
$campusGuard = isset($data->campusId) ? (int)$data->campusId : null;

// Ensure resident exists (and matches campus when provided)
$q0 = "SELECT id, campus_id, house_id FROM residents WHERE id = :id";
$s0 = $db->prepare($q0);
$s0->bindParam(':id', $data->id);
$s0->execute();
$resident = $s0->fetch(PDO::FETCH_ASSOC);

if (!$resident) {
    http_response_code(404);
    echo json_encode(["message" => "Resident not found."]);
    exit();
}

if ($campusGuard && (int)$resident['campus_id'] !== $campusGuard) {
    http_response_code(403);
    echo json_encode(["message" => "Forbidden: resident does not belong to your campus."]);
    exit();
}

// Mark resident as left and record leave date
$q = "UPDATE residents SET status = 'left', leave_date = CURDATE() WHERE id = :id";
$stmt = $db->prepare($q);
$stmt->bindParam(':id', $data->id);

if ($stmt->execute()) {
    // Also free the house  
    $q2 = "UPDATE houses SET status = 'available' WHERE id = (SELECT house_id FROM residents WHERE id = :id)";
    // Note: subquery after update doesn't work on same table in MySQL, so fetch first
    if (!empty($resident['house_id'])) {
        $qfree = "UPDATE houses SET status = 'available' WHERE id = :hid";
        $sfree = $db->prepare($qfree);
        $sfree->bindParam(':hid', $resident['house_id']);
        $sfree->execute();
    }

    http_response_code(200);
    echo json_encode(["message" => "Resident marked as left. House freed."]);
} else {
    http_response_code(503);
    echo json_encode(["message" => "Failed to update resident status."]);
}
?>
