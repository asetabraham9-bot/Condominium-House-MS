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

if (!empty($data->id) && !empty($data->status)) {
    // Map frontend statuses to DB enum values
    $allowed = ['pending', 'verified_by_campus_admin', 'approved', 'rejected'];
    $statusMap = [
        'pending'     => 'pending',
        'in_progress' => 'verified_by_campus_admin',
        'resolved'    => 'approved',
        'rejected'    => 'rejected'
    ];
    $newStatus = isset($statusMap[$data->status]) ? $statusMap[$data->status] : null;

    if (!$newStatus) {
        http_response_code(400);
        echo json_encode(["message" => "Invalid status value."]);
        exit();
    }

    try {
        $db->beginTransaction();

        // Fetch request info (needed for leave_house side-effects)
        $q0 = "SELECT id, request_type, resident_id, campus_id
               FROM resident_requests
               WHERE id = :id
               LIMIT 1";
        $s0 = $db->prepare($q0);
        $s0->bindParam(":id", $data->id);
        $s0->execute();
        $req = $s0->fetch(PDO::FETCH_ASSOC);

        if (!$req) {
            $db->rollBack();
            http_response_code(404);
            echo json_encode(["message" => "Request not found."]);
            exit();
        }

        // Update request status
        $query = "UPDATE resident_requests SET status = :status WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":status", $newStatus);
        $stmt->bindParam(":id", $data->id);

        if (!$stmt->execute()) {
            $db->rollBack();
            http_response_code(503);
            echo json_encode(["message" => "Failed to update request."]);
            exit();
        }

        // If a leave request is approved, free the house and close the resident record
        if ($req['request_type'] === 'leave_house' && $newStatus === 'approved') {
            // Get the resident's house
            $qh = "SELECT house_id, status FROM residents WHERE id = :rid LIMIT 1";
            $sh = $db->prepare($qh);
            $sh->bindParam(":rid", $req['resident_id']);
            $sh->execute();
            $res = $sh->fetch(PDO::FETCH_ASSOC);

            if ($res) {
                $houseId = $res['house_id'];

                // Mark resident as left (if not already)
                $qr = "UPDATE residents
                       SET status = 'left', leave_date = CURDATE()
                       WHERE id = :rid";
                $sr = $db->prepare($qr);
                $sr->bindParam(":rid", $req['resident_id']);
                $sr->execute();

                // Free the house
                if (!empty($houseId)) {
                    $qfree = "UPDATE houses SET status = 'available' WHERE id = :hid";
                    $sfree = $db->prepare($qfree);
                    $sfree->bindParam(":hid", $houseId);
                    $sfree->execute();
                }
            }
        }

        $db->commit();
        http_response_code(200);
        echo json_encode(["message" => "Request status updated successfully."]);

    } catch (Exception $e) {
        if ($db->inTransaction()) $db->rollBack();
        http_response_code(500);
        echo json_encode(["message" => "Server error while updating request.", "error" => $e->getMessage()]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "Request ID and status are required."]);
}
?>
