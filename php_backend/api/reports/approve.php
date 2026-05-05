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
    echo json_encode(["message" => "id is required."]);
    exit();
}

$q = "UPDATE reports SET status = 'approved' WHERE id = :id";
$stmt = $db->prepare($q);
if ($stmt->execute([':id' => $data->id])) {
    echo json_encode(["message" => "Report approved successfully."]);
} else {
    http_response_code(503);
    echo json_encode(["message" => "Failed to approve report."]);
}
?>
