<?php
include_once 'config/Database.php';

$database = new Database();
$db = $database->getConnection();

try {
    // 1. Create house_images table
    $query = "CREATE TABLE IF NOT EXISTS house_images (
        id INT AUTO_INCREMENT PRIMARY KEY,
        house_id INT NOT NULL,
        image_path VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (house_id) REFERENCES houses(id) ON DELETE CASCADE
    )";
    $db->exec($query);
    echo "Table house_images created successfully.<br>";

    // 2. Create uploads directory if it doesn't exist
    $dir = 'uploads/houses';
    if (!file_exists($dir)) {
        mkdir($dir, 0777, true);
        echo "Directory $dir created successfully.<br>";
    } else {
        echo "Directory $dir already exists.<br>";
    }

    echo "Migration completed.";
} catch (Exception $e) {
    echo "Migration failed: " . $e->getMessage();
}
?>
