<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

include_once '../config/Database.php';

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    http_response_code(503);
    echo json_encode(array("message" => "Database connection failed."));
    exit();
}

$data = json_decode(file_get_contents("php://input"));

if (!$data) {
    http_response_code(400);
    echo json_encode(array("message" => "Invalid or empty JSON body."));
    exit();
}

if(
    !empty($data->firstName) &&
    !empty($data->lastName) &&
    !empty($data->email) &&
    !empty($data->password) &&
    !empty($data->campusId)
){
    try {
        $db->beginTransaction();

        // 1. Insert into Users table
        $query = "INSERT INTO users (`first_name`, `last_name`, `email`, `password_hash`, `phone_number`, `role`, `campus_id`) 
                  VALUES (:fname, :lname, :email, :password, :phone, 'applicant', :campus)";
        $stmt = $db->prepare($query);

        $password_hash = password_hash($data->password, PASSWORD_BCRYPT);
        
        $stmt->bindParam(":fname", $data->firstName);
        $stmt->bindParam(":lname", $data->lastName);
        $stmt->bindParam(":email", $data->email);
        $stmt->bindParam(":password", $password_hash);
        $phone = isset($data->phone) ? $data->phone : null;
        $stmt->bindParam(":phone", $phone);
        $stmt->bindParam(":campus", $data->campusId);

        $stmt->execute();
        $user_id = $db->lastInsertId();

        // 2. Insert into applicant_details table
        $query2 = "INSERT INTO applicant_details 
                   (`user_id`, `gender`, `academic_level`, `years_of_service`, `marital_status`, `job_responsibility`, `is_disabled`, `score`) 
                   VALUES 
                   (:uid, :gender, :academic, :years, :marital_status, :job, :disabled, 0)";
        $stmt2 = $db->prepare($query2);

        $stmt2->bindParam(":uid", $user_id);
        $gender = isset($data->gender) ? $data->gender : null;
        $academic = isset($data->academicLevel) ? $data->academicLevel : null;
        $years = isset($data->yearsOfService) ? $data->yearsOfService : 0;
        $marital = isset($data->maritalStatus) ? $data->maritalStatus : null;
        $job = isset($data->jobResponsibility) ? $data->jobResponsibility : null;
        $disabled = isset($data->isDisabled) && $data->isDisabled ? 1 : 0;

        $stmt2->bindParam(":gender", $gender);
        $stmt2->bindParam(":academic", $academic);
        $stmt2->bindParam(":years", $years);
        $stmt2->bindParam(":marital_status", $marital);
        $stmt2->bindParam(":job", $job);
        $stmt2->bindParam(":disabled", $disabled);

        $stmt2->execute();
        
        // Fetch campus name for response
        $cQuery = "SELECT `name` FROM campuses WHERE `id` = :cid";
        $cStmt = $db->prepare($cQuery);
        $cStmt->execute([':cid' => $data->campusId]);
        $cRow = $cStmt->fetch(PDO::FETCH_ASSOC);
        $campusName = $cRow ? $cRow['name'] : null;

        $db->commit();

        http_response_code(201);
        echo json_encode(array(
            "message" => "Registration successful.",
            "user" => array(
                "id" => (string)$user_id,
                "firstName" => $data->firstName,
                "lastName" => $data->lastName,
                "email" => $data->email,
                "role" => "applicant",
                "campusId" => (string)$data->campusId,
                "campusName" => $campusName
            )
        ));

    } catch (Exception $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        $msg = $e->getMessage();
        if (strpos($msg, 'Duplicate') !== false || strpos($msg, '1062') !== false) {
            http_response_code(409);
            echo json_encode(array("message" => "An account with this email already exists."));
        } else {
            http_response_code(503);
            echo json_encode(array("message" => "Unable to register user.", "error" => $msg));
        }
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Incomplete data."));
}
?>
