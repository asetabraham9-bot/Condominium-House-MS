<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

include_once '../../config/Database.php';

$database = new Database();
$db = $database->getConnection();

// Since we use FormData for images, we use $_POST
$block_id = isset($_POST['block_id']) ? $_POST['block_id'] : null;
$house_number = isset($_POST['house_number']) ? $_POST['house_number'] : null;
$house_type = isset($_POST['house_type']) ? $_POST['house_type'] : null;
$price = isset($_POST['price']) ? $_POST['price'] : 0.00;
$monthly_payment = isset($_POST['monthly_payment']) ? $_POST['monthly_payment'] : 0.00;
$location = isset($_POST['location']) ? $_POST['location'] : null;
$bedrooms = isset($_POST['bedrooms']) ? $_POST['bedrooms'] : 0;
$bathrooms = isset($_POST['bathrooms']) ? $_POST['bathrooms'] : 0;
$description = isset($_POST['description']) ? $_POST['description'] : null;
$electric_service = isset($_POST['electric_service']) ? $_POST['electric_service'] : 'yes';
$water_service = isset($_POST['water_service']) ? $_POST['water_service'] : 'yes';


if($block_id && $house_number){
    try {
        $db->beginTransaction();

        $query = "INSERT INTO houses (block_id, house_number, house_type, price, monthly_payment, location, bedrooms, bathrooms, description, electric_service, water_service, status) 
                  VALUES (:bid, :hnum, :htype, :price, :monthly, :loc, :beds, :baths, :desc, :eservice, :wservice, 'available')";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':bid', $block_id);
        $stmt->bindParam(':hnum', $house_number);
        $stmt->bindParam(':htype', $house_type);
        $stmt->bindParam(':price', $price);
        $stmt->bindParam(':monthly', $monthly_payment);
        $stmt->bindParam(':loc', $location);
        $stmt->bindParam(':beds', $bedrooms);
        $stmt->bindParam(':baths', $bathrooms);
        $stmt->bindParam(':desc', $description);
        $stmt->bindParam(':eservice', $electric_service);
        $stmt->bindParam(':wservice', $water_service);

        if($stmt->execute()){
            $house_id = $db->lastInsertId();

            // Handle multiple images (up to 6)
            if(isset($_FILES['images'])) {
                $total = count($_FILES['images']['name']);
                $upload_dir = '../../uploads/houses/';
                
                if (!file_exists($upload_dir)) {
                    mkdir($upload_dir, 0777, true);
                }

                for($i=0; $i<$total && $i<6; $i++) {
                    $tmp_name = $_FILES['images']['tmp_name'][$i];
                    if($tmp_name != "") {
                        $file_ext = pathinfo($_FILES['images']['name'][$i], PATHINFO_EXTENSION);
                        $new_name = time() . "_" . $i . "." . $file_ext;
                        $target_path = $upload_dir . $new_name;
                        
                        if(move_uploaded_file($tmp_name, $target_path)) {
                            // Save image path to database
                            $img_path = 'uploads/houses/' . $new_name;
                            $q_img = "INSERT INTO house_images (house_id, image_path) VALUES (:hid, :path)";
                            $s_img = $db->prepare($q_img);
                            $s_img->bindParam(':hid', $house_id);
                            $s_img->bindParam(':path', $img_path);
                            $s_img->execute();
                        }
                    }
                }
            }

            // Increment the block counts (available_houses and total_houses)
            $db->query("UPDATE blocks SET total_houses = total_houses + 1, available_houses = available_houses + 1 WHERE id = " . intval($block_id));

            $db->commit();
            http_response_code(201);
            echo json_encode(array("message" => "House created successfully.", "id" => $house_id));
        } else {
            $db->rollBack();
            http_response_code(503);
            echo json_encode(array("message" => "Unable to create house."));
        }
    } catch (Exception $e) {
        $db->rollBack();
        http_response_code(500);
        echo json_encode(array("message" => "Internal server error.", "error" => $e->getMessage()));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Incomplete data. block_id and house_number are required."));
}
?>
