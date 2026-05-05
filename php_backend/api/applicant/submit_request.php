<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../../config/Database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if(
    !empty($data->residentId) &&
    !empty($data->campusId) &&
    !empty($data->requestType) &&
    !empty($data->description)
){
    try {
        $query = "INSERT INTO resident_requests 
                  (resident_id, campus_id, request_type, priority, description, status) 
                  VALUES 
                  (:rid, :cid, :type, :priority, :desc, 'pending')";

        $stmt = $db->prepare($query);

        $stmt->bindParam(":rid", $data->residentId);
        $stmt->bindParam(":cid", $data->campusId);
        
        // requestType can be 'leave_house', 'maintenance', 'other' (inquiry, complaint)
        $mapped_req_type = in_array($data->requestType, ['leave_house', 'maintenance']) ? $data->requestType : 'other';
        $stmt->bindParam(":type", $mapped_req_type);
        
        $priority = !empty($data->priority) ? $data->priority : 'medium';
        $stmt->bindParam(":priority", $priority);
        
        // Subject + Description combined for DB storage string
        $full_description = !empty($data->subject) ? "[$data->subject] " . $data->description : $data->description;
        $stmt->bindParam(":desc", $full_description);

        if($stmt->execute()){
            http_response_code(201);
            echo json_encode(array(
                "message" => "Request submitted successfully.",
                "id" => $db->lastInsertId()
            ));
        } else {
            http_response_code(503);
            echo json_encode(array("message" => "Unable to submit request.", "error" => $stmt->errorInfo()));
        }

    } catch (Exception $e) {
        http_response_code(503);
        echo json_encode(array("message" => "Database error.", "error" => $e->getMessage()));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Incomplete request data."));
}
?>
