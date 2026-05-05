<?php
// Toggle application cycle open/close
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

include_once '../../config/Database.php';
$database = new Database();
$db = $database->getConnection();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $db->prepare("SELECT id, title, description, house_details, status, deadline FROM applications ORDER BY id DESC LIMIT 1");
    $stmt->execute();
    if ($stmt->rowCount() > 0) {
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        echo json_encode(["cycle" => $row]);
    } else {
        echo json_encode(["cycle" => null]);
    }
    exit();
}

$data = json_decode(file_get_contents("php://input"));
$action = isset($data->action) ? $data->action : 'toggle';

if ($action === 'open') {
    $title = isset($data->title) ? $data->title : 'Application Cycle ' . date('M Y');
    $description = isset($data->description) ? $data->description : 'General application cycle for university staff housing.';
    $house_details = isset($data->house_details) ? $data->house_details : '';
    $deadline = isset($data->deadline) ? $data->deadline : date('Y-m-d', strtotime('+30 days'));
    
    // Close existing open cycles first
    $db->exec("UPDATE applications SET status = 'closed' WHERE status = 'open'");
    
    $stmt = $db->prepare("INSERT INTO applications (title, description, house_details, deadline, status) VALUES (:title, :description, :hdetails, :deadline, 'open')");
    $stmt->bindParam(':title', $title);
    $stmt->bindParam(':description', $description);
    $stmt->bindParam(':hdetails', $house_details);
    $stmt->bindParam(':deadline', $deadline);
    
    if ($stmt->execute()) {
        http_response_code(201);
        echo json_encode(["message" => "Application cycle opened with house details.", "id" => $db->lastInsertId(), "status" => "open"]);
    } else {
        http_response_code(503);
        echo json_encode(["message" => "Failed to open cycle."]);
    }
} elseif ($action === 'close') {
    $stmt = $db->prepare("UPDATE applications SET status = 'closed' WHERE status = 'open'");
    if ($stmt->execute()) {
        echo json_encode(["message" => "Application cycle closed.", "status" => "closed"]);
    } else {
        http_response_code(503);
        echo json_encode(["message" => "Failed to close cycle."]);
    }
}
?>
