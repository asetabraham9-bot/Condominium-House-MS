<?php
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

// 1. Applications Statistics
$appQuery = "SELECT status, created_at, points FROM applications WHERE user_id = :uid ORDER BY created_at DESC";
$appStmt = $db->prepare($appQuery);
$appStmt->execute([':uid' => $userId]);
$applications = $appStmt->fetchAll(PDO::FETCH_ASSOC);

// 2. Placements (Roles)
$resQuery = "SELECT r.id, r.status, r.assigned_date, r.left_date, h.house_number, b.name AS blockName, c.name AS campusName 
             FROM residents r 
             JOIN houses h ON r.house_id = h.id 
             JOIN blocks b ON h.block_id = b.id 
             JOIN campuses c ON b.campus_id = c.id 
             WHERE r.user_id = :uid ORDER BY r.assigned_date DESC";
$resStmt = $db->prepare($resQuery);
$resStmt->execute([':uid' => $userId]);
$placements = $resStmt->fetchAll(PDO::FETCH_ASSOC);

// 3. Payment History
$payQuery = "SELECT p.amount, p.payment_date, p.status, p.receipt_path 
             FROM payments p 
             WHERE p.user_id = :uid ORDER BY p.payment_date DESC";
$payStmt = $db->prepare($payQuery);
$payStmt->execute([':uid' => $userId]);
$payments = $payStmt->fetchAll(PDO::FETCH_ASSOC);

// Calculation
$totalPaid = 0;
foreach($payments as $p) {
    if($p['status'] === 'verified') {
        $totalPaid += (float)$p['amount'];
    }
}

echo json_encode([
    'applications' => $applications,
    'placements' => $placements,
    'payments' => $payments,
    'summary' => [
        'totalApplications' => count($applications),
        'totalPlacements' => count($placements),
        'totalPayments' => count($payments),
        'totalAmountPaid' => $totalPaid
    ]
]);
?>
