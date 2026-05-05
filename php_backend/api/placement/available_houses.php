<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

include_once '../../config/Database.php';
$database = new Database();
$db = $database->getConnection();

$campusId = isset($_GET['campusId']) ? (int)$_GET['campusId'] : null;

$q = "SELECT h.id, h.house_number as houseNumber, h.status,
             b.id as blockId, b.name as blockName,
             c.id as campusId, c.name as campusName
      FROM houses h
      JOIN blocks b ON h.block_id = b.id
      JOIN campuses c ON b.campus_id = c.id
      WHERE h.status = 'available'";

if ($campusId) {
    $q .= " AND b.campus_id = :campusId";
    $stmt = $db->prepare($q);
    $stmt->bindParam(':campusId', $campusId);
} else {
    $stmt = $db->prepare($q);
}

$stmt->execute();
$records = [];
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $records[] = $row;
}
echo json_encode(["records" => $records]);
?>
