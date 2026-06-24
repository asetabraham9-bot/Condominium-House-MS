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

if (!$db) {
    http_response_code(503);
    echo json_encode(["message" => "Database connection failed."]);
    exit();
}

$uploadsRoot = realpath(__DIR__ . '/../../uploads/house_cycles');
if ($uploadsRoot === false) {
    @mkdir(__DIR__ . '/../../uploads/house_cycles', 0755, true);
    $uploadsRoot = realpath(__DIR__ . '/../../uploads/house_cycles');
}

$isMultipart = isset($_SERVER['CONTENT_TYPE'])
    && stripos($_SERVER['CONTENT_TYPE'], 'multipart/form-data') !== false;

$data = null;
$post = [];

if ($isMultipart) {
    $post = $_POST;
} else {
    $data = json_decode(file_get_contents("php://input"));
    if (!$data) {
        http_response_code(400);
        echo json_encode(["message" => "Invalid JSON body."]);
        exit();
    }
}

$pick = static function ($key, $default = '') use ($post, $data, $isMultipart) {
    if ($isMultipart) {
        return isset($post[$key]) ? trim((string)$post[$key]) : $default;
    }
    return isset($data->$key) ? trim((string)$data->$key) : $default;
};

$pickNum = static function ($key) use ($post, $data, $isMultipart) {
    if ($isMultipart) {
        if (!isset($post[$key]) || $post[$key] === '') {
            return null;
        }
        return (float)$post[$key];
    }
    return isset($data->$key) && $data->$key !== null && $data->$key !== ''
        ? (float)$data->$key
        : null;
};

$pickIntNullable = static function ($key) use ($post, $data, $isMultipart) {
    if ($isMultipart) {
        if (!isset($post[$key]) || $post[$key] === '') {
            return null;
        }
        return (int)$post[$key];
    }
    return isset($data->$key) && $data->$key !== null && $data->$key !== ''
        ? (int)$data->$key
        : null;
};

$title = $pick('title');
$roundLabel = $pick('roundLabel');
if ($roundLabel === '') {
    $roundLabel = null;
}
$description = $pick('description');
$houseDetails = $pick('houseDetails');
if ($houseDetails === '') {
    $houseDetails = null;
}
$deadline = $pick('deadline');

if ($title === '' || $description === '' || $deadline === '') {
    http_response_code(400);
    echo json_encode(["message" => "title, description, and deadline are required."]);
    exit();
}

$monthly = $pickNum('monthlyPayment');
$fee = $pickNum('applicationFee');

$electricRaw = $pick('electricityService', '');
$waterRaw = $pick('waterService', '');

$toYesNo = static function (?string $raw): ?string {
    if ($raw === null || $raw === '') {
        return null;
    }
    $s = strtolower(trim($raw));
    if (in_array($s, ['yes', 'y', '1', 'true'], true)) {
        return 'yes';
    }
    if (in_array($s, ['no', 'n', '0', 'false'], true)) {
        return 'no';
    }
    if ($s === 'maintenance') {
        return 'maintenance';
    }
    return $s;
};

$electric = $toYesNo($electricRaw !== '' ? $electricRaw : null);
$water = $toYesNo($waterRaw !== '' ? $waterRaw : null);

// JSON body fallback (legacy callers may omit empty strings)
if (!$isMultipart && $data) {
    if ($electric === null && isset($data->electricityService) && trim((string)$data->electricityService) !== '') {
        $electric = $toYesNo(trim((string)$data->electricityService));
    }
    if ($water === null && isset($data->waterService) && trim((string)$data->waterService) !== '') {
        $water = $toYesNo(trim((string)$data->waterService));
    }
}

$houseConfigurationsRaw = $pick('houseConfigurations', '[]');
$houseConfigurations = json_decode($houseConfigurationsRaw, true);
if (!is_array($houseConfigurations)) {
    $houseConfigurations = [];
}

$launchedByRaw = $pick('launchedBy');
$launchedBy = $launchedByRaw !== '' && $launchedByRaw !== null ? (int)$launchedByRaw : null;

$selectedHouseIdsRaw = $pick('selectedHouseIds', '[]');
$selectedHouseIds = json_decode($selectedHouseIdsRaw, true);
if (!is_array($selectedHouseIds)) {
    $selectedHouseIds = [];
}
$selectedHouseIds = array_values(array_unique(array_filter(array_map('intval', $selectedHouseIds), static function ($id) {
    return $id > 0;
})));

if (count($selectedHouseIds) === 0 && count($houseConfigurations) === 0) {
    http_response_code(400);
    echo json_encode(["message" => "Select at least one available house for this cycle."]);
    exit();
}

$blockIdRaw = $isMultipart ? ($post['blockId'] ?? '') : ($data->blockId ?? '');
$blockId = $blockIdRaw !== '' && $blockIdRaw !== null ? (int)$blockIdRaw : null;
if ($blockId === 0) {
    $blockId = null;
}

$houseNumber = $pick('houseNumber');
if ($houseNumber === '') {
    $houseNumber = null;
}

$bedrooms = $pickIntNullable('bedrooms');
$bathrooms = $pickIntNullable('bathrooms');

try {
    $db->beginTransaction();

    $resolvedHouses = [];
    if (count($selectedHouseIds) > 0) {
        $placeholders = implode(',', array_fill(0, count($selectedHouseIds), '?'));
        $houseQuery = "SELECT
                h.id,
                h.house_number,
                h.house_type,
                h.monthly_payment,
                h.bedrooms,
                h.bathrooms,
                h.electric_service,
                h.water_service,
                h.status,
                b.name AS block_name,
                b.campus_id,
                c.name AS campus_name
            FROM houses h
            JOIN blocks b ON h.block_id = b.id
            JOIN campuses c ON b.campus_id = c.id
            WHERE h.id IN ($placeholders)";
        $houseStmt = $db->prepare($houseQuery);
        foreach ($selectedHouseIds as $index => $houseId) {
            $houseStmt->bindValue($index + 1, $houseId, PDO::PARAM_INT);
        }
        $houseStmt->execute();
        $resolvedHouses = $houseStmt->fetchAll(PDO::FETCH_ASSOC);

        if (count($resolvedHouses) !== count($selectedHouseIds)) {
            throw new Exception('One or more selected houses could not be found.');
        }

        foreach ($resolvedHouses as $houseRow) {
            if (($houseRow['status'] ?? '') !== 'available') {
                throw new Exception('Only available houses can be added to a cycle. House #' . $houseRow['house_number'] . ' is not available.');
            }
        }

        $houseConfigurations = [];
        $grouped = [];
        foreach ($resolvedHouses as $houseRow) {
            $rowHouseType = trim((string)$houseRow['house_type']);
            $campusIdForGroup = (int)$houseRow['campus_id'];
            $monthlyPayment = isset($houseRow['monthly_payment']) ? (float)$houseRow['monthly_payment'] : 0.0;
            $groupKey = strtolower($rowHouseType) . '|' . $campusIdForGroup . '|' . number_format($monthlyPayment, 2, '.', '');

            if (!isset($grouped[$groupKey])) {
                $grouped[$groupKey] = [
                    'houseType' => $rowHouseType !== '' ? $rowHouseType : 'House',
                    'campusId' => (string)$campusIdForGroup,
                    'campusName' => (string)$houseRow['campus_name'],
                    'monthlyPayment' => $monthlyPayment,
                    'numberOfHouses' => 0,
                ];
            }
            $grouped[$groupKey]['numberOfHouses']++;
        }
        $houseConfigurations = array_values($grouped);
    }

    $firstConfig = count($houseConfigurations) > 0 ? $houseConfigurations[0] : null;

    $houseType = $firstConfig ? $firstConfig['houseType'] : $pick('houseType');
    if ($houseType === '') {
        $houseType = null;
    }

    $campusId = $firstConfig ? (int)$firstConfig['campusId'] : null;
    if (!$campusId) {
        $campusIdRaw = $isMultipart ? ($post['campusId'] ?? '') : ($data->campusId ?? '');
        $campusId = $campusIdRaw !== '' && $campusIdRaw !== null ? (int)$campusIdRaw : null;
    }
    if ($campusId === 0) {
        $campusId = null;
    }

    $monthly = $firstConfig ? (float)$firstConfig['monthlyPayment'] : $pickNum('monthlyPayment');

    $close = $db->prepare("UPDATE applications SET status = 'closed' WHERE status = 'open'");
    $close->execute();

// // Clear old application fee payments
// // $deleteFees = $db->prepare("DELETE FROM payments WHERE payment_type = 'application_fee'");
// // $deleteFees->execute(); // Retain payment history until deadline.


    $q = "INSERT INTO applications (
            title, round_label, description, house_details,
            monthly_payment, application_fee, electricity_service, water_service,
            house_type, campus_id, block_id, house_number, bedrooms, bathrooms,
            house_images, deadline, status, user_id
          ) VALUES (
            :title, :round_label, :description, :house_details,
            :monthly, :fee, :electric, :water,
            :house_type, :campus_id, :block_id, :house_number, :bedrooms, :bathrooms,
            NULL, :deadline, 'open', :user_id
          )";

    $stmt = $db->prepare($q);
    $params = [
        ':title' => $title,
        ':round_label' => $roundLabel,
        ':description' => $description,
        ':house_details' => $houseDetails,
        ':monthly' => $monthly,
        ':fee' => $fee,
        ':electric' => $electric,
        ':water' => $water,
        ':house_type' => $houseType,
        ':campus_id' => $campusId,
        ':block_id' => $blockId,
        ':house_number' => $houseNumber,
        ':bedrooms' => $bedrooms,
        ':bathrooms' => $bathrooms,
        ':deadline' => $deadline,
        ':user_id' => $launchedBy,
    ];
    $stmt->execute($params);

    $id = (int)$db->lastInsertId();

    // Insert configurations into application_houses table
    if (count($houseConfigurations) > 0) {
        $insConf = $db->prepare("INSERT INTO application_houses (application_id, house_type, campus_id, monthly_payment, number_of_houses) VALUES (:app_id, :type, :campus_id, :payment, :num)");
        foreach ($houseConfigurations as $conf) {
            $insConf->execute([
                ':app_id' => $id,
                ':type' => $conf['houseType'],
                ':campus_id' => (int)$conf['campusId'],
                ':payment' => (float)$conf['monthlyPayment'],
                ':num' => (int)$conf['numberOfHouses']
            ]);
        }
    }

    if (count($resolvedHouses) > 0) {
        $insCycleHouse = $db->prepare("INSERT INTO application_cycle_houses (application_id, house_id) VALUES (:app_id, :house_id)");
        foreach ($resolvedHouses as $houseRow) {
            $insCycleHouse->execute([
                ':app_id' => $id,
                ':house_id' => (int)$houseRow['id'],
            ]);
        }
    }

    $db->commit();

    http_response_code(201);
    echo json_encode([
        "message" => "Application cycle launched.",
        "id" => $id
    ]);
} catch (Exception $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    http_response_code(503);
    echo json_encode(["message" => "Unable to launch cycle.", "error" => $e->getMessage()]);
}
