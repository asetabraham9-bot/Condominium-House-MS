<?php
// Read notifications for a specific user (applicant view)
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

include_once '../../config/Database.php';
$database = new Database();
$db = $database->getConnection();

$userId = isset($_GET['userId']) ? (int)$_GET['userId'] : null;
$userRole = isset($_GET['role']) ? $_GET['role'] : 'applicant';

if (!$userId) {
    http_response_code(400);
    echo json_encode(["message" => "userId is required."]);
    exit();
}

// Map role to DB recipient_group value
$roleGroupMap = [
    'applicant'    => 'applicants_only',
    'campus_admin' => 'residents_only', // campus admins see resident group notices
];
$roleGroup = $roleGroupMap[$userRole] ?? 'applicants_only';

// Build query: get notifications targeted to 'all_users', role-specific group, or directly to this user
$query = "SELECT 
            n.id,
            n.message,
            n.recipient_group AS recipientGroup,
            n.is_read AS isRead,
            n.created_at AS sentAt,
            CONCAT(u.first_name, ' ', u.last_name) AS senderName
          FROM notifications n
          JOIN users u ON n.sender_id = u.id
          WHERE n.recipient_group = 'all_users'
             OR n.recipient_group = :roleGroup
             OR (n.recipient_group = 'individual' AND n.recipient_id = :userId)
          ORDER BY n.created_at DESC";

$stmt = $db->prepare($query);
$stmt->bindParam(':roleGroup', $roleGroup);
$stmt->bindParam(':userId', $userId);
$stmt->execute();

$records = [];
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $row['id'] = (string)$row['id'];
    $row['isRead'] = (bool)$row['isRead'];
    $row['sentAt'] = date('Y-m-d H:i:s', strtotime($row['sentAt']));
    $records[] = $row;
}

echo json_encode(["records" => $records]);
?>
