<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

include_once '../../config/Database.php';
$database = new Database();
$db = $database->getConnection();

$campusId = isset($_GET['campusId']) ? $_GET['campusId'] : null;

$query = "SELECT 
            rr.id,
            rr.resident_id as residentId,
            CONCAT(u.first_name, ' ', u.last_name) as residentName,
            rr.request_type as requestType,
            rr.priority,
            rr.description,
            rr.status,
            rr.created_at as dateSubmitted,
            h.house_number as houseNumber,
            b.name as blockName,
            c.name as campusName
          FROM resident_requests rr
          JOIN residents r ON rr.resident_id = r.id
          JOIN users u ON r.user_id = u.id
          JOIN houses h ON r.house_id = h.id
          JOIN blocks b ON h.block_id = b.id
          JOIN campuses c ON rr.campus_id = c.id";

if ($campusId) {
    $query .= " WHERE rr.campus_id = :campusId ORDER BY rr.created_at DESC";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':campusId', $campusId);
} else {
    $query .= " ORDER BY rr.created_at DESC";
    $stmt = $db->prepare($query);
}

$stmt->execute();
$records = [];

while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    // Parse subject from description if prefixed with [subject]
    $desc = $row['description'];
    $subject = ucfirst($row['requestType']);
    if (preg_match('/^\[(.*?)\] (.*)$/s', $desc, $m)) {
        $subject = $m[1];
        $desc = $m[2];
    }
    $row['subject'] = $subject;
    $row['description'] = $desc;
    $row['dateSubmitted'] = date("Y-m-d", strtotime($row['dateSubmitted']));
    $records[] = $row;
}

http_response_code(200);
echo json_encode(["records" => $records]);
?>
