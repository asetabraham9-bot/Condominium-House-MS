<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
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

// NOTE: PHP's empty() treats 0 as "empty", so validate explicitly
$campus_id_raw = isset($data->campus_id) ? $data->campus_id : null;
$name_raw = isset($data->name) ? $data->name : null;
$total_houses_raw = isset($data->total_houses) ? $data->total_houses : null;

$total_houses_int = is_numeric($total_houses_raw) ? (int)$total_houses_raw : 0;

if(
    $campus_id_raw !== null && $campus_id_raw !== '' &&
    $name_raw !== null && trim((string)$name_raw) !== '' &&
    $total_houses_int >= 0
){
    $query = "INSERT INTO blocks
            SET
                campus_id=:campus_id, name=:name, total_houses=:total_houses, 
                available_houses=:available_houses, occupied_houses=0";

    $stmt = $db->prepare($query);

    // sanitize
    $campus_id=htmlspecialchars(strip_tags((string)$campus_id_raw));
    $name=htmlspecialchars(strip_tags((string)$name_raw));
    $total_houses=$total_houses_int;
    
    // available houses equals total initially
    $available_houses = $total_houses;

    // bind values
    $stmt->bindParam(":campus_id", $campus_id);
    $stmt->bindParam(":name", $name);
    $stmt->bindParam(":total_houses", $total_houses);
    $stmt->bindParam(":available_houses", $available_houses);

    if($stmt->execute()){
        http_response_code(201);
        echo json_encode(array("message" => "Block was created."));
    } else{
        http_response_code(503);
        echo json_encode(array("message" => "Unable to create block."));
    }
} else{
    http_response_code(400);
    echo json_encode(array("message" => "Unable to create block. Data is incomplete.", "required" => ["campus_id", "name", "total_houses>0"]));
}
?>
