<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../../config/Database.php';

$database = new Database();
$db = $database->getConnection();

// This endpoint can be used by an applicant to get their payments, or admins to get all
$userId = isset($_GET['userId']) ? $_GET['userId'] : null;

$query = "SELECT p.id, p.user_id as residentId, CONCAT(u.first_name, ' ', u.last_name) as residentName, 
                 p.amount, p.payment_date as paymentDate, p.status as paymentStatus, 
                 p.payment_method as paymentMethod, p.reference_number as referenceNumber,
                 p.payment_type, p.transaction_id, p.screenshot_path,
                 DATE_FORMAT(p.payment_date, '%M %Y') as month,
                 u.campus_id as campusId,
                 c.name as campusName
          FROM payments p
          JOIN users u ON p.user_id = u.id
          LEFT JOIN campuses c ON u.campus_id = c.id";

if ($userId) {
    $query .= " WHERE p.user_id = :uid";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':uid', $userId);
} else {
    $stmt = $db->prepare($query);
}

$stmt->execute();

$payments_arr = array();
$payments_arr["records"] = array();

while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    array_push($payments_arr["records"], $row);
}

http_response_code(200);
echo json_encode($payments_arr);
?>
