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
            a.house_images AS houseImages,
            a.deadline,
            a.status,
            a.created_at AS createdAt,
            c.name AS campusName,
            b.name AS blockName
          FROM applications a
          LEFT JOIN campuses c ON a.campus_id = c.id
          LEFT JOIN blocks b ON a.block_id = b.id
          ORDER BY a.created_at DESC";

    $stmt = $db->query($query);
    $records = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Fetch all house configurations from database
    $q_conf = "SELECT ah.id, ah.application_id, ah.house_type, ah.campus_id, c.name as campusName, ah.monthly_payment, ah.number_of_houses
               FROM application_houses ah
               LEFT JOIN campuses c ON ah.campus_id = c.id";
    $stmt_conf = $db->query($q_conf);
    $all_confs = $stmt_conf->fetchAll(PDO::FETCH_ASSOC);

    $confs_by_app = [];
    foreach ($all_confs as $conf) {
        $app_id = $conf['application_id'];
        if (!isset($confs_by_app[$app_id])) {
            $confs_by_app[$app_id] = [];
        }
        $confs_by_app[$app_id][] = [
            'id' => $conf['id'],
            'houseType' => $conf['house_type'],
            'campusId' => $conf['campus_id'],
            'campusName' => $conf['campusName'],
            'monthlyPayment' => (float)$conf['monthly_payment'],
            'numberOfHouses' => (int)$conf['number_of_houses']
        ];
    }

    foreach ($records as &$row) {
        $raw = isset($row['houseImages']) ? $row['houseImages'] : null;
        if ($raw !== null && $raw !== '') {
            $dec = json_decode((string)$raw, true);
            $row['houseImages'] = is_array($dec) ? $dec : [];
        } else {
            $row['houseImages'] = [];
        }
        $row['houseConfigurations'] = isset($confs_by_app[$row['id']]) ? $confs_by_app[$row['id']] : [];
    }
    unset($row);

    http_response_code(200);
    echo json_encode(["records" => $records]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Server error", "error" => $e->getMessage()]);
}
