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
    echo json_encode(["message" => "Campus ID is required."]);
    exit();
}

// Check if campus has residents before deleting
$check = $db->prepare("SELECT COUNT(*) as cnt FROM residents WHERE campus_id = :id AND status = 'active'");
$check->bindParam(':id', $data->id);
$check->execute();
$row = $check->fetch(PDO::FETCH_ASSOC);

if ($row['cnt'] > 0) {
    http_response_code(409);
    echo json_encode(["message" => "Cannot delete campus with active residents. Relocate or remove residents first."]);
    exit();
}

$q = "DELETE FROM campuses WHERE id = :id";
$stmt = $db->prepare($q);
$stmt->bindParam(':id', $data->id);

if ($stmt->execute()) {
    echo json_encode(["message" => "Campus deleted successfully."]);
} else {
    http_response_code(503);
    echo json_encode(["message" => "Failed to delete campus."]);
}
?>
