<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

include_once '../../config/Database.php';

$database = new Database();
$db = $database->getConnection();

$campus_id = isset($_GET['campus_id']) ? $_GET['campus_id'] : die();

$query = "SELECT req.id, req.request_type, req.priority, req.description, req.status, req.created_at, 
          u.first_name, u.last_name, h.house_number, b.name as block_name
          FROM resident_requests req
          JOIN residents r ON req.resident_id = r.id
          JOIN users u ON r.user_id = u.id
          JOIN houses h ON r.house_id = h.id
          JOIN blocks b ON h.block_id = b.id
          WHERE req.campus_id = :campus_id 
          ORDER BY 
            CASE req.priority
                WHEN 'urgent' THEN 1
                WHEN 'high' THEN 2
                WHEN 'medium' THEN 3
                WHEN 'low' THEN 4
            END ASC, req.created_at DESC";

$stmt = $db->prepare($query);
$stmt->bindParam(':campus_id', $campus_id);
$stmt->execute();

$requests_arr = array();
$requests_arr["records"] = array();

while ($row = $stmt->fetch(PDO::FETCH_ASSOC)){
    $request_item = array(
        "id" => $row['id'],
        "residentName" => $row['first_name'] . ' ' . $row['last_name'],
        "houseDetails" => $row['block_name'] . ' - ' . $row['house_number'],
        "type" => $row['request_type'],
        "priority" => $row['priority'],
        "description" => $row['description'],
        "status" => $row['status'],
        "createdAt" => $row['created_at']
    );
    array_push($requests_arr["records"], $request_item);
}

http_response_code(200);
echo json_encode($requests_arr);
?>
