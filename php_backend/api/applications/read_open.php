<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../../config/Database.php';

$database = new Database();
$db = $database->getConnection();

try {
    $query = "SELECT 
            a.id,
            a.title,
            a.round_label AS roundLabel,
            a.description,
            a.house_details AS houseDetails,
            a.monthly_payment AS monthlyPayment,
            a.application_fee AS applicationFee,
            a.electricity_service AS electricityService,
            a.water_service AS waterService,
            a.house_type AS houseType,
            a.campus_id AS campusId,
            a.block_id AS blockId,
            a.house_number AS houseNumber,
            a.bedrooms,
            a.bathrooms,
            a.deadline,
            a.status,
            a.created_at AS createdAt,
            c.name AS campusName,
            b.name AS blockName
          FROM applications a
          LEFT JOIN campuses c ON a.campus_id = c.id
          LEFT JOIN blocks b ON a.block_id = b.id
          WHERE a.status = 'open'
          ORDER BY a.created_at DESC
          LIMIT 1";

    $stmt = $db->query($query);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($row) {
        http_response_code(200);
        echo json_encode(["cycle" => $row]);
    } else {
        http_response_code(200);
        echo json_encode(["message" => "No open cycles found", "cycle" => null]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Server error", "error" => $e->getMessage()]);
}
