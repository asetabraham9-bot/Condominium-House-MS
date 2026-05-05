<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

include_once '../../config/Database.php';
$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));
$n = isset($data->numberOfWinners) ? (int)$data->numberOfWinners : 0;
$strategy = isset($data->strategy) ? $data->strategy : 'weighted_random';

if ($n <= 0) {
    http_response_code(400);
    echo json_encode(["message" => "Number of winners must be at least 1."]);
    exit();
}

try {
    $db->beginTransaction();

    // 1. Fetch eligible applicants (status = 'approved')
    $q = "SELECT ad.user_id, CONCAT(u.first_name, ' ', u.last_name) as name, ad.score, ad.is_disabled
          FROM applicant_details ad
          JOIN users u ON ad.user_id = u.id
          WHERE ad.status = 'approved'
          ORDER BY ad.is_disabled DESC, ad.score DESC";
    $stmt = $db->prepare($q);
    $stmt->execute();
    $pool = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (count($pool) === 0) {
        $db->rollBack();
        http_response_code(404);
        echo json_encode(["message" => "No approved applicants found. Ensure HR/CHMS Admin has approved applicants first."]);
        exit();
    }

    $actual_winner_count = min($n, count($pool));
    $winners = [];

    // WEIGHTED LOTTERY LOGIC
    if ($strategy === 'weighted_random') {
        $temp_pool = $pool;
        for ($i = 0; $i < $actual_winner_count; $i++) {
            $total_weight = 0;
            foreach ($temp_pool as $app) {
                // Ensure weight is at least 1 even if score is 0
                $total_weight += max(1, (int)$app['score']);
            }

            $r = rand(1, $total_weight);
            $current_sum = 0;
            
            foreach ($temp_pool as $key => $app) {
                $current_sum += max(1, (int)$app['score']);
                if ($r <= $current_sum) {
                    // Winner found
                    $winners[] = $app;
                    // Remove from temp pool so they can't win twice
                    unset($temp_pool[$key]);
                    // Re-index
                    $temp_pool = array_values($temp_pool);
                    break;
                }
            }
        }
    } else {
        // Fallback: Strictly by score (highest wins)
        $winners = array_slice($pool, 0, $actual_winner_count);
    }

    // 2. Update database for winners
    if (count($winners) > 0) {
        $winner_ids = array_column($winners, 'user_id');
        $placeholders = implode(',', array_fill(0, count($winner_ids), '?'));
        
        $sql = "UPDATE applicant_details SET status = 'lottery_won' WHERE user_id IN ($placeholders)";
        $stmt_win = $db->prepare($sql);
        $stmt_win->execute($winner_ids);
    }

    $db->commit();

    http_response_code(200);
    echo json_encode([
        "message" => "Lottery drawing completed successfully via " . ($strategy === 'weighted_random' ? "Weighted Random" : "Strict Score") . " selection.",
        "winners" => $winners,
        "count" => count($winners),
        "total_eligible" => count($pool)
    ]);

} catch (Exception $e) {
    $db->rollBack();
    http_response_code(503);
    echo json_encode(["message" => "Lottery process encountered a system error.", "error" => $e->getMessage()]);
}
?>
