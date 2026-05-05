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
    // Fetch ALL applicants who participated in the housing process
    // This includes Winners (lottery_won, placed) and those not selected (rejected, approved)
    $query = "SELECT 
                ad.user_id, ad.score, ad.status,
                CONCAT(u.first_name, ' ', u.last_name) as name,
                c.name as campusName,
                (SELECT house_number FROM residents WHERE applicant_id = ad.user_id LIMIT 1) as houseNumber
              FROM applicant_details ad
              JOIN users u ON ad.user_id = u.id
              LEFT JOIN campuses c ON u.campus_id = c.id
              WHERE ad.status != 'pending' 
              ORDER BY 
                CASE 
                    WHEN ad.status IN ('lottery_won', 'placed') THEN 0 
                    ELSE 1 
                END, 
                ad.score DESC, ad.updated_at DESC";
              
    $stmt = $db->prepare($query);
    $stmt->execute();
    
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(["results" => $results]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Database error", "error" => $e->getMessage()]);
}
?>
