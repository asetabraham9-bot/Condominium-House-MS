<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

include_once '../../config/Database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));
$id = isset($data->id) ? $data->id : (isset($_GET['id']) ? $_GET['id'] : null);

if($id){
    // Get block info to decrement counts
    $infoQ = "SELECT block_id, status FROM houses WHERE id = :id";
    $infoStmt = $db->prepare($infoQ);
    $infoStmt->execute([':id' => $id]);
    $house = $infoStmt->fetch(PDO::FETCH_ASSOC);

    if($house) {
        $query = "DELETE FROM houses WHERE id = :id";
        $stmt = $db->prepare($query);

        if($stmt->execute([':id' => $id])){
            // Decrement the block counts
            $blockId = $house['block_id'];
            if($house['status'] === 'available') {
                $db->query("UPDATE blocks SET available_houses = GREATEST(0, available_houses - 1) WHERE id = $blockId");
            } else {
                $db->query("UPDATE blocks SET occupied_houses = GREATEST(0, occupied_houses - 1) WHERE id = $blockId");
            }
            // Also decrement total
            $db->query("UPDATE blocks SET total_houses = GREATEST(0, total_houses - 1) WHERE id = $blockId");

            http_response_code(200);
            echo json_encode(["message" => "House deleted successfully."]);
        } else {
            http_response_code(503);
            echo json_encode(["message" => "Unable to delete house."]);
        }
    } else {
        http_response_code(404);
        echo json_encode(["message" => "House not found."]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "ID is required."]);
}
?>
