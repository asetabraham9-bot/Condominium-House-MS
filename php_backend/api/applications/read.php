<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../../config/Database.php';

$database = new Database();
$db = $database->getConnection();

$applicantId = isset($_GET['applicantId']) ? $_GET['applicantId'] : null;

// Applicant submissions (applicant_details linked to a housing cycle)
$query = "SELECT 
            ad.user_id as applicantId, 
            CONCAT(u.first_name, ' ', u.last_name) as applicantName,
            ad.application_id as cycleId,
            COALESCE(ad.updated_at, ad.created_at, a.created_at) as applicationDate,
            a.title as cycleTitle,
            a.round_label AS cycleRoundLabel,
            a.description AS cycleDescription,
            a.house_details AS cycleHouseDetails,
            a.monthly_payment AS cycleMonthlyPayment,
            a.application_fee AS cycleApplicationFee,
            a.electricity_service AS cycleElectricityService,
            a.water_service AS cycleWaterService,
            a.house_type AS cycleHouseType,
            a.house_number AS cycleHouseNumber,
            a.bedrooms AS cycleBedrooms,
            a.bathrooms AS cycleBathrooms,
            a.deadline AS cycleDeadline,
            a.house_images AS cycleHouseImagesRaw,
            c.name AS cycleCampusName,
            b.name AS cycleBlockName,
            ad.status,
            ad.score,
            ad.academic_level as academicLevel,
            ad.years_of_service as yearsOfService,
            ad.marital_status as maritalStatus,
            ad.job_responsibility as jobResponsibility,
            ad.is_disabled as isDisabled
          FROM applicant_details ad
          JOIN users u ON ad.user_id = u.id
          LEFT JOIN applications a ON ad.application_id = a.id
          LEFT JOIN campuses c ON a.campus_id = c.id
          LEFT JOIN blocks b ON a.block_id = b.id
          WHERE ad.application_id IS NOT NULL";

if ($applicantId) {
    $query .= " AND ad.user_id = :applicantId";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':applicantId', $applicantId);
} else {
    // Admin / CHMS: only show users who submitted to a cycle
    $stmt = $db->prepare($query);
}

$stmt->execute();

$applications_arr = array();
$applications_arr["records"] = array();

while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $cycleHouseImages = [];
    if (!empty($row['cycleHouseImagesRaw'])) {
        $dec = json_decode((string)$row['cycleHouseImagesRaw'], true);
        if (is_array($dec)) {
            $cycleHouseImages = $dec;
        }
    }

    $app_item = array(
        "id" => (string)$row['applicantId'],
        "applicantId" => (string)$row['applicantId'],
        "applicantName" => $row['applicantName'],
        "cycleId" => $row['cycleId'] ? (string)$row['cycleId'] : null,
        "cycleTitle" => $row['cycleTitle'],
        "cycleRoundLabel" => isset($row['cycleRoundLabel']) ? $row['cycleRoundLabel'] : null,
        "cycleDescription" => isset($row['cycleDescription']) ? $row['cycleDescription'] : null,
        "cycleHouseDetails" => isset($row['cycleHouseDetails']) ? $row['cycleHouseDetails'] : null,
        "cycleMonthlyPayment" => isset($row['cycleMonthlyPayment']) && $row['cycleMonthlyPayment'] !== null
            ? (float)$row['cycleMonthlyPayment'] : null,
        "cycleApplicationFee" => isset($row['cycleApplicationFee']) && $row['cycleApplicationFee'] !== null
            ? (float)$row['cycleApplicationFee'] : null,
        "cycleElectricityService" => isset($row['cycleElectricityService']) ? $row['cycleElectricityService'] : null,
        "cycleWaterService" => isset($row['cycleWaterService']) ? $row['cycleWaterService'] : null,
        "cycleHouseType" => isset($row['cycleHouseType']) ? $row['cycleHouseType'] : null,
        "cycleHouseNumber" => isset($row['cycleHouseNumber']) ? $row['cycleHouseNumber'] : null,
        "cycleBedrooms" => isset($row['cycleBedrooms']) && $row['cycleBedrooms'] !== null
            ? (int)$row['cycleBedrooms'] : null,
        "cycleBathrooms" => isset($row['cycleBathrooms']) && $row['cycleBathrooms'] !== null
            ? (int)$row['cycleBathrooms'] : null,
        "cycleDeadline" => isset($row['cycleDeadline']) && $row['cycleDeadline'] !== null ? $row['cycleDeadline'] : null,
        "cycleCampusName" => isset($row['cycleCampusName']) ? $row['cycleCampusName'] : null,
        "cycleBlockName" => isset($row['cycleBlockName']) ? $row['cycleBlockName'] : null,
        "cycleHouseImages" => $cycleHouseImages,
        "applicationDate" => $row['applicationDate']
            ? date("Y-m-d", strtotime((string)$row['applicationDate']))
            : date("Y-m-d"),
        "status" => $row['status'],
        "score" => (int)$row['score'],
        "academicLevel" => $row['academicLevel'],
        "yearsOfService" => (int)$row['yearsOfService'],
        "maritalStatus" => $row['maritalStatus'],
        "jobResponsibility" => $row['jobResponsibility'],
        "isDisabled" => (bool)$row['isDisabled'],
    );

    array_push($applications_arr["records"], $app_item);
}

http_response_code(200);
echo json_encode($applications_arr);
