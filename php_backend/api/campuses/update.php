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

if (empty($data->id) || empty($data->campusName) || empty($data->location)) {
    http_response_code(400);
    echo json_encode(["message" => "Campus ID, name, and location are required."]);
    exit();
}

$q = "UPDATE campuses SET name = :name, location = :location WHERE id = :id";
$stmt = $db->prepare($q);
$stmt->bindParam(':name',     $data->campusName);
$stmt->bindParam(':location', $data->location);
$stmt->bindParam(':id',       $data->id);

if ($stmt->execute()) {
    echo json_encode(["message" => "Campus updated successfully."]);
} else {
    http_response_code(503);
    echo json_encode(["message" => "Failed to update campus."]);
}
?>
