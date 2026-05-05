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

if (empty($data->userId) || empty($data->reason) || empty($data->leaveDate)) {
    http_response_code(400);
    echo json_encode(["message" => "userId, reason, and leaveDate are required."]);
    exit();
}

// Check if a leave request already exists (pending)
$checkQ = "SELECT id FROM resident_requests 
           WHERE resident_id = (SELECT id FROM residents WHERE user_id = :uid AND status = 'active' LIMIT 1)
           AND request_type = 'leave_house'
           AND status IN ('pending', 'verified_by_campus_admin')
           LIMIT 1";
$checkStmt = $db->prepare($checkQ);
$checkStmt->bindParam(':uid', $data->userId);
$checkStmt->execute();

if ($checkStmt->rowCount() > 0) {
    http_response_code(409);
    echo json_encode(["message" => "You already have a pending leave request. Please wait for it to be processed."]);
    exit();
}

// Get the resident id and campus id
$rq = "SELECT r.id as rid, r.campus_id FROM residents r WHERE r.user_id = :uid AND r.status = 'active' LIMIT 1";
$rs = $db->prepare($rq);
$rs->bindParam(':uid', $data->userId);
$rs->execute();
$resRow = $rs->fetch(PDO::FETCH_ASSOC);

if (!$resRow) {
    http_response_code(404);
    echo json_encode(["message" => "No active resident record found."]);
    exit();
}

$residentId = $resRow['rid'];
$campusId   = $resRow['campus_id'];

// Build the description with leave date embedded
$description = "[Leave Request | Intended Date: {$data->leaveDate}] " . $data->reason;

// Insert the leave request into resident_requests
$insertQ = "INSERT INTO resident_requests (resident_id, campus_id, request_type, priority, description, status)
            VALUES (:rid, :cid, 'leave_house', 'high', :desc, 'pending')";
$insertStmt = $db->prepare($insertQ);
$insertStmt->bindParam(':rid', $residentId);
$insertStmt->bindParam(':cid', $campusId);
$insertStmt->bindParam(':desc', $description);

if ($insertStmt->execute()) {
    http_response_code(201);
    echo json_encode([
        "message" => "Leave request submitted successfully. Campus admin will review your request within 7-14 days.",
        "id" => $db->lastInsertId()
    ]);
} else {
    http_response_code(503);
    echo json_encode(["message" => "Failed to submit leave request. Please try again."]);
}
?>
