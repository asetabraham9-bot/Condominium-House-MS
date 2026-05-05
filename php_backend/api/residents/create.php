<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../../config/Database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if(!empty($data->user_id) && !empty($data->house_id) && !empty($data->campus_id)){
    $query = "INSERT INTO residents (user_id, house_id, campus_id, assigned_date, status)
              VALUES (:user_id, :house_id, :campus_id, :assigned_date, 'active')";

    $stmt = $db->prepare($query);

    $user_id = htmlspecialchars(strip_tags($data->user_id));
    $house_id = htmlspecialchars(strip_tags($data->house_id));
    $campus_id = htmlspecialchars(strip_tags($data->campus_id));
    $assigned_date = date('Y-m-d H:i:s');

    $stmt->bindParam(":user_id", $user_id);
    $stmt->bindParam(":house_id", $house_id);
    $stmt->bindParam(":campus_id", $campus_id);
    $stmt->bindParam(":assigned_date", $assigned_date);

    if($stmt->execute()){
        // Also update house status to occupied
        $updateHouse = $db->prepare("UPDATE houses SET status='occupied' WHERE id=:house_id");
        $updateHouse->bindParam(':house_id', $house_id);
        $updateHouse->execute();

        http_response_code(201);
        echo json_encode(array("message" => "Resident was created."));
    } else{
        http_response_code(503);
        echo json_encode(array("message" => "Unable to create resident."));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Incomplete data."));
}
?>
