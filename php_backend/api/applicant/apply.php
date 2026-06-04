<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

include_once '../../config/Database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if(
    !empty($data->userId) &&
    isset($data->gender) &&
    isset($data->academicLevel) &&
    isset($data->yearsOfService) &&
    isset($data->maritalStatus) &&
    isset($data->childrenCount) &&
    isset($data->jobResponsibility) &&
    isset($data->score)
){
    try {
        // 1. Verify there is an OPEN cycle whose deadline has not passed
        $q_cycle = "SELECT `id`, `deadline` FROM `applications` 
                    WHERE `status` = 'open' 
                    AND (`deadline` IS NULL OR `deadline` >= NOW())
                    ORDER BY `created_at` DESC LIMIT 1";
        $stmt_cycle = $db->prepare($q_cycle);
        $stmt_cycle->execute();
        
        if($stmt_cycle->rowCount() == 0){
            http_response_code(400);
            echo json_encode(["message" => "There is no open application cycle, or the deadline has passed."]);
            exit();
        }
        
        $cycle_row = $stmt_cycle->fetch(PDO::FETCH_ASSOC);
        $cycle_id = $cycle_row['id'];

        // 2. STRICT ENFORCEMENT: One Applicant, One Application Relationship
        // Check if the user already has an application that is NOT rejected
        $checkUser = "SELECT `application_id`, `status` FROM `applicant_details` WHERE `user_id` = :uid";
        $cStmt = $db->prepare($checkUser);
        $cStmt->execute([':uid' => (int)$data->userId]);
        $existingRecord = $cStmt->fetch(PDO::FETCH_ASSOC);
        
        if($existingRecord) {
           // If they have an application_id assigned and status isn't 'rejected', then they already have an active application
           if(!empty($existingRecord['application_id'])) {
               if($existingRecord['application_id'] == $cycle_id) {
                   http_response_code(400);
                   echo json_encode([
                       "message" => "DUPLICATE PREVENTED: You already have an active application in the current cycle.",
                       "status" => $existingRecord['status']
                   ]);
                   exit();
               } else if ($existingRecord['status'] === 'placed') {
                   http_response_code(400);
                   echo json_encode([
                       "message" => "You cannot apply because you have already been placed in a house in a previous cycle.",
                       "status" => $existingRecord['status']
                   ]);
                   exit();
               }
           }
        } else {
            // If the row doesn't exist, create it (safety)
            $ins = "INSERT INTO `applicant_details` (`user_id`) VALUES (:uid)";
            $insStmt = $db->prepare($ins);
            $insStmt->execute([':uid' => (int)$data->userId]);
        }

        // 3. Update the record
        $query = "UPDATE `applicant_details` 
                  SET 
                    `gender` = :gender,
                    `academic_level` = :academic,
                    `years_of_service` = :years,
                    `marital_status` = :marital,
                    `children_count` = :children_count,
                    `job_responsibility` = :job,
                    `is_disabled` = :disabled,
                    `disability_type` = :disability_type,
                    `score` = :score,
                    `status` = 'pending',
                    `application_id` = :app_id
                  WHERE `user_id` = :uid";

        $stmt = $db->prepare($query);

        $stmt->bindValue(":gender", $data->gender);
        $stmt->bindValue(":academic", $data->academicLevel);
        $stmt->bindValue(":years", (int)$data->yearsOfService, PDO::PARAM_INT);
        $stmt->bindValue(":marital", $data->maritalStatus);
        $stmt->bindValue(":children_count", (int)$data->childrenCount, PDO::PARAM_INT);
        $stmt->bindValue(":job", $data->jobResponsibility);
        $stmt->bindValue(":disabled", (!empty($data->isDisabled) ? 1 : 0), PDO::PARAM_INT);
        $stmt->bindValue(":disability_type", isset($data->disabilityType) && trim((string)$data->disabilityType) !== '' ? trim((string)$data->disabilityType) : null);
        $stmt->bindValue(":score", (int)$data->score, PDO::PARAM_INT);
        $stmt->bindValue(":app_id", (int)$cycle_id, PDO::PARAM_INT);
        $stmt->bindValue(":uid", (int)$data->userId, PDO::PARAM_INT);

        if($stmt->execute()){
            http_response_code(200);
            echo json_encode(array(
                "message" => "Congratulations! Your application has been successfully recorded.",
                "cycle_id" => $cycle_id
            ));
        } else {
            http_response_code(500);
            echo json_encode(array("message" => "Database failure: Could not record your application record."));
        }

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(array("message" => "Server Database Error: " . $e->getMessage()));
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(array("message" => "System Core Error: " . $e->getMessage()));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Validation Error: Incomplete application data provided."));
}
?>
