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

$houseType = $pick('houseType');
if ($houseType === '') {
    $houseType = null;
}

$campusIdRaw = $isMultipart ? ($post['campusId'] ?? '') : ($data->campusId ?? '');
$campusId = $campusIdRaw !== '' && $campusIdRaw !== null ? (int)$campusIdRaw : null;
if ($campusId === 0) {
    $campusId = null;
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

$launchedByRaw = $isMultipart ? ($post['launchedBy'] ?? '') : ($data->launchedBy ?? null);
$launchedBy = $launchedByRaw !== '' && $launchedByRaw !== null ? (int)$launchedByRaw : null;

$allowedExt = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

try {
    $db->beginTransaction();

    $close = $db->prepare("UPDATE applications SET status = 'closed' WHERE status = 'open'");
    $close->execute();

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

    $savedRelative = [];

    if ($isMultipart && $uploadsRoot && !empty($_FILES['images'])) {
        $files = $_FILES['images'];
        $names = $files['name'];
        $tmp = $files['tmp_name'];
        $errs = $files['error'];
        $cycleDir = $uploadsRoot . DIRECTORY_SEPARATOR . $id;
        if (!is_dir($cycleDir)) {
            mkdir($cycleDir, 0755, true);
        }

        $n = is_array($names) ? count($names) : 0;
        $maxFiles = min(6, $n);

        for ($i = 0; $i < $maxFiles; $i++) {
            if ($errs[$i] !== UPLOAD_ERR_OK || !is_uploaded_file($tmp[$i])) {
                continue;
            }
            $orig = basename((string)$names[$i]);
            $ext = strtolower(pathinfo($orig, PATHINFO_EXTENSION));
            if (!in_array($ext, $allowedExt, true)) {
                continue;
            }
            $fname = sprintf('img_%s.%s', bin2hex(random_bytes(8)), $ext);
            $destFs = $cycleDir . DIRECTORY_SEPARATOR . $fname;
            if (move_uploaded_file($tmp[$i], $destFs)) {
                $savedRelative[] = 'house_cycles/' . $id . '/' . $fname;
            }
        }

        if (count($savedRelative) > 0) {
            $json = json_encode($savedRelative, JSON_UNESCAPED_SLASHES);
            $upd = $db->prepare('UPDATE applications SET house_images = :j WHERE id = :id');
            $upd->execute([':j' => $json, ':id' => $id]);
        }
    }

    $db->commit();

    http_response_code(201);
    echo json_encode([
        "message" => "Application cycle launched.",
        "id" => $id,
        "house_images" => $savedRelative,
    ]);
} catch (Exception $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    http_response_code(503);
    echo json_encode(["message" => "Unable to launch cycle.", "error" => $e->getMessage()]);
}
