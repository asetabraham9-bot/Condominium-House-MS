<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

include_once '../../config/Database.php';
$database = new Database();
$db = $database->getConnection();

$q = "SELECT r.id, r.report_type, r.description, r.file_path, r.generated_date, r.status, r.admin_feedback,
             c.name as campus_name, u.first_name, u.last_name, u.email, u.phone_number
      FROM reports r
      LEFT JOIN campuses c ON r.campus_id = c.id
      LEFT JOIN users u ON r.uploader_id = u.id
      ORDER BY r.created_at DESC";

$stmt = $db->prepare($q);
$stmt->execute();
$records = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode(["records" => $records]);
?>
