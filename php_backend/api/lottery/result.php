<?php
// Read applicant's lottery result from applicant_details
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

include_once '../../config/Database.php';
$database = new Database();
$db = $database->getConnection();

$userId = isset($_GET['userId']) ? (int)$_GET['userId'] : null;

if (!$userId) {
    http_response_code(400);
    echo json_encode(["message" => "userId is required."]);
    exit();
}

$query = "SELECT 
            ad.user_id,
            ad.status,
            ad.score,
            ad.academic_level AS academicLevel,
            ad.years_of_service AS yearsOfService,
            ad.job_responsibility AS jobResponsibility,
            ad.marital_status AS maritalStatus,
            ad.gender,
            ad.is_disabled AS isDisabled,
            CONCAT(u.first_name, ' ', u.last_name) AS applicantName,
            u.email,
            c.name AS campusName,
            -- Check if placed (has resident record)
            r.id AS residentId,
            h.house_number AS houseNumber,
            b.name AS blockName,
            r.assigned_date AS assignedDate
          FROM applicant_details ad
          JOIN users u ON ad.user_id = u.id
          LEFT JOIN campuses c ON u.campus_id = c.id
          LEFT JOIN residents r ON r.user_id = u.id AND r.status = 'active'
          LEFT JOIN houses h ON r.house_id = h.id
          LEFT JOIN blocks b ON h.block_id = b.id
          WHERE ad.user_id = :userId";

$stmt = $db->prepare($query);
$stmt->bindParam(':userId', $userId);
$stmt->execute();

$row = $stmt->fetch(PDO::FETCH_ASSOC);

if ($row) {
    $row['score'] = (int)$row['score'];
    $row['yearsOfService'] = (int)$row['yearsOfService'];
    $row['isDisabled'] = (bool)$row['isDisabled'];
    http_response_code(200);
    echo json_encode(["applicant" => $row]);
} else {
    http_response_code(404);
    echo json_encode(["message" => "No applicant record found."]);
}
?>
