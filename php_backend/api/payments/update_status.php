<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../../config/Database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (empty($data->id) || empty($data->status)) {
    http_response_code(400);
    echo json_encode(["message" => "Payment id and status are required."]);
    exit();
}

$allowed = ['verified', 'rejected'];
if (!in_array($data->status, $allowed, true)) {
    http_response_code(400);
    echo json_encode(["message" => "Status must be verified or rejected."]);
    exit();
}

$paymentId = (int)$data->id;
$verifiedBy = isset($data->verifiedBy) && $data->verifiedBy !== '' ? (int)$data->verifiedBy : null;

try {
    $q = "UPDATE payments
          SET status = :status,
              verified_by = :verified_by,
              verified_at = NOW()
          WHERE id = :id AND status = 'pending'";
    $stmt = $db->prepare($q);
    $stmt->bindParam(':status', $data->status);
    if ($verifiedBy === null) {
        $stmt->bindValue(':verified_by', null, PDO::PARAM_NULL);
    } else {
        $stmt->bindValue(':verified_by', $verifiedBy, PDO::PARAM_INT);
    }
    $stmt->bindValue(':id', $paymentId, PDO::PARAM_INT);

    if (!$stmt->execute()) {
        http_response_code(503);
        echo json_encode(["message" => "Unable to update payment."]);
        exit();
    }

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(["message" => "Payment not found or not pending."]);
        exit();
    }

    http_response_code(200);
    echo json_encode(["message" => "Payment status updated."]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Server error.", "error" => $e->getMessage()]);
}
?>
