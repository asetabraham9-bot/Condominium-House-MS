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

try {
    $db->beginTransaction();

    // Optional campus guard (prevents cross-campus actions)
    $campusGuard = isset($data->campusId) ? (int)$data->campusId : null;

    // Get the house_id (and campus) before deleting
    $q0 = "SELECT house_id, campus_id FROM residents WHERE id = :id";
    $s0 = $db->prepare($q0);
    $s0->bindParam(':id', $data->id);
    $s0->execute();
    $row = $s0->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        $db->rollBack();
        http_response_code(404);
        echo json_encode(["message" => "Resident not found."]);
        exit();
    }

    if ($campusGuard && (int)$row['campus_id'] !== $campusGuard) {
        $db->rollBack();
        http_response_code(403);
        echo json_encode(["message" => "Forbidden: resident does not belong to your campus."]);
        exit();
    }

    $houseId = $row['house_id'];

    // Delete the resident record
    $q1 = "DELETE FROM residents WHERE id = :id";
    $s1 = $db->prepare($q1);
    $s1->bindParam(':id', $data->id);
    $s1->execute();

    // Free up the house
    $q2 = "UPDATE houses SET status = 'available' WHERE id = :houseId";
    $s2 = $db->prepare($q2);
    $s2->bindParam(':houseId', $houseId);
    $s2->execute();

    $db->commit();
    http_response_code(200);
    echo json_encode(["message" => "Resident removed and house freed successfully."]);

} catch (Exception $e) {
    $db->rollBack();
    http_response_code(503);
    echo json_encode(["message" => "Failed to remove resident.", "error" => $e->getMessage()]);
}
?>
