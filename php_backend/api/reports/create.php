<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../../config/Database.php';

$database = new Database();
$db = $database->getConnection();

// File upload handling
// Check if is a valid call
$uploader_id = isset($_POST['uploader_id']) ? $_POST['uploader_id'] : null;
$campus_id = isset($_POST['campus_id']) ? $_POST['campus_id'] : null;
$report_type = isset($_POST['report_type']) ? $_POST['report_type'] : null;
$description = isset($_POST['description']) ? $_POST['description'] : null;
$generated_date = isset($_POST['generated_date']) ? $_POST['generated_date'] : date('Y-m-d');

if ($uploader_id && $campus_id && $report_type && $description) {
    
    $file_path = null;

    if(isset($_FILES['file']) && $_FILES['file']['error'] === UPLOAD_ERR_OK) {
        $upload_dir = '../../uploads/reports/';
        if (!is_dir($upload_dir)) {
            mkdir($upload_dir, 0777, true);
        }
        
        $file_name = time() . '_' . basename($_FILES["file"]["name"]);
        $target_file = $upload_dir . $file_name;
        
        if (move_uploaded_file($_FILES["file"]["tmp_name"], $target_file)) {
            $file_path = 'uploads/reports/' . $file_name;
        }
    }

    $query = "INSERT INTO reports (uploader_id, campus_id, report_type, description, file_path, generated_date)
              VALUES (:uploader_id, :campus_id, :report_type, :description, :file_path, :generated_date)";

    $stmt = $db->prepare($query);

    $stmt->bindParam(":uploader_id", $uploader_id);
    $stmt->bindParam(":campus_id", $campus_id);
    $stmt->bindParam(":report_type", $report_type);
    $stmt->bindParam(":description", $description);
    $stmt->bindParam(":file_path", $file_path);
    $stmt->bindParam(":generated_date", $generated_date);

    if($stmt->execute()){
        http_response_code(201);
        echo json_encode(array("message" => "Report generated successfully."));
    } else{
        http_response_code(503);
        echo json_encode(array("message" => "Unable to create report."));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Incomplete data for report generation."));
}
?>
