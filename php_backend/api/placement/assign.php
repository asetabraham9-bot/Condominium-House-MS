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

if (empty($data->userId) || empty($data->houseId) || empty($data->campusId)) {
    http_response_code(400);
    echo json_encode(["message" => "userId, houseId, and campusId are required."]);
    exit();
}

try {
    $db->beginTransaction();

    // Validate: applicant must be a current lottery winner (not already placed)
    $qa = "SELECT status FROM applicant_details WHERE user_id = :uid LIMIT 1";
    $sa = $db->prepare($qa);
    $sa->bindParam(':uid', $data->userId);
    $sa->execute();
    $app = $sa->fetch(PDO::FETCH_ASSOC);

    if (!$app || $app['status'] !== 'lottery_won') {
        $db->rollBack();
        http_response_code(400);
        echo json_encode(["message" => "Applicant is not eligible for manual placement (must be lottery_won)."]);
        exit();
    }

    // Validate: house must be available and belong to the selected campus
    $qh = "SELECT h.status, b.campus_id
           FROM houses h
           JOIN blocks b ON h.block_id = b.id
           WHERE h.id = :hid
           LIMIT 1";
    $sh = $db->prepare($qh);
    $sh->bindParam(':hid', $data->houseId);
    $sh->execute();
    $house = $sh->fetch(PDO::FETCH_ASSOC);

    if (!$house) {
        $db->rollBack();
        http_response_code(404);
        echo json_encode(["message" => "House not found."]);
        exit();
    }

    if ($house['status'] !== 'available') {
        $db->rollBack();
        http_response_code(409);
        echo json_encode(["message" => "House is not available."]);
        exit();
    }

    if ((int)$house['campus_id'] !== (int)$data->campusId) {
        $db->rollBack();
        http_response_code(400);
        echo json_encode(["message" => "Selected house does not belong to the selected campus."]);
        exit();
    }

    // Prevent double placement
    $qr = "SELECT id FROM residents WHERE user_id = :uid AND status = 'active' LIMIT 1";
    $sr = $db->prepare($qr);
    $sr->bindParam(':uid', $data->userId);
    $sr->execute();
    $already = $sr->fetch(PDO::FETCH_ASSOC);
    if ($already) {
        $db->rollBack();
        http_response_code(409);
        echo json_encode(["message" => "Applicant is already an active resident."]);
        exit();
    }

    // 1. Insert into residents
    $q1 = "INSERT INTO residents (user_id, house_id, campus_id, status, assigned_date)
            VALUES (:uid, :hid, :cid, 'active', CURDATE())";
    $s1 = $db->prepare($q1);
    $s1->bindParam(':uid', $data->userId);
    $s1->bindParam(':hid', $data->houseId);
    $s1->bindParam(':cid', $data->campusId);
    $s1->execute();
    $residentId = $db->lastInsertId();

    // 2. Mark house as occupied
    $q2 = "UPDATE houses SET status = 'occupied' WHERE id = :hid";
    $s2 = $db->prepare($q2);
    $s2->bindParam(':hid', $data->houseId);
    $s2->execute();

    // 3. Mark applicant as placed
    $q3 = "UPDATE applicant_details SET status = 'placed' WHERE user_id = :uid";
    $s3 = $db->prepare($q3);
    $s3->bindParam(':uid', $data->userId);
    $s3->execute();

    $db->commit();
    http_response_code(201);
    echo json_encode([
        "message" => "House assigned successfully.",
        "residentId" => $residentId
    ]);

} catch (Exception $e) {
    $db->rollBack();
    http_response_code(503);
    echo json_encode(["message" => "Placement failed.", "error" => $e->getMessage()]);
}
?>
