<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: DELETE, POST");
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

// Alternatively might come from $_GET['id'] for RESTful
$id = isset($_GET['id']) ? $_GET['id'] : (isset($data->id) ? $data->id : die());

$query = "DELETE FROM blocks WHERE id = :id";

$stmt = $db->prepare($query);

$id=htmlspecialchars(strip_tags($id));
$stmt->bindParam(':id', $id);

if($stmt->execute()){
    http_response_code(200);
    echo json_encode(array("message" => "Block was deleted."));
} else{
    http_response_code(503);
    echo json_encode(array("message" => "Unable to delete block."));
}
?>
