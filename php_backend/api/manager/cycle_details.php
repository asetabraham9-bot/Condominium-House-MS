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

if (!$db) {
    http_response_code(503);
    echo json_encode(["message" => "Database connection failed."]);
    exit();
}

if (empty($_GET['id'])) {
    http_response_code(400);
    echo json_encode(["message" => "Missing parameter: 'id' is required."]);
    exit();
}

$id = (int)$_GET['id'];

try {
    // 1. Fetch cycle basic info
    $q_cycle = "SELECT 
            id, title, round_label AS roundLabel, description, house_details AS houseDetails,
            monthly_payment AS monthlyPayment, application_fee AS applicationFee,
            electricity_service AS electricityService, water_service AS waterService,
            house_type AS houseType, campus_id AS campusId, block_id AS blockId,
            house_number AS houseNumber, bedrooms, bathrooms, deadline, status, created_at AS createdAt
          FROM applications
          WHERE id = :id";
    
    $stmt_cycle = $db->prepare($q_cycle);
    $stmt_cycle->execute([':id' => $id]);
    $cycle = $stmt_cycle->fetch(PDO::FETCH_ASSOC);

    if (!$cycle) {
        http_response_code(404);
        echo json_encode(["message" => "Application cycle not found."]);
        exit();
    }

    // Convert decimal numbers to float/int where appropriate
    if ($cycle['monthlyPayment'] !== null) $cycle['monthlyPayment'] = (float)$cycle['monthlyPayment'];
    if ($cycle['applicationFee'] !== null) $cycle['applicationFee'] = (float)$cycle['applicationFee'];
    if ($cycle['bedrooms'] !== null) $cycle['bedrooms'] = (int)$cycle['bedrooms'];
    if ($cycle['bathrooms'] !== null) $cycle['bathrooms'] = (int)$cycle['bathrooms'];

    // 2. Fetch house configurations
    $q_conf = "SELECT ah.id, ah.house_type AS houseType, ah.campus_id AS campusId, c.name as campusName, ah.monthly_payment AS monthlyPayment, ah.number_of_houses AS numberOfHouses
               FROM application_houses ah
               LEFT JOIN campuses c ON ah.campus_id = c.id
               WHERE ah.application_id = :id";
    $stmt_conf = $db->prepare($q_conf);
    $stmt_conf->execute([':id' => $id]);
    $houses = $stmt_conf->fetchAll(PDO::FETCH_ASSOC);

    foreach ($houses as &$house) {
        $house['monthlyPayment'] = (float)$house['monthlyPayment'];
        $house['numberOfHouses'] = (int)$house['numberOfHouses'];
    }
    unset($house);

    // 3. Fetch applicants details
    $q_applicants = "SELECT 
            ad.id,
            ad.user_id AS userId,
            ad.gender,
            ad.academic_level AS academicLevel,
            ad.years_of_service AS yearsOfService,
            ad.marital_status AS maritalStatus,
            ad.job_responsibility AS jobResponsibility,
            ad.is_disabled AS isDisabled,
            ad.disability_type AS disabilityType,
            ad.children_count AS childrenCount,
            ad.status,
            ad.score,
            u.first_name AS firstName,
            u.last_name AS lastName,
            u.email,
            u.phone_number AS phoneNumber
          FROM applicant_details ad
          JOIN users u ON ad.user_id = u.id
          WHERE ad.application_id = :id
          ORDER BY ad.score DESC, ad.created_at ASC";
    
    $stmt_applicants = $db->prepare($q_applicants);
    $stmt_applicants->execute([':id' => $id]);
    $applicants = $stmt_applicants->fetchAll(PDO::FETCH_ASSOC);

    foreach ($applicants as &$app) {
        $app['score'] = (float)$app['score'];
        $app['yearsOfService'] = (int)$app['yearsOfService'];
        $app['childrenCount'] = (int)$app['childrenCount'];
        $app['isDisabled'] = (int)$app['isDisabled'] === 1;
    }
    unset($app);

    // Return combined result
    http_response_code(200);
    echo json_encode([
        "cycle" => $cycle,
        "houses" => $houses,
        "applicants" => $applicants
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Server error.", "error" => $e->getMessage()]);
}
?>
