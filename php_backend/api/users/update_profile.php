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

if (empty($data->userId)) {
    http_response_code(400);
    echo json_encode(["message" => "userId is required."]);
    exit();
}

$userId = (int)$data->userId;

$roleStmt = $db->prepare("SELECT role FROM users WHERE id = :id");
$roleStmt->execute([':id' => $userId]);
$roleRow = $roleStmt->fetch(PDO::FETCH_ASSOC);

if (!$roleRow) {
    http_response_code(404);
    echo json_encode(["message" => "User not found."]);
    exit();
}

$dbRole = (string)$roleRow['role'];
$frontendRoleMap = ['system_admin' => 'chms_admin', 'campus_admin' => 'campus_admin', 'applicant' => 'applicant'];

// --- users.basic fields ---
$fields = [];
$params = [':userId' => $userId];

if (isset($data->firstName) && trim((string)$data->firstName) !== '') {
    $fields[] = "first_name = :firstName";
    $params[':firstName'] = trim((string)$data->firstName);
}
if (isset($data->lastName) && trim((string)$data->lastName) !== '') {
    $fields[] = "last_name = :lastName";
    $params[':lastName'] = trim((string)$data->lastName);
}

if (property_exists($data, 'phone')) {
    $phone = $data->phone === null ? null : trim((string)$data->phone);
    $fields[] = "phone_number = :phone";
    $params[':phone'] = $phone === '' ? null : $phone;
}

// Email uniqueness
if (!empty($data->email)) {
    $emailCheck = $db->prepare("SELECT id FROM users WHERE email = :email AND id != :userId");
    $emailCheck->execute([':email' => trim((string)$data->email), ':userId' => $userId]);
    if ($emailCheck->rowCount() > 0) {
        http_response_code(409);
        echo json_encode(["message" => "This email is already used by another account."]);
        exit();
    }
    $fields[] = "email = :email";
    $params[':email'] = trim((string)$data->email);
}

// Notification prefs JSON blob
if (isset($data->notificationPreferences) && (is_array($data->notificationPreferences) || is_object($data->notificationPreferences))) {
    $fields[] = "notification_preferences = :np";
    $defaults = [
        'emailChannel'                   => true,
        'smsChannel'                     => false,
        'pushChannel'                   => false,
        'housingApplicationUpdates'      => true,
        'lotteryAndPlacementAlerts'      => true,
        'paymentReminders'               => true,
        'residentRequestsAndMaintenance'=> true,
        'systemAnnouncements'            => true,
        'marketingOptIn'                => false,
    ];
    $inc = (array)$data->notificationPreferences;
    $norm = [];
    foreach (array_keys($defaults) as $k) {
        $norm[$k] = isset($inc[$k]) ? (bool)$inc[$k] : $defaults[$k];
    }
    $params[':np'] = json_encode($norm, JSON_UNESCAPED_SLASHES);
}

$applicantUpdatesDone = false;
if (($dbRole === 'applicant') && isset($data->applicantDetails) && is_object($data->applicantDetails)) {
    $sel = $db->prepare(
        "SELECT application_id, status FROM applicant_details WHERE user_id = :uid LIMIT 1"
    );
    $sel->execute([':uid' => $userId]);
    $adRow = $sel->fetch(PDO::FETCH_ASSOC);

    $locked = $adRow
        && $adRow['application_id'] !== null
        && strtolower((string)$adRow['status']) !== 'rejected';

    if (!$locked && $adRow) {
        $adFields = [];
        $adParams = [':uid' => $userId];
        $d = $data->applicantDetails;

        if (isset($d->gender) && in_array($d->gender, ['Male', 'Female'], true)) {
            $adFields[] = "gender = :gender";
            $adParams[':gender'] = $d->gender;
        }
        if (isset($d->academicLevel) && trim((string)$d->academicLevel) !== '') {
            $adFields[] = "academic_level = :al";
            $adParams[':al'] = trim((string)$d->academicLevel);
        }
        if (isset($d->yearsOfService)) {
            $adFields[] = "years_of_service = :y";
            $adParams[':y'] = (int)$d->yearsOfService;
        }
        if (isset($d->maritalStatus) && trim((string)$d->maritalStatus) !== '') {
            $adFields[] = "marital_status = :ms";
            $adParams[':ms'] = trim((string)$d->maritalStatus);
        }
        if (isset($d->jobResponsibility) && trim((string)$d->jobResponsibility) !== '') {
            $adFields[] = "job_responsibility = :jr";
            $adParams[':jr'] = trim((string)$d->jobResponsibility);
        }
        if (isset($d->isDisabled)) {
            $adFields[] = "is_disabled = :dis";
            $adParams[':dis'] = !empty($d->isDisabled) ? 1 : 0;
        }

        if (!empty($adFields)) {
            $adSql = "UPDATE applicant_details SET " . implode(", ", $adFields) . " WHERE user_id = :uid";
            $adStmt = $db->prepare($adSql);
            $adStmt->execute($adParams);
            $applicantUpdatesDone = true;
        }
    }
}

try {
    if (!empty($fields)) {
        $query = "UPDATE users SET " . implode(", ", $fields) . " WHERE id = :userId";
        $stmt = $db->prepare($query);
        if (!$stmt->execute($params)) {
            http_response_code(503);
            echo json_encode(["message" => "Failed to update profile."]);
            exit();
        }
    } elseif (!$applicantUpdatesDone) {
        http_response_code(400);
        echo json_encode(["message" => "No valid fields to update."]);
        exit();
    }
} catch (Throwable $e) {
    $msg = $e->getMessage();
    $needCol = strpos($msg, 'notification_preferences') !== false;
    http_response_code(503);
    echo json_encode([
        "message" => $needCol
            ? 'Run migrate_user_notification_preferences.php to add notification_preferences column.'
            : 'Unable to save profile.',
        "error" => $msg,
    ]);
    exit();
}

// Return merged profile snapshot
$prefStmt = $db->prepare(
    "SELECT notification_preferences FROM users WHERE id = :id"
);
$prefStmt->execute([':id' => $userId]);
$prefRow = $prefStmt->fetch(PDO::FETCH_ASSOC);
$mergedPrefs = null;
if ($prefRow && isset($prefRow['notification_preferences']) && $prefRow['notification_preferences'] !== null) {
    $mergedPrefs = json_decode((string)$prefRow['notification_preferences'], true);
}

$fetch = $db->prepare(
    "SELECT u.id, u.first_name, u.last_name, u.email, u.phone_number, u.role, u.campus_id, c.name as campus_name
       FROM users u
       LEFT JOIN campuses c ON u.campus_id = c.id
      WHERE u.id = :id"
);
$fetch->execute([':id' => $userId]);
$row = $fetch->fetch(PDO::FETCH_ASSOC);

$applicantOut = null;
if (($row['role'] ?? '') === 'applicant') {
    $ad = $db->prepare(
        "SELECT gender, academic_level, years_of_service, marital_status, job_responsibility,
                is_disabled, status, application_id, score FROM applicant_details WHERE user_id = :uid LIMIT 1"
    );
    $ad->execute([':uid' => $userId]);
    $d = $ad->fetch(PDO::FETCH_ASSOC);
    if ($d) {
        $applicantOut = [
            'gender'                => $d['gender'],
            'academicLevel'        => $d['academic_level'],
            'yearsOfService'       => (int)$d['years_of_service'],
            'maritalStatus'        => $d['marital_status'],
            'jobResponsibility'    => $d['job_responsibility'],
            'isDisabled'           => (bool)$d['is_disabled'],
            'applicationStatus'    => $d['status'],
            'applicationId'        => $d['application_id'] ? (string)$d['application_id'] : null,
            'score'                => isset($d['score']) ? (float)$d['score'] : 0,
            'employmentFieldsLocked' => (bool)(
                $d['application_id'] !== null
                && strtolower((string)$d['status']) !== 'rejected'
            ),
        ];
    }
}

http_response_code(200);
echo json_encode([
    "message"                   => "Profile updated successfully.",
    "user"                      => [
        "id"         => (string)$row['id'],
        "firstName"  => $row['first_name'],
        "lastName"   => $row['last_name'],
        "email"      => $row['email'],
        "phone"      => $row['phone_number'],
        "role"       => $frontendRoleMap[$row['role']] ?? $row['role'],
        "campusId"   => $row['campus_id'] ? (string)$row['campus_id'] : null,
        "campusName" => $row['campus_name'] ?? null,
    ],
    "notificationPreferences" => is_array($mergedPrefs) ? $mergedPrefs : new stdClass(),
    "applicantDetails"          => $applicantOut,
]);
