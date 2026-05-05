<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

include_once '../../config/Database.php';
$database = new Database();
$db = $database->getConnection();

$query = "SELECT 
            u.id,
            u.first_name,
            u.last_name,
            CONCAT(u.first_name, ' ', u.last_name) AS applicantName,
            u.email,
            u.phone_number,
            u.created_at AS registrationDate,
            c.name AS campusName,
            ad.status,
            ad.score,
            ad.academic_level AS academicLevel,
            ad.years_of_service AS yearsOfService,
            ad.marital_status AS maritalStatus,
            ad.job_responsibility AS jobResponsibility,
            ad.gender,
            ad.is_disabled AS isDisabled
          FROM users u
          JOIN applicant_details ad ON u.id = ad.user_id
          LEFT JOIN campuses c ON u.campus_id = c.id
          WHERE u.role = 'applicant'
          ORDER BY ad.score DESC, u.created_at DESC";

$stmt = $db->prepare($query);
$stmt->execute();

$records = [];
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $row['id'] = (string)$row['id'];
    $row['score'] = (int)$row['score'];
    $row['yearsOfService'] = (int)$row['yearsOfService'];
    $row['isDisabled'] = (bool)$row['isDisabled'];
    $row['registrationDate'] = date('Y-m-d', strtotime($row['registrationDate']));
    $records[] = $row;
}

http_response_code(200);
echo json_encode(["records" => $records, "total" => count($records)]);
?>
