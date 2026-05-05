<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

include_once '../../config/Database.php';
$database = new Database();
$db = $database->getConnection();

// Fetch applicants that are lottery_won (awaiting placement) or pending
$status = isset($_GET['status']) ? $_GET['status'] : 'pending';
$allowed = ['pending', 'lottery_won', 'approved', 'placed'];
if (!in_array($status, $allowed)) $status = 'pending';

$q = "SELECT ad.user_id as id, CONCAT(u.first_name, ' ', u.last_name) as applicantName,
             u.email, ad.score, ad.academic_level as academicLevel, 
             ad.years_of_service as yearsOfService, ad.status,
             c.name as campusName, u.campus_id as campusId
      FROM applicant_details ad
      JOIN users u ON ad.user_id = u.id
      LEFT JOIN campuses c ON u.campus_id = c.id
      WHERE ad.status = :status
      ORDER BY ad.score DESC";

$stmt = $db->prepare($q);
$stmt->bindParam(':status', $status);
$stmt->execute();
$records = [];
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $row['score'] = (int)$row['score'];
    $row['yearsOfService'] = (int)$row['yearsOfService'];
    $records[] = $row;
}
echo json_encode(["records" => $records]);
?>
