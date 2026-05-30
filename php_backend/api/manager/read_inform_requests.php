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

try {
    $query = "SELECT 
                ihr.id,
                ihr.informer_id,
                ihr.campus_id,
                ihr.block,
                ihr.house_type AS houseType,
                ihr.house_status AS houseStatus,
                ihr.maintenance_description AS maintenanceDescription,
                ihr.status,
                ihr.forwarded_to_admin AS forwardedToAdmin,
                ihr.created_at AS createdAt,
                CONCAT(inf.first_name, ' ', inf.last_name) AS informerName,
                inf_c.name AS informerCampusName,
                c.name AS houseCampusName
              FROM inform_house_requests ihr
              JOIN users inf ON ihr.informer_id = inf.id
              LEFT JOIN campuses inf_c ON inf.campus_id = inf_c.id
              JOIN campuses c ON ihr.campus_id = c.id
              ORDER BY c.name ASC, ihr.created_at DESC";

    $stmt = $db->prepare($query);
    $stmt->execute();

    $records = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $row['id'] = (string)$row['id'];
        $row['informer_id'] = (string)$row['informer_id'];
        $row['campus_id'] = (string)$row['campus_id'];
        $row['forwardedToAdmin'] = (bool)$row['forwardedToAdmin'];
        $row['createdAt'] = date('Y-m-d H:i:s', strtotime($row['createdAt']));
        $records[] = $row;
    }

    http_response_code(200);
    echo json_encode(["records" => $records]);
} catch (Exception $e) {
    http_response_code(503);
    echo json_encode(["message" => "Database error.", "error" => $e->getMessage()]);
}
?>
