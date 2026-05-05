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

if (empty($data->id) || empty($data->status)) {
    http_response_code(400);
    echo json_encode(["message" => "id and status are required."]);
    exit();
}

$allowed_statuses = ['approved', 'rejected'];
if (!in_array($data->status, $allowed_statuses)) {
    http_response_code(400);
    echo json_encode(["message" => "Invalid status."]);
    exit();
}

if ($data->status === 'rejected' && empty($data->admin_feedback)) {
    http_response_code(400);
    echo json_encode(["message" => "Admin feedback is required when rejecting a report."]);
    exit();
}

$q = "UPDATE reports SET status = :status, admin_feedback = :admin_feedback WHERE id = :id";
$stmt = $db->prepare($q);

$feedback = isset($data->admin_feedback) ? $data->admin_feedback : null;

if ($stmt->execute([':status' => $data->status, ':admin_feedback' => $feedback, ':id' => $data->id])) {
    echo json_encode(["message" => "Report updated successfully."]);
} else {
    http_response_code(503);
    echo json_encode(["message" => "Failed to update report."]);
}
?>
