<?php
include_once 'config/Database.php';

$database = new Database();
$db = $database->getConnection();

try {
    $db->exec(
        'ALTER TABLE users ADD COLUMN notification_preferences TEXT NULL AFTER updated_at'
    );
    echo 'Added users.notification_preferences.<br>';
} catch (Exception $e) {
    echo 'Note: column may exist: ' . htmlspecialchars($e->getMessage()) . '<br>';
}
echo 'Done.';
