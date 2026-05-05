<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

include_once '../../config/Database.php';
$database = new Database();
$db = $database->getConnection();

// Fetch all sent notifications for admin history view
$query = "SELECT 
            n.id,
            n.message,
            n.recipient_group AS recipientGroup,
            n.is_read AS isRead,
            n.created_at AS sentAt,
            CONCAT(u.first_name, ' ', u.last_name) AS senderName,
            IF(n.recipient_id IS NOT NULL, CONCAT(ru.first_name, ' ', ru.last_name), NULL) AS recipientName
          FROM notifications n
          JOIN users u ON n.sender_id = u.id
          LEFT JOIN users ru ON n.recipient_id = ru.id
          ORDER BY n.created_at DESC
          LIMIT 100";

$stmt = $db->prepare($query);
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
