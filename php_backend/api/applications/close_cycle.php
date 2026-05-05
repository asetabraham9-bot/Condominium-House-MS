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

if (!$db) {
    http_response_code(503);
    echo json_encode(["message" => "Database connection failed."]);
    exit();
}

try {
    $stmt = $db->prepare("UPDATE applications SET status = 'closed' WHERE status = 'open'");
    $stmt->execute();
    $count = $stmt->rowCount();

    http_response_code(200);
    echo json_encode([
        "message" => $count > 0
            ? "Open application cycle(s) closed successfully."
            : "No open cycles to close.",
        "closed" => $count,
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Unable to close cycles.", "error" => $e->getMessage()]);
}
