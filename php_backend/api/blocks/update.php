<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: PUT, POST");
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

if(!empty($data->id) && !empty($data->name) && !empty($data->total_houses)){
    $query = "UPDATE blocks 
              SET name = :name, total_houses = :total_houses
              WHERE id = :id";
              
    $stmt = $db->prepare($query);

    $id = htmlspecialchars(strip_tags($data->id));
    $name = htmlspecialchars(strip_tags($data->name));
    $total_houses = htmlspecialchars(strip_tags($data->total_houses));

    $stmt->bindParam(':id', $id);
    $stmt->bindParam(':name', $name);
    $stmt->bindParam(':total_houses', $total_houses);

    if($stmt->execute()){
        http_response_code(200);
        echo json_encode(array("message" => "Block was updated."));
    } else{
        http_response_code(503);
        echo json_encode(array("message" => "Unable to update block."));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Unable to update block. Data is incomplete."));
}
?>
