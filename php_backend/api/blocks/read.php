<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../../config/Database.php';

$database = new Database();
$db = $database->getConnection();

$campus_id = isset($_GET['campus_id']) ? $_GET['campus_id'] : null;

$query = "SELECT b.id, b.name as blockName, b.total_houses, b.occupied_houses, b.available_houses, c.name as campus, b.campus_id, b.created_at, b.updated_at 
          FROM blocks b
          JOIN campuses c ON b.campus_id = c.id";

if ($campus_id) {
    $query .= " WHERE b.campus_id = :campus_id";
}

$query .= " ORDER BY b.created_at DESC";

$stmt = $db->prepare($query);

if ($campus_id) {
    $stmt->bindParam(':campus_id', $campus_id);
}

$stmt->execute();

$blocks_arr = array();
$blocks_arr["records"] = array();

while ($row = $stmt->fetch(PDO::FETCH_ASSOC)){
    $block_item = array(
        "id" => (string)$row['id'],
        "blockName" => $row['blockName'],
        "totalHouses" => (int)$row['total_houses'],
        "occupiedHouses" => (int)$row['occupied_houses'],
        "availableHouses" => (int)$row['available_houses'],
        "campus" => $row['campus'],
        "campusId" => (string)$row['campus_id'],
        "createdAt" => $row['created_at'],
        "updatedAt" => $row['updated_at']
    );
    array_push($blocks_arr["records"], $block_item);
}

http_response_code(200);
echo json_encode($blocks_arr);
?>
