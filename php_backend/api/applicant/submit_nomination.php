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
    !empty($data->informerId) &&
    !empty($data->campusId) &&
    !empty($data->block) &&
    !empty($data->houseType) &&
    !empty($data->houseStatus)
) {
    // Validation of values
    $allowed_types = ['Studio', 'one bed', 'two bed', 'three bed'];
    $allowed_statuses = ['available', 'maintenance'];

    if (!in_array($data->houseType, $allowed_types)) {
        http_response_code(400);
        echo json_encode(["message" => "Invalid house type selection."]);
        exit();
    }

    if (!in_array($data->houseStatus, $allowed_statuses)) {
        http_response_code(400);
        echo json_encode(["message" => "Invalid house status selection."]);
        exit();
    }

    $maintenanceDesc = null;
    if ($data->houseStatus === 'maintenance') {
        if (empty($data->maintenanceDescription)) {
            http_response_code(400);
            echo json_encode(["message" => "Maintenance description is required when house needs maintenance."]);
            exit();
        }
        $maintenanceDesc = trim($data->maintenanceDescription);
    }

    try {
        $query = "INSERT INTO inform_house_requests 
                  (informer_id, campus_id, block, house_type, house_status, maintenance_description, status) 
                  VALUES 
                  (:informer_id, :campus_id, :block, :house_type, :house_status, :maintenance_description, 'pending')";

        $stmt = $db->prepare($query);

        $informerId = (int)$data->informerId;
        $campusId = (int)$data->campusId;
        $block = trim($data->block);
        $houseType = $data->houseType;
        $houseStatus = $data->houseStatus;

        $stmt->bindParam(":informer_id", $informerId);
        $stmt->bindParam(":campus_id", $campusId);
        $stmt->bindParam(":block", $block);
        $stmt->bindParam(":house_type", $houseType);
        $stmt->bindParam(":house_status", $houseStatus);
        $stmt->bindParam(":maintenance_description", $maintenanceDesc);

        if ($stmt->execute()) {
            http_response_code(201);
            echo json_encode([
                "message" => "House nomination request submitted successfully.",
                "id" => $db->lastInsertId()
            ]);
        } else {
            http_response_code(503);
            echo json_encode(["message" => "Unable to submit nomination request."]);
        }
    } catch (Exception $e) {
        http_response_code(503);
        echo json_encode(["message" => "Database error.", "error" => $e->getMessage()]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "Incomplete request data."]);
}
?>
