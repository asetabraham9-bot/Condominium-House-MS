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

$data = json_decode(file_get_contents("php://input"));

if (empty($data->id) || empty($data->status)) {
    http_response_code(400);
    echo json_encode(["message" => "Incomplete request. 'id' and 'status' are required."]);
    exit();
}

$id = (int)$data->id;
$status = trim((string)$data->status);

if ($status !== 'open' && $status !== 'closed') {
    http_response_code(400);
    echo json_encode(["message" => "Invalid status. Must be 'open' or 'closed'."]);
    exit();
}

try {
    // Fetch cycle to check deadline
    $stmt = $db->prepare("SELECT deadline, title FROM applications WHERE id = :id");
    $stmt->execute([':id' => $id]);
    $cycle = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$cycle) {
        http_response_code(404);
        echo json_encode(["message" => "Application cycle not found."]);
        exit();
    }

    if ($cycle['deadline']) {
        $deadlineTime = strtotime($cycle['deadline']);
        if ($deadlineTime !== false && $deadlineTime < time()) {
            http_response_code(400);
            echo json_encode(["message" => "Cannot " . ($status === 'open' ? 'reopen' : 'close') . ". The deadline for this application round (" . $cycle['deadline'] . ") has already been reached."]);
            exit();
        }
    }

    $db->beginTransaction();

    if ($status === 'open') {
        // Close other cycles
        $closeOthers = $db->prepare("UPDATE applications SET status = 'closed' WHERE id != :id");
        $closeOthers->execute([':id' => $id]);
    }

    // Toggle status
    $update = $db->prepare("UPDATE applications SET status = :status WHERE id = :id");
    $update->execute([':status' => $status, ':id' => $id]);

    $db->commit();

    http_response_code(200);
    echo json_encode([
        "message" => "Application round '" . $cycle['title'] . "' has been set to " . $status . " successfully.",
        "status" => $status
    ]);

} catch (Exception $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    http_response_code(500);
    echo json_encode(["message" => "Failed to update cycle status.", "error" => $e->getMessage()]);
}
?>
