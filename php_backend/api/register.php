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
    // Validation
    if (!filter_var($data->email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(array("message" => "Invalid email format."));
        exit();
    }

    if (strlen($data->password) < 8 || 
        !preg_match("/[A-Z]/", $data->password) || 
        !preg_match("/[a-z]/", $data->password) || 
        !preg_match("/[0-9]/", $data->password) || 
        !preg_match("/[^A-Za-z0-9]/", $data->password)) {
        http_response_code(400);
        echo json_encode(array("message" => "Password must be at least 8 characters long and contain upper case, lower case, numbers, and special characters."));
        exit();
    }

    if (!is_string($data->firstName) || !is_string($data->lastName)) {
        http_response_code(400);
        echo json_encode(array("message" => "First name and last name must be strings."));
        exit();
    }

    // Validate campus exists
    $campusId = intval($data->campusId);
    $campusQuery = "SELECT id, name FROM campuses WHERE id = :cid";
    $campusStmt = $db->prepare($campusQuery);
    $campusStmt->bindParam(':cid', $campusId, PDO::PARAM_INT);
    $campusStmt->execute();
    $campusRow = $campusStmt->fetch(PDO::FETCH_ASSOC);
    if (!$campusRow) {
        http_response_code(400);
        echo json_encode(array("message" => "Invalid campus selected."));
        exit();
    }

    try {
        // Insert into Users table
        $query = "INSERT INTO users (`first_name`, `last_name`, `email`, `password_hash`, `role`, `campus_id`) 
                  VALUES (:fname, :lname, :email, :password, 'applicant', :campus_id)";
        $stmt = $db->prepare($query);

        $password_hash = password_hash($data->password, PASSWORD_BCRYPT);
        
        $stmt->bindParam(":fname", $data->firstName);
        $stmt->bindParam(":lname", $data->lastName);
        $stmt->bindParam(":email", $data->email);
        $stmt->bindParam(":password", $password_hash);
        $stmt->bindParam(":campus_id", $campusId, PDO::PARAM_INT);

        if($stmt->execute()){
            $user_id = $db->lastInsertId();

            http_response_code(201);
            echo json_encode(array(
                "message" => "Registration successful.",
                "user" => array(
                    "id" => (string)$user_id,
                    "firstName" => $data->firstName,
                    "lastName" => $data->lastName,
                    "email" => $data->email,
                    "role" => "applicant",
                    "campusId" => (string)$campusId,
                    "campusName" => $campusRow['name']
                )
            ));
        } else {
            http_response_code(503);
            echo json_encode(array("message" => "Unable to register user."));
        }

    } catch (Exception $e) {
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
