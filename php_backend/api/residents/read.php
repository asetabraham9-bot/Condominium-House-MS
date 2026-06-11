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

$query = "SELECT 
            r.id,
            r.user_id AS userId,
            CONCAT(u.first_name, ' ', u.last_name) AS residentName,
            u.email, u.phone_number AS phone,
            r.status AS residenceStatus,
            r.assigned_date AS moveInDate,
            r.leave_date AS leaveDate,
            h.house_number AS houseNumber,
            h.id AS houseId,
            h.house_type AS houseType,
            b.name AS blockName,
            b.id AS blockId,
            c.name AS campusName,
            c.id AS campusId,
            ad.academic_level AS academicLevel,
            ad.job_responsibility AS jobResponsibility,
            ad.gender,
            ad.score
          FROM residents r
          JOIN users u ON r.user_id = u.id
          JOIN houses h ON r.house_id = h.id
          JOIN blocks b ON h.block_id = b.id
          JOIN campuses c ON r.campus_id = c.id
          LEFT JOIN applicant_details ad ON r.user_id = ad.user_id";

if ($campusId) {
    $query .= " WHERE r.campus_id = :campusId ORDER BY r.assigned_date DESC";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':campusId', $campusId);
} else {
    $query .= " ORDER BY r.assigned_date DESC";
    $stmt = $db->prepare($query);
}

$stmt->execute();
$records = [];
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $row['id'] = (string)$row['id'];
    $row['userId'] = (string)$row['userId'];
    $row['score'] = (int)$row['score'];
    if ($row['moveInDate']) $row['moveInDate'] = date('Y-m-d', strtotime($row['moveInDate']));
    $records[] = $row;
}

http_response_code(200);
echo json_encode(["records" => $records, "total" => count($records)]);
?>
