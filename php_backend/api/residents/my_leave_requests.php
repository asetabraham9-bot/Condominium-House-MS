<?php
// Read an applicant's own leave request status
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

include_once '../../config/Database.php';
$database = new Database();
$db = $database->getConnection();

$userId = isset($_GET['userId']) ? (int)$_GET['userId'] : null;

if (!$userId) {
    http_response_code(400);
    echo json_encode(["message" => "userId is required."]);
    exit();
}

$q = "SELECT rr.id, rr.description, rr.status, rr.created_at as submittedAt, rr.updated_at as updatedAt
      FROM resident_requests rr
      JOIN residents r ON rr.resident_id = r.id
      WHERE r.user_id = :userId AND rr.request_type = 'leave_house'
      ORDER BY rr.created_at DESC
      LIMIT 5";

$stmt = $db->prepare($q);
$stmt->bindParam(':userId', $userId);
$stmt->execute();

$records = [];
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    // Parse description for embedded leave date
    $desc = $row['description'];
    $leaveDate = null;
    $reason = $desc;
    if (preg_match('/^\[Leave Request \| Intended Date: ([\d-]+)\] (.*)$/s', $desc, $m)) {
        $leaveDate = $m[1];
        $reason    = $m[2];
    }
    $row['id']          = (string)$row['id'];
    $row['leaveDate']   = $leaveDate;
    $row['reason']      = $reason;
    $row['submittedAt'] = date('Y-m-d', strtotime($row['submittedAt']));
    $row['updatedAt']   = date('Y-m-d', strtotime($row['updatedAt']));
    // Map DB status to frontend labels
    $statusMap = [
        'pending'                  => 'pending',
        'verified_by_campus_admin' => 'in_review',
        'approved'                 => 'approved',
        'rejected'                 => 'rejected',
    ];
    $row['status'] = $statusMap[$row['status']] ?? 'pending';
    unset($row['description']);
    $records[] = $row;
}

echo json_encode(["records" => $records]);
?>
