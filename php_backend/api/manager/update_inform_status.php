<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../../config/Database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (
    !empty($data->requestId) &&
    !empty($data->status) &&
    !empty($data->managerId)
) {
    $requestId = (int)$data->requestId;
    $status = $data->status;
    $managerId = (int)$data->managerId;
    $forwardToAdmin = isset($data->forwardToAdmin) ? (bool)$data->forwardToAdmin : false;

    $allowed_statuses = ['pending', 'resolved', 'rejected'];
    if (!in_array($status, $allowed_statuses)) {
        http_response_code(400);
        echo json_encode(["message" => "Invalid status selection."]);
        exit();
    }

    try {
        $db->beginTransaction();

        // 1. Fetch details of the request
        $query_details = "SELECT 
                            ihr.informer_id,
                            ihr.block,
                            ihr.house_type,
                            ihr.house_status,
                            ihr.maintenance_description,
                            c.name AS house_campus_name,
                            inf.first_name AS inf_first,
                            inf.last_name AS inf_last,
                            inf_c.name AS inf_campus_name
                          FROM inform_house_requests ihr
                          JOIN users inf ON ihr.informer_id = inf.id
                          LEFT JOIN campuses inf_c ON inf.campus_id = inf_c.id
                          JOIN campuses c ON ihr.campus_id = c.id
                          WHERE ihr.id = :id";
        $stmt_details = $db->prepare($query_details);
        $stmt_details->bindParam(":id", $requestId);
        $stmt_details->execute();

        if ($stmt_details->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(["message" => "Request not found."]);
            $db->rollBack();
            exit();
        }

        $req = $stmt_details->fetch(PDO::FETCH_ASSOC);
        $informerId = $req['informer_id'];
        $block = $req['block'];
        $houseType = $req['house_type'];
        $houseStatus = $req['house_status'];
        $maintDesc = $req['maintenance_description'] ?? 'None';
        $houseCampus = $req['house_campus_name'];
        $informerName = $req['inf_first'] . " " . $req['inf_last'];
        $informerCampus = $req['inf_campus_name'] ?? 'Unknown Campus';

        // 2. Update status and forwarding in database
        $forwardVal = $forwardToAdmin ? 1 : 0;
        $query_update = "UPDATE inform_house_requests 
                         SET status = :status, forwarded_to_admin = CASE WHEN :forward = 1 THEN 1 ELSE forwarded_to_admin END 
                         WHERE id = :id";
        $stmt_update = $db->prepare($query_update);
        $stmt_update->bindParam(":status", $status);
        $stmt_update->bindParam(":forward", $forwardVal);
        $stmt_update->bindParam(":id", $requestId);
        $stmt_update->execute();

        // 3. Handle forwarding to system admin notification
        if ($forwardToAdmin) {
            // Find system admins (role = 'system_admin')
            $query_admins = "SELECT id FROM users WHERE role = 'system_admin'";
            $stmt_admins = $db->query($query_admins);
            $admins = $stmt_admins->fetchAll(PDO::FETCH_ASSOC);

            // Construct notification detailed body
            $adminMessage = "[FORWARDED_REQUEST] Nominated House Forwarded by Manager\n"
                          . "- Campus: $houseCampus\n"
                          . "- Block: $block\n"
                          . "- House Type: $houseType\n"
                          . "- House Status: " . ($houseStatus === 'available' ? 'Available (Ready)' : 'Maintenance Required') . "\n"
                          . "- Maintenance Notes: $maintDesc\n"
                          . "- Action Status: $status";

            // Insert notification for each system admin
            foreach ($admins as $admin) {
                $adminId = $admin['id'];
                $query_notify_admin = "INSERT INTO notifications (sender_id, recipient_group, recipient_id, message, is_read) 
                                       VALUES (:sender, 'individual', :recipient, :msg, 0)";
                $stmt_notify_admin = $db->prepare($query_notify_admin);
                $stmt_notify_admin->bindParam(":sender", $managerId);
                $stmt_notify_admin->bindParam(":recipient", $adminId);
                $stmt_notify_admin->bindParam(":msg", $adminMessage);
                $stmt_notify_admin->execute();
            }
        }

        // 4. Send gratitude notification to applicant (informer)
        if ($forwardToAdmin) {
            $gratitudeMsg = "Thank you for your cooperation! Your nomination for a house in Campus: $houseCampus, Block: $block has been forwarded to the System Admin (Current Status: " . ucfirst($status) . "). We appreciate your active responsibility and transparency.";
        } else {
            $gratitudeMsg = "Thank you for your cooperation! Your nomination for a house in Campus: $houseCampus, Block: $block has been reviewed and marked as " . ucfirst($status) . ". We appreciate your active responsibility and transparency.";
        }

        $query_notify_informer = "INSERT INTO notifications (sender_id, recipient_group, recipient_id, message, is_read) 
                                   VALUES (:sender, 'individual', :recipient, :msg, 0)";
        $stmt_notify_informer = $db->prepare($query_notify_informer);
        $stmt_notify_informer->bindParam(":sender", $managerId);
        $stmt_notify_informer->bindParam(":recipient", $informerId);
        $stmt_notify_informer->bindParam(":msg", $gratitudeMsg);
        $stmt_notify_informer->execute();

        $db->commit();

        http_response_code(200);
        echo json_encode(["message" => "Request updated successfully.", "status" => $status, "forwarded" => $forwardToAdmin]);
    } catch (Exception $e) {
        $db->rollBack();
        http_response_code(503);
        echo json_encode(["message" => "Database error.", "error" => $e->getMessage()]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "Incomplete request data."]);
}
?>
