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

if (empty($data->senderId) || empty($data->recipientGroup) || empty($data->message)) {
    http_response_code(400);
    echo json_encode(["message" => "senderId, recipientGroup, and message are required."]);
    exit();
}

$allowed = ['all_users', 'applicants_only', 'residents_only', 'individual'];
if (!in_array($data->recipientGroup, $allowed)) {
    http_response_code(400);
    echo json_encode(["message" => "Invalid recipientGroup."]);
    exit();
}

$recipientId = null;
if ($data->recipientGroup === 'individual') {
    if (empty($data->recipientId)) {
        http_response_code(400);
        echo json_encode(["message" => "recipientId is required for individual notifications."]);
        exit();
    }
    $recipientId = $data->recipientId;
}

$query = "INSERT INTO notifications (sender_id, recipient_group, recipient_id, message, is_read)
          VALUES (:senderId, :recipientGroup, :recipientId, :message, FALSE)";

$stmt = $db->prepare($query);
$stmt->bindParam(':senderId', $data->senderId);
$stmt->bindParam(':recipientGroup', $data->recipientGroup);
$stmt->bindParam(':recipientId', $recipientId);
$stmt->bindParam(':message', $data->message);

if ($stmt->execute()) {
    http_response_code(201);
    echo json_encode([
        "message" => "Notification sent successfully.",
        "id" => $db->lastInsertId()
    ]);
} else {
    http_response_code(503);
    echo json_encode(["message" => "Failed to send notification."]);
}
?>
