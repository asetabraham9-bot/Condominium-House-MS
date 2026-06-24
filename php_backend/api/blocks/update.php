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

$id_raw = isset($data->id) ? $data->id : null;
$name_raw = isset($data->name) ? $data->name : null;
$total_houses_raw = isset($data->total_houses) ? $data->total_houses : null;

$total_houses_int = is_numeric($total_houses_raw) ? (int)$total_houses_raw : null;

if(
    $id_raw !== null && $id_raw !== '' &&
    $name_raw !== null && trim((string)$name_raw) !== '' &&
    $total_houses_int !== null && $total_houses_int >= 0
){
    $query = "UPDATE blocks 
              SET name = :name, total_houses = :total_houses
              WHERE id = :id";
              
    $stmt = $db->prepare($query);

    $id = htmlspecialchars(strip_tags((string)$id_raw));
    $name = htmlspecialchars(strip_tags((string)$name_raw));
    $total_houses = $total_houses_int;

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
    echo json_encode(array("message" => "Unable to update block. Data is incomplete.", "required" => ["id", "name", "total_houses>=0"]));
}
?>
