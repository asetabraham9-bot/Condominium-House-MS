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

if (empty($data->userId) || empty($data->currentPassword) || empty($data->newPassword)) {
    http_response_code(400);
    echo json_encode(["message" => "userId, currentPassword, and newPassword are required."]);
    exit();
}

if (strlen($data->newPassword) < 6) {
    http_response_code(400);
    echo json_encode(["message" => "New password must be at least 6 characters."]);
    exit();
}

// Fetch current hash
$fetch = $db->prepare("SELECT password_hash FROM users WHERE id = :id");
$fetch->execute([':id' => $data->userId]);
$row = $fetch->fetch(PDO::FETCH_ASSOC);

if (!$row) {
    http_response_code(404);
    echo json_encode(["message" => "User not found."]);
    exit();
}

// Verify current password (supports both hashed and plain-text legacy)
$valid = password_verify($data->currentPassword, $row['password_hash'])
      || $data->currentPassword === $row['password_hash'];

if (!$valid) {
    http_response_code(401);
    echo json_encode(["message" => "Current password is incorrect."]);
    exit();
}

// Hash and save the new password
$newHash = password_hash($data->newPassword, PASSWORD_BCRYPT);
$update = $db->prepare("UPDATE users SET password_hash = :hash WHERE id = :id");

if ($update->execute([':hash' => $newHash, ':id' => $data->userId])) {
    http_response_code(200);
    echo json_encode(["message" => "Password changed successfully."]);
} else {
    http_response_code(503);
    echo json_encode(["message" => "Failed to update password."]);
}
?>
