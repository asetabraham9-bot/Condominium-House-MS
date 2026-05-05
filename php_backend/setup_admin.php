<?php
// ONE-TIME SETUP SCRIPT — Delete this file after running!
require_once 'config/Database.php';

$database = new Database();
$db = $database->getConnection();

// Admin credentials — change these if you like
$firstName = 'System';
$lastName  = 'Admin';
$email     = 'admin@chms.edu';
$password  = 'Admin@1234';
$phone     = '+251911000001';

// Generate a secure bcrypt hash of the password
$hash = password_hash($password, PASSWORD_BCRYPT);

// Check if admin already exists
$check = $db->prepare("SELECT id FROM users WHERE email = :email");
$check->bindParam(':email', $email);
$check->execute();

if ($check->rowCount() > 0) {
    echo "<h2 style='color:orange;font-family:sans-serif;'>⚠️ Admin already exists with this email.</h2>";
    echo "<p style='font-family:sans-serif;'>Login with: <strong>$email</strong> / <strong>$password</strong></p>";
    exit();
}

// Insert system admin — campus_id is NULL for system admins
$stmt = $db->prepare("
    INSERT INTO users (first_name, last_name, email, password_hash, phone_number, role, campus_id)
    VALUES (:first_name, :last_name, :email, :hash, :phone, 'system_admin', NULL)
");

$stmt->bindParam(':first_name', $firstName);
$stmt->bindParam(':last_name',  $lastName);
$stmt->bindParam(':email',      $email);
$stmt->bindParam(':hash',       $hash);
$stmt->bindParam(':phone',      $phone);

if ($stmt->execute()) {
    $newId = $db->lastInsertId();
    echo "
    <div style='font-family:sans-serif; max-width:500px; margin:60px auto; padding:30px; 
                border:2px solid #16a34a; border-radius:12px; background:#f0fdf4;'>
        <h2 style='color:#15803d; margin-top:0;'>✅ System Admin Created Successfully!</h2>
        <table style='width:100%; border-collapse:collapse;'>
            <tr><td style='padding:8px; color:#555;'>User ID</td><td style='padding:8px; font-weight:bold;'>$newId</td></tr>
            <tr style='background:#dcfce7;'><td style='padding:8px; color:#555;'>Name</td><td style='padding:8px; font-weight:bold;'>$firstName $lastName</td></tr>
            <tr><td style='padding:8px; color:#555;'>Email</td><td style='padding:8px; font-weight:bold;'>$email</td></tr>
            <tr style='background:#dcfce7;'><td style='padding:8px; color:#555;'>Password</td><td style='padding:8px; font-weight:bold;'>$password</td></tr>
            <tr><td style='padding:8px; color:#555;'>Role</td><td style='padding:8px; font-weight:bold;'>system_admin</td></tr>
        </table>
        <div style='margin-top:20px; padding:12px; background:#fef9c3; border:1px solid #ca8a04; border-radius:8px;'>
            <strong style='color:#92400e;'>⚠️ IMPORTANT:</strong>
            <p style='color:#92400e; margin:4px 0 0;'>Delete this file immediately after use:<br>
            <code>c:\\xampp\\htdocs\\REALPRO\\php_backend\\setup_admin.php</code></p>
        </div>
        <a href='http://localhost:4000/login' style='display:inline-block; margin-top:16px; padding:10px 24px;
           background:#1d4ed8; color:white; text-decoration:none; border-radius:8px; font-weight:bold;'>
           → Go to Login Page
        </a>
    </div>
    ";
} else {
    echo "<h2 style='color:red;font-family:sans-serif;'>❌ Failed to create admin. Check DB connection.</h2>";
}
?>
