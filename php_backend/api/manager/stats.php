<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

include_once '../../config/Database.php';

$database = new Database();
$db = $database->getConnection();

try {
    $stats = [];

    // Overall stats
    $q_overall = "SELECT 
        (SELECT COUNT(*) FROM blocks) AS totalBlocks,
        (SELECT COUNT(*) FROM houses) AS totalHouses,
        (SELECT COUNT(*) FROM residents WHERE residence_status = 'active') AS totalActiveResidents
    ";
    $stmt = $db->query($q_overall);
    $overall = $stmt->fetch(PDO::FETCH_ASSOC);

    // House breakdown by type and status
    $q_houses = "SELECT house_type, status, COUNT(*) as count FROM houses GROUP BY house_type, status";
    $stmt_houses = $db->query($q_houses);
    $housesData = $stmt_houses->fetchAll(PDO::FETCH_ASSOC);

    $houseStats = [
        'one_bedroom' => ['occupied' => 0, 'available' => 0],
        'two_bedroom' => ['occupied' => 0, 'available' => 0],
        'three_bedroom' => ['occupied' => 0, 'available' => 0],
        'studio' => ['occupied' => 0, 'available' => 0]
    ];

    foreach ($housesData as $row) {
        $type = $row['house_type'];
        $status = $row['status'] === 'occupied' ? 'occupied' : 'available'; // mapping maintenance to available or ignoring? Let's just group by occupied/available
        if (isset($houseStats[$type])) {
            $houseStats[$type][$status] += (int)$row['count'];
        }
    }

    // Campus breakdown
    $q_campus = "SELECT 
        c.id, 
        c.name, 
        (SELECT COUNT(*) FROM blocks b WHERE b.campus_id = c.id) as blocks,
        h.house_type,
        h.status,
        COUNT(h.id) as h_count
    FROM campuses c
    LEFT JOIN houses h ON h.campus_id = c.id
    GROUP BY c.id, h.house_type, h.status";
    
    // Wait, houses table doesn't have campus_id. It's blocks that have campus_id.
    $q_campus_fixed = "SELECT 
        c.id, 
        c.name, 
        (SELECT COUNT(*) FROM blocks b WHERE b.campus_id = c.id) as totalBlocks,
        h.house_type,
        h.status,
        COUNT(h.id) as count
    FROM campuses c
    LEFT JOIN blocks b ON b.campus_id = c.id
    LEFT JOIN houses h ON h.block_id = b.id
    GROUP BY c.id, h.house_type, h.status";

    $stmt_campus = $db->query($q_campus_fixed);
    $campusData = $stmt_campus->fetchAll(PDO::FETCH_ASSOC);

    $campuses = [];
    foreach ($campusData as $row) {
        $cid = $row['id'];
        if (!isset($campuses[$cid])) {
            $campuses[$cid] = [
                'id' => $cid,
                'name' => $row['name'],
                'totalBlocks' => $row['totalBlocks'],
                'houses' => [
                    'one_bedroom' => ['occupied' => 0, 'available' => 0],
                    'two_bedroom' => ['occupied' => 0, 'available' => 0],
                    'three_bedroom' => ['occupied' => 0, 'available' => 0],
                    'studio' => ['occupied' => 0, 'available' => 0]
                ]
            ];
        }
        if ($row['house_type']) {
            $type = $row['house_type'];
            $status = $row['status'] === 'occupied' ? 'occupied' : 'available';
            if (isset($campuses[$cid]['houses'][$type])) {
                $campuses[$cid]['houses'][$type][$status] += (int)$row['count'];
            }
        }
    }

    // Applications info
    $q_apps = "SELECT id, title, created_at, deadline, status, 
               (SELECT COUNT(*) FROM applicant_details WHERE application_id = applications.id) as total_applicants 
               FROM applications";
    $stmt_apps = $db->query($q_apps);
    $applications = $stmt_apps->fetchAll(PDO::FETCH_ASSOC);

    $stats = [
        'overall' => $overall,
        'houseStats' => $houseStats,
        'campuses' => array_values($campuses),
        'applications' => $applications
    ];

    http_response_code(200);
    echo json_encode($stats);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Database Error: " . $e->getMessage()]);
}
?>
