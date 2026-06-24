<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

include_once '../../config/Database.php';

$database = new Database();
$db = $database->getConnection();

$campus_id = isset($_GET['campus_id']) ? $_GET['campus_id'] : null;
$block_id = isset($_GET['block_id']) ? $_GET['block_id'] : null;

$query = "SELECT h.*, b.name as blockName, b.id as blockId, c.id as campusId, c.name as campusName
          FROM houses h
          JOIN blocks b ON h.block_id = b.id
          JOIN campuses c ON b.campus_id = c.id";

$conditions = [];
$params = [];

if ($campus_id) {
    $conditions[] = "b.campus_id = :campus_id";
    $params[':campus_id'] = $campus_id;
}

if ($block_id) {
    $conditions[] = "h.block_id = :block_id";
    $params[':block_id'] = $block_id;
}

if (!empty($conditions)) {
    $query .= " WHERE " . implode(" AND ", $conditions);
}

$query .= " ORDER BY b.name, h.house_number";

$stmt = $db->prepare($query);

foreach ($params as $key => $val) {
    $stmt->bindValue($key, $val);
}

$stmt->execute();

$houses_arr = array();
$houses_arr["records"] = array();

while ($row = $stmt->fetch(PDO::FETCH_ASSOC)){
    $houseId = $row['id'];
    
    // Fetch images for this house (optional, catch error if table doesn't exist yet)
    $images = [];
    try {
        $imgQ = "SELECT image_path FROM house_images WHERE house_id = :hid";
        $imgStmt = $db->prepare($imgQ);
        $imgStmt->execute([':hid' => $houseId]);
        $images = $imgStmt->fetchAll(PDO::FETCH_COLUMN);
    } catch (Exception $e) {
        // Table might not exist, ignore
    }
    
    $house_item = array(
        "id" => (string)$row['id'],
        "blockId" => (string)$row['blockId'],
        "houseNumber" => $row['house_number'],
        "houseType" => $row['house_type'] ?? null,
        "house_type" => $row['house_type'] ?? null,
        "price" => isset($row['price']) ? (float)$row['price'] : 0,
        "monthlyPayment" => isset($row['monthly_payment']) ? (float)$row['monthly_payment'] : 0,
        "monthly_payment" => isset($row['monthly_payment']) ? (string)$row['monthly_payment'] : null,
        "location" => $row['location'] ?? null,
        "bedrooms" => isset($row['bedrooms']) ? (int)$row['bedrooms'] : 0,
        "bathrooms" => isset($row['bathrooms']) ? (int)$row['bathrooms'] : 0,
        "description" => $row['description'] ?? null,
        "electricService" => isset($row['electric_service']) ? (string)$row['electric_service'] : 'yes',
        "waterService" => isset($row['water_service']) ? (string)$row['water_service'] : 'yes',
        "status" => $row['status'],
        "blockName" => $row['blockName'],
        "campusId" => isset($row['campusId']) ? (string)$row['campusId'] : null,
        "campusName" => $row['campusName'],
        "createdAt" => $row['created_at'],
        "updatedAt" => $row['updated_at'],
        "images" => $images
    );
    
    array_push($houses_arr["records"], $house_item);
}

http_response_code(200);
echo json_encode($houses_arr);
?>
