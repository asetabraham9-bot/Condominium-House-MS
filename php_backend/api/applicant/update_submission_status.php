<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../../config/Database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (empty($data->applicantUserId) || empty($data->status)) {
    http_response_code(400);
    echo json_encode(["message" => "applicantUserId and status are required."]);
    exit();
}

$allowed = ['pending', 'approved', 'rejected'];
if (!in_array($data->status, $allowed, true)) {
    http_response_code(400);
    echo json_encode(["message" => "status must be pending, approved, or rejected."]);
    exit();
}

$uid = (int)$data->applicantUserId;

try {
    $q = "UPDATE applicant_details SET status = :st WHERE user_id = :uid AND application_id IS NOT NULL";
    $stmt = $db->prepare($q);
    $stmt->execute([':st' => $data->status, ':uid' => $uid]);

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(["message" => "No submitted application found for this user."]);
        exit();
    }

    http_response_code(200);
    echo json_encode(["message" => "Application status updated."]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Server error.", "error" => $e->getMessage()]);
}
