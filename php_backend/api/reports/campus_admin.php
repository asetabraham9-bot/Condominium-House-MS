<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

include_once '../../config/Database.php';
$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $campusId = isset($_GET['campusId']) ? (int)$_GET['campusId'] : null;

    if (!$campusId) {
        http_response_code(400);
        echo json_encode(["message" => "campusId is required."]);
        exit();
    }

    $q = "SELECT r.id, r.report_type as type, r.description, r.generated_date as date, r.file_path, r.status, r.created_at
          FROM reports r
          WHERE r.campus_id = :campusId
          ORDER BY r.created_at DESC";
    $stmt = $db->prepare($q);
    $stmt->execute([':campusId' => $campusId]);
    $records = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(["records" => $records]);
    exit();
}

if ($method === 'POST') {
    // Check if it's multipart/form-data
    $uploaderId = isset($_POST['uploaderId']) ? (int)$_POST['uploaderId'] : null;
    $campusId = isset($_POST['campusId']) ? (int)$_POST['campusId'] : null;
    $reportType = isset($_POST['reportType']) ? $_POST['reportType'] : null;
    $description = isset($_POST['description']) ? $_POST['description'] : null;
    $generatedDate = isset($_POST['generatedDate']) ? $_POST['generatedDate'] : null;

    // Support raw JSON if no file is sent
    if (!$uploaderId) {
        $data = json_decode(file_get_contents("php://input"));
        $uploaderId = $data->uploaderId ?? null;
        $campusId = $data->campusId ?? null;
        $reportType = $data->reportType ?? null;
        $description = $data->description ?? null;
        $generatedDate = $data->generatedDate ?? null;
    }

    if (!$uploaderId || !$campusId || !$reportType || !$description || !$generatedDate) {
        http_response_code(400);
        echo json_encode(["message" => "All required fields must be provided."]);
        exit();
    }

    $filePath = null;
    
    // Handle File Upload if exists
    if (isset($_FILES['reportFile']) && $_FILES['reportFile']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = '../../uploads/reports/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }
        
        $fileName = time() . '_' . basename($_FILES['reportFile']['name']);
        $targetFile = $uploadDir . $fileName;
        
        if (move_uploaded_file($_FILES['reportFile']['tmp_name'], $targetFile)) {
            $filePath = 'uploads/reports/' . $fileName;
        }
    }

    $q = "INSERT INTO reports (uploader_id, campus_id, report_type, description, file_path, generated_date, status)
          VALUES (:uploaderId, :campusId, :reportType, :description, :filePath, :generatedDate, 'pending')";
    $stmt = $db->prepare($q);
    
    if ($stmt->execute([
        ':uploaderId' => $uploaderId,
        ':campusId' => $campusId,
        ':reportType' => $reportType,
        ':description' => $description,
        ':filePath' => $filePath,
        ':generatedDate' => $generatedDate
    ])) {
        http_response_code(201);
        echo json_encode(["message" => "Report generated and submitted successfully.", "id" => $db->lastInsertId()]);
    } else {
        http_response_code(503);
        echo json_encode(["message" => "Failed to submit report. Please try again."]);
    }
}
?>
