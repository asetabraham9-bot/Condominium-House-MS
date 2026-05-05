<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../config/Database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->email) && !empty($data->password)) {
    // Check if user exists
    $query = "SELECT u.id, u.first_name, u.last_name, u.email, u.phone_number, u.password_hash, u.role, u.campus_id, c.name as campus_name 
              FROM users u 
              LEFT JOIN campuses c ON u.campus_id = c.id 
              WHERE u.email = :email";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':email', $data->email);

    if ($stmt->execute() && $stmt->rowCount() > 0) {
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (password_verify($data->password, $row['password_hash']) || $data->password === $row['password_hash']) {
            
            // Map DB role names → frontend role names
            $roleMap = [
                'system_admin'  => 'chms_admin',
                'campus_admin'  => 'campus_admin',
                'applicant'     => 'applicant',
            ];
            $frontendRole = $roleMap[$row['role']] ?? $row['role'];

            http_response_code(200);
            echo json_encode(array(
                "message" => "Login successful.",
                "user" => array(
                    "id"         => (string)$row['id'],
                    "firstName"  => $row['first_name'],
                    "lastName"   => $row['last_name'],
                    "email"      => $row['email'],
                    "phone"      => $row['phone_number'],
                    "role"       => $frontendRole,
                    "campusId"   => $row['campus_id'] ? (string)$row['campus_id'] : null,
                    "campusName" => $row['campus_name'] ?? null,
                ),
                "token" => "mock-jwt-token-replace-later"
            ));
        } else {
            http_response_code(401);
            echo json_encode(array("message" => "Invalid password. Please try again."));
        }
    } else {
        http_response_code(404);
        echo json_encode(array("message" => "No account found with that email."));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Incomplete data."));
}
?>
