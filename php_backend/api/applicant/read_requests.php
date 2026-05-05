<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../../config/Database.php';

$database = new Database();
$db = $database->getConnection();

$residentId = isset($_GET['residentId']) ? $_GET['residentId'] : null;

$query = "SELECT req.id, req.resident_id as residentId, CONCAT(u.first_name, ' ', u.last_name) as residentName, 
                 req.request_type as requestType, req.priority, req.description, req.status, 
                 req.created_at as dateSubmitted,
                 h.house_number as houseNumber,
                 b.name as blockName
          FROM resident_requests req
          JOIN residents r ON req.resident_id = r.id
          JOIN users u ON r.user_id = u.id
          JOIN houses h ON r.house_id = h.id
          JOIN blocks b ON h.block_id = b.id";

if ($residentId) {
    $query .= " WHERE req.resident_id = :rid ORDER BY req.created_at DESC";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':rid', $residentId);
} else {
    $query .= " ORDER BY req.created_at DESC";
    $stmt = $db->prepare($query);
}

$stmt->execute();

$requests_arr = array();
$requests_arr["records"] = array();

while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    // Basic Parsing of `description` if it contains a [subject] block. 
    $desc = $row['description'];
    $subject = "Report";
    if (preg_match('/^\[(.*?)\] (.*)$/s', $desc, $matches)) {
        $subject = $matches[1];
        $desc = $matches[2];
    }
    
    $req_item = array(
        "id" => $row['id'],
        "residentId" => $row['residentId'],
        "residentName" => $row['residentName'],
        "requestType" => $row['requestType'],
        "subject" => $subject,
        "description" => $desc,
        "priority" => $row['priority'],
        "status" => $row['status'],
        "dateSubmitted" => date("Y-m-d", strtotime($row['dateSubmitted'])),
        "houseNumber" => $row['houseNumber'],
        "blockName" => $row['blockName']
    );

    array_push($requests_arr["records"], $req_item);
}

http_response_code(200);
echo json_encode($requests_arr);
?>
