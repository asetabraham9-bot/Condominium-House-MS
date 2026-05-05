<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

include_once '../../config/Database.php';

$database = new Database();
$db = $database->getConnection();

$userId = isset($_GET['userId']) ? $_GET['userId'] : null;

if (!$userId) {
    http_response_code(400);
    echo json_encode(["message" => "userId required"]);
    exit();
}

try {
    $query = "SELECT `application_id`, `status`, `score` FROM `applicant_details` WHERE `user_id` = :uid";
    $stmt = $db->prepare($query);
    $stmt->execute([':uid' => $userId]);

    if ($stmt->rowCount() > 0) {
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        echo json_encode(["record" => $row]);
    } else {
        echo json_encode(["record" => null]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Server error", "error" => $e->getMessage()]);
}
?>
