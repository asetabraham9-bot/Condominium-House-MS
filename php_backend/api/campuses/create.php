<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

include_once '../../config/Database.php';
$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

// Required: campus name, location
// Optional but recommended: admin details
if (empty($data->campusName) || empty($data->location)) {
    http_response_code(400);
    echo json_encode(["message" => "Campus name and location are required."]);
    exit();
}

// Validate admin fields if admin is being created
$createAdmin = !empty($data->adminFirstName) && !empty($data->adminLastName) &&
               !empty($data->adminEmail) && !empty($data->adminPassword);

// Check if admin email already exists
if ($createAdmin) {
    $emailCheck = $db->prepare("SELECT id FROM users WHERE email = :email");
    $emailCheck->bindParam(':email', $data->adminEmail);
    $emailCheck->execute();
    if ($emailCheck->rowCount() > 0) {
        http_response_code(409);
        echo json_encode(["message" => "A user with this admin email already exists."]);
        exit();
    }
}

try {
    $db->beginTransaction();

    // 1. Insert the campus
    $q1 = "INSERT INTO campuses (name, location) VALUES (:name, :location)";
    $s1 = $db->prepare($q1);
    $s1->bindParam(':name',     $data->campusName);
    $s1->bindParam(':location', $data->location);
    $s1->execute();
    $campusId = $db->lastInsertId();

    $adminId = null;
    if ($createAdmin) {
        // 2. Hash the admin password
        $hash = password_hash($data->adminPassword, PASSWORD_BCRYPT);
        $phone = !empty($data->adminPhone) ? $data->adminPhone : null;

        // 3. Insert the campus admin user
        $q2 = "INSERT INTO users (first_name, last_name, email, password_hash, phone_number, role, campus_id)
                VALUES (:fn, :ln, :email, :hash, :phone, 'campus_admin', :campusId)";
        $s2 = $db->prepare($q2);
        $s2->bindParam(':fn',       $data->adminFirstName);
        $s2->bindParam(':ln',       $data->adminLastName);
        $s2->bindParam(':email',    $data->adminEmail);
        $s2->bindParam(':hash',     $hash);
        $s2->bindParam(':phone',    $phone);
        $s2->bindParam(':campusId', $campusId);
        $s2->execute();
        $adminId = $db->lastInsertId();
    }

    $db->commit();

    http_response_code(201);
    echo json_encode([
        "message"  => $createAdmin
            ? "Campus and Campus Admin created successfully."
            : "Campus created successfully. You can add an admin later.",
        "campusId" => $campusId,
        "adminId"  => $adminId,
    ]);

} catch (Exception $e) {
    $db->rollBack();
    http_response_code(503);
    echo json_encode(["message" => "Failed to create campus.", "error" => $e->getMessage()]);
}
?>
