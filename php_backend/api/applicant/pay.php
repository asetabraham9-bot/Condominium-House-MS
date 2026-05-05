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

include_once '../../config/Database.php';

$database = new Database();
$db = $database->getConnection();

// Parse data
$userId = isset($_POST['userId']) ? $_POST['userId'] : null;
$amount = isset($_POST['amount']) ? $_POST['amount'] : null;
$paymentMethod = isset($_POST['paymentMethod']) ? $_POST['paymentMethod'] : null;
$referenceNumber = isset($_POST['referenceNumber']) ? $_POST['referenceNumber'] : null;
$paymentType = isset($_POST['paymentType']) ? $_POST['paymentType'] : 'residence_fee';
$transactionId = isset($_POST['transactionId']) ? $_POST['transactionId'] : null;

// File upload handling
$screenshotPath = null;
if (isset($_FILES['screenshot']) && $_FILES['screenshot']['error'] === UPLOAD_ERR_OK) {
    $upload_dir = '../../uploads/payments/';
    if (!is_dir($upload_dir)) {
        mkdir($upload_dir, 0777, true);
    }
    
    $file_name = time() . '_' . basename($_FILES["screenshot"]["name"]);
    $target_file = $upload_dir . $file_name;
    
    if (move_uploaded_file($_FILES["screenshot"]["tmp_name"], $target_file)) {
        $screenshotPath = 'uploads/payments/' . $file_name;
    }
}

if(
    !empty($userId) &&
    !empty($amount) &&
    !empty($paymentMethod) &&
    !empty($transactionId)
){
    try {
        $query = "INSERT INTO payments 
                  (user_id, amount, payment_type, payment_method, transaction_id, reference_number, screenshot_path, status, payment_date) 
                  VALUES 
                  (:uid, :amount, :ptype, :method, :tid, :ref, :screen, 'pending', NOW())";

        $stmt = $db->prepare($query);

        $stmt->bindParam(":uid", $userId);
        $amount_val = (float) $amount;
        $stmt->bindParam(":amount", $amount_val);
        $stmt->bindParam(":ptype", $paymentType);
        $stmt->bindParam(":method", $paymentMethod);
        $stmt->bindParam(":tid", $transactionId);
        $stmt->bindParam(":ref", $referenceNumber);
        $stmt->bindParam(":screen", $screenshotPath);

        if($stmt->execute()){
            http_response_code(201);
            echo json_encode(array(
                "message" => "Payment recorded successfully and is pending verification.",
                "id" => $db->lastInsertId()
            ));
        } else {
            http_response_code(503);
            echo json_encode(array("message" => "Unable to record payment.", "error" => $stmt->errorInfo()));
        }

    } catch (Exception $e) {
        http_response_code(503);
        echo json_encode(array("message" => "Database error.", "error" => $e->getMessage()));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Incomplete payment data."));
}
?>
