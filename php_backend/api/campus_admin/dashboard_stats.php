<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

include_once '../../config/Database.php';

$database = new Database();
$db = $database->getConnection();

$campus_id = isset($_GET['campus_id']) ? $_GET['campus_id'] : null;

if (!$campus_id) {
    http_response_code(400);
    echo json_encode(["message" => "campus_id is required"]);
    exit();
}

try {
    // 1. Total Blocks
    $qBlocks = "SELECT COUNT(*) as count FROM blocks WHERE campus_id = :cid";
    $stmt1 = $db->prepare($qBlocks);
    $stmt1->execute([':cid' => $campus_id]);
    $totalBlocks = $stmt1->fetch(PDO::FETCH_ASSOC)['count'];

    // 2. Total Houses (Registered in the houses table)
    $qHouses = "SELECT COUNT(*) as count FROM houses h JOIN blocks b ON h.block_id = b.id WHERE b.campus_id = :cid";
    $stmt2 = $db->prepare($qHouses);
    $stmt2->execute([':cid' => $campus_id]);
    $totalHouses = $stmt2->fetch(PDO::FETCH_ASSOC)['count'];

    // 3. Active Residents
    $qResidents = "SELECT COUNT(*) as count FROM residents WHERE campus_id = :cid AND status = 'active'";
    $stmt3 = $db->prepare($qResidents);
    $stmt3->execute([':cid' => $campus_id]);
    $activeResidents = $stmt3->fetch(PDO::FETCH_ASSOC)['count'];

    // 4. Pending Payments
    // We'll join with residents to make sure we only count payments for this campus
    $qPayments = "SELECT COUNT(p.id) as count FROM payments p 
                  JOIN residents r ON p.user_id = r.user_id 
                  WHERE r.campus_id = :cid AND p.status = 'pending'";
    $stmt4 = $db->prepare($qPayments);
    $stmt4->execute([':cid' => $campus_id]);
    $pendingPayments = $stmt4->fetch(PDO::FETCH_ASSOC)['count'];

    // 5. Recent Activity (Latest 5 residents)
    $qRecent = "SELECT r.resident_name as name, h.house_number, b.name as block_name, r.assigned_date 
                FROM residents r
                JOIN houses h ON r.house_id = h.id
                JOIN blocks b ON h.block_id = b.id
                WHERE r.campus_id = :cid
                ORDER BY r.assigned_date DESC LIMIT 5";
    // Using simple JOINs since your schema has the data
    // Note: I renamed user_id to name in SELECT for display but actual query would join users
    $qRecentV2 = "SELECT CONCAT(u.first_name, ' ', u.last_name) as residentName, h.house_number, b.name as blockName
                  FROM residents r
                  JOIN users u ON r.user_id = u.id
                  JOIN houses h ON r.house_id = h.id
                  JOIN blocks b ON h.block_id = b.id
                  WHERE r.campus_id = :cid
                  ORDER BY r.assigned_date DESC LIMIT 5";
    $stmt5 = $db->prepare($qRecentV2);
    $stmt5->execute([':cid' => $campus_id]);
    $recentResidents = $stmt5->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "stats" => [
            "totalBlocks" => (int)$totalBlocks,
            "totalHouses" => (int)$totalHouses,
            "activeResidents" => (int)$activeResidents,
            "pendingPayments" => (int)$pendingPayments
        ],
        "recentResidents" => $recentResidents
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Internal Server Error", "error" => $e->getMessage()]);
}
?>
