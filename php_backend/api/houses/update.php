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

if(!empty($data->id) && !empty($data->houseNumber)){
    $query = "UPDATE houses SET 
        house_number = :hnum,
        house_type = :htype,
        monthly_payment = :mpayment,
        bedrooms = :beds,
        bathrooms = :baths,
        electric_service = :eservice,
        water_service = :wservice
        WHERE id = :id";
    $stmt = $db->prepare($query);

    $params = [
        ':hnum' => $data->houseNumber,
        ':htype' => isset($data->houseType) ? $data->houseType : null,
        ':mpayment' => isset($data->monthlyPayment) ? $data->monthlyPayment : 0.00,
        ':beds' => isset($data->bedrooms) ? $data->bedrooms : 0,
        ':baths' => isset($data->bathrooms) ? $data->bathrooms : 0,
        ':eservice' => isset($data->electricService) ? $data->electricService : 'yes',
        ':wservice' => isset($data->waterService) ? $data->waterService : 'yes',
        ':id' => $data->id
    ];

    if($stmt->execute($params)){
        http_response_code(200);
        echo json_encode(["message" => "House updated successfully."]);
    } else {
        http_response_code(503);
        echo json_encode(["message" => "Unable to update house."]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "Incomplete data."]);
}
?>
