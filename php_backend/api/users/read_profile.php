<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../../config/Database.php';

$database = new Database();
$db = $database->getConnection();

$userId = isset($_GET['userId']) ? (int)$_GET['userId'] : 0;

if ($userId < 1) {
    http_response_code(400);
    echo json_encode(["message" => "userId is required"]);
    exit();
}

try {
    $stmt = $db->prepare(
        "SELECT u.id, u.first_name, u.last_name, u.email, u.phone_number, u.role,
                u.campus_id, u.notification_preferences, c.name AS campus_name
           FROM users u
           LEFT JOIN campuses c ON u.campus_id = c.id
          WHERE u.id = :id
          LIMIT 1"
    );
    $stmt->execute([':id' => $userId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        http_response_code(404);
        echo json_encode(["message" => "User not found."]);
        exit();
    }

    $roleMap = ['system_admin' => 'chms_admin', 'campus_admin' => 'campus_admin', 'applicant' => 'applicant'];
    $frontendRole = $roleMap[$row['role']] ?? $row['role'];

    $defaultPrefs = [
        'emailChannel'              => true,
        'smsChannel'               => false,
        'pushChannel'               => false,
        'housingApplicationUpdates'=> true,
        'lotteryAndPlacementAlerts' => true,
        'paymentReminders'          => true,
        'residentRequestsAndMaintenance'=> true,
        'systemAnnouncements'       => true,
        'marketingOptIn'           => false,
    ];

    $prefs = $defaultPrefs;
    if (!empty($row['notification_preferences'])) {
        $decoded = json_decode((string)$row['notification_preferences'], true);
        if (is_array($decoded)) {
            foreach ($decoded as $k => $v) {
                $prefs[$k] = (bool)$v;
            }
        }
    }

    $applicantBlock = null;
    if (($row['role'] ?? '') === 'applicant') {
        $ad = $db->prepare(
            "SELECT gender, academic_level, years_of_service, marital_status, job_responsibility,
                    is_disabled, disability_type, status, application_id, score
               FROM applicant_details
              WHERE user_id = :uid
              LIMIT 1"
        );
        $ad->execute([':uid' => $userId]);
        $detail = $ad->fetch(PDO::FETCH_ASSOC);
        if ($detail) {
            $applicantBlock = [
                'gender'               => $detail['gender'],
                'academicLevel'        => $detail['academic_level'],
                'yearsOfService'       => (int)$detail['years_of_service'],
                'maritalStatus'        => $detail['marital_status'],
                'jobResponsibility'    => $detail['job_responsibility'],
                'isDisabled'           => (bool)$detail['is_disabled'],
                'disabilityType'       => $detail['disability_type'] ? (string)$detail['disability_type'] : null,
                'applicationStatus'    => $detail['status'],
                'applicationId'        => $detail['application_id'] ? (string)$detail['application_id'] : null,
                'score'                => isset($detail['score']) ? (float)$detail['score'] : 0,
                'employmentFieldsLocked'=> (bool)(
                    $detail['application_id'] !== null
                    && $detail['status'] !== null
                    && strtolower((string)$detail['status']) !== 'rejected'
                ),
            ];
        }
    }

    http_response_code(200);
    echo json_encode([
        'user' => [
            'id'          => (string)$row['id'],
            'firstName'   => $row['first_name'],
            'lastName'    => $row['last_name'],
            'email'       => $row['email'],
            'phone'       => $row['phone_number'],
            'role'        => $frontendRole,
            'campusId'    => $row['campus_id'] !== null ? (string)$row['campus_id'] : null,
            'campusName'  => $row['campus_name'],
        ],
        'notificationPreferences' => $prefs,
        'applicantDetails'        => $applicantBlock,
    ]);
} catch (Throwable $e) {
    http_response_code(503);
    echo json_encode(['message' => 'Failed to load profile.', 'error' => $e->getMessage()]);
}
