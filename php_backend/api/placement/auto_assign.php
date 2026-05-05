<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

include_once '../../config/Database.php';
$database = new Database();
$db = $database->getConnection();

try {
    // 1. Fetch all lottery winners who are not yet placed
    $query = "SELECT ad.user_id, u.campus_id, CONCAT(u.first_name, ' ', u.last_name) as name
              FROM applicant_details ad
              JOIN users u ON ad.user_id = u.id
              WHERE ad.status = 'lottery_won'";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $winners = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($winners)) {
        echo json_encode(["message" => "No lottery winners awaiting placement.", "count" => 0]);
        exit();
    }

    $assignedCount = 0;
    $results = [];

    foreach ($winners as $winner) {
        $userId = $winner['user_id'];
        $campusId = $winner['campus_id'];
        $userName = $winner['name'];

        // 2. Find an available house in the same campus
        $houseQuery = "SELECT h.id, h.house_number, b.name as block_name 
                      FROM houses h
                      JOIN blocks b ON h.block_id = b.id
                      WHERE b.campus_id = :campusId 
                      AND h.status = 'available'
                      LIMIT 1";
        $houseStmt = $db->prepare($houseQuery);
        $houseStmt->bindParam(':campusId', $campusId);
        $houseStmt->execute();
        $house = $houseStmt->fetch(PDO::FETCH_ASSOC);

        if ($house) {
            $houseId = $house['id'];
            
            $db->beginTransaction();
            try {
                // 3. Assign house to user
                $resQuery = "INSERT INTO residents (user_id, house_id, campus_id, status, assigned_date)
                            VALUES (:uid, :hid, :cid, 'active', CURDATE())";
                $resStmt = $db->prepare($resQuery);
                $resStmt->bindParam(':uid', $userId);
                $resStmt->bindParam(':hid', $houseId);
                $resStmt->bindParam(':cid', $campusId);
                $resStmt->execute();

                // 4. Update house status
                $hUpdate = "UPDATE houses SET status = 'occupied' WHERE id = :hid";
                $hStmt = $db->prepare($hUpdate);
                $hStmt->bindParam(':hid', $houseId);
                $hStmt->execute();

                // 5. Update applicant status
                $aUpdate = "UPDATE applicant_details SET status = 'placed' WHERE user_id = :uid";
                $aStmt = $db->prepare($aUpdate);
                $aStmt->bindParam(':uid', $userId);
                $aStmt->execute();

                $db->commit();
                $assignedCount++;
                $results[] = [
                    "name" => $userName,
                    "houseNumber" => $house['house_number'],
                    "blockName" => $house['block_name'],
                    "status" => "assigned"
                ];
            } catch (Exception $e) {
                $db->rollBack();
                $results[] = [
                    "name" => $userName,
                    "status" => "failed",
                    "error" => $e->getMessage()
                ];
            }
        } else {
            $results[] = [
                "name" => $userName,
                "status" => "failed",
                "error" => "No available house in this campus"
            ];
        }
    }

    echo json_encode([
        "message" => "Auto-assignment completed.",
        "assignedCount" => $assignedCount,
        "totalWinners" => count($winners),
        "details" => $results
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Server error", "error" => $e->getMessage()]);
}
?>
