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

if (!empty($data->id) && !empty($data->status)) {
    $allowed = ['pending', 'approved', 'rejected', 'lottery_won', 'placed'];
    if (!in_array($data->status, $allowed)) {
        http_response_code(400);
        echo json_encode(["message" => "Invalid status value."]);
        exit();
    }

    $query = "UPDATE applicant_details SET status = :status WHERE user_id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":status", $data->status);
    $stmt->bindParam(":id", $data->id);

    if ($stmt->execute()) {
        http_response_code(200);
        echo json_encode(["message" => "Applicant status updated to " . $data->status]);
    } else {
        http_response_code(503);
        echo json_encode(["message" => "Failed to update applicant status."]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "Applicant ID and status are required."]);
}
?>
