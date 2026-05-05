<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: PUT, POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../../config/Database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if(!empty($data->id) && !empty($data->status)){
    $query = "UPDATE resident_requests 
              SET status = :status
              WHERE id = :id";
              
    $stmt = $db->prepare($query);

    $id = htmlspecialchars(strip_tags($data->id));
    $status = htmlspecialchars(strip_tags($data->status));

    $stmt->bindParam(':id', $id);
    $stmt->bindParam(':status', $status);

    if($stmt->execute()){
        http_response_code(200);
        echo json_encode(array("message" => "Request status updated successfully."));
    } else{
        http_response_code(503);
        echo json_encode(array("message" => "Unable to update request status."));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Unable to update request status. Data is incomplete."));
}
?>
