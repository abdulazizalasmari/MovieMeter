<?php
ini_set('session.use_strict_mode', 1);
ini_set('session.use_only_cookies', 1);

session_start([
    'cookie_lifetime' => 86400,
    'cookie_secure' => true,
    'cookie_httponly' => true,
    'cookie_samesite' => 'Strict',
    'gc_maxlifetime' => 86400,
    'sid_length' => 48,
    'sid_bits_per_character' => 6,
    'use_strict_mode' => 1,
    'use_only_cookies' => 1
]);

if (!isset($_SESSION['last_regeneration'])) {
    session_regenerate_id(true);
    $_SESSION['last_regeneration'] = time();
} else if (time() - $_SESSION['last_regeneration'] > 3600) {
    session_regenerate_id(true);
    $_SESSION['last_regeneration'] = time();
}

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "movies_db";

$conn = new mysqli($servername, $username, $password);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

$sql = "CREATE DATABASE IF NOT EXISTS $dbname";
if ($conn->query($sql) === FALSE) {
    die("Error creating database: " . $conn->error);
}

$conn->select_db($dbname);

$sql = "CREATE TABLE IF NOT EXISTS users (
    id INT(6) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    reg_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)";
if ($conn->query($sql) === FALSE) {
    die("Error creating table: " . $conn->error);
}

function getUserByEmail($conn, $email)
{
    $stmt = $conn->prepare("SELECT * FROM users WHERE email=?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();
    $stmt->close();
    return $result;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = filter_var($_POST['email'], FILTER_SANITIZE_EMAIL);
    $action = $_POST['action'];

    if (empty($email)) {
        echo json_encode(['status' => 'error', 'message' => 'Email is required']);
        exit();
    }

    if ($action === 'Check Email') {
        $result = getUserByEmail($conn, $email);
        if ($result->num_rows > 0) {
            echo json_encode(['status' => 'exists', 'message' => 'Email exists']);
        } else {
            echo json_encode(['status' => 'not_exists', 'message' => 'Email does not exist']);
        }
    } elseif ($action === 'Sign In') {
        $password = $_POST['password'];
        if (empty($password)) {
            echo json_encode(['status' => 'error', 'message' => 'Password is required']);
            exit();
        }
        $result = getUserByEmail($conn, $email);
        if ($result->num_rows > 0) {
            $row = $result->fetch_assoc();
            if (password_verify($password, $row['password'])) {
                session_regenerate_id(true);
                $_SESSION['user'] = $email;
                echo json_encode(['status' => 'success', 'message' => 'Sign in successful']);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Invalid password']);
            }
        } else {
            echo json_encode(['status' => 'error', 'message' => 'No user found with this email.']);
        }
    } elseif ($action === 'Sign Up') {
        $password = $_POST['password'];
        if (empty($password)) {
            echo json_encode(['status' => 'error', 'message' => 'Password is required']);
            exit();
        }
        $result = getUserByEmail($conn, $email);
        if ($result->num_rows > 0) {
            echo json_encode(['status' => 'exists', 'message' => 'Email already exists']);
            exit();
        }
        $hashed_password = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $conn->prepare("INSERT INTO users (email, password) VALUES (?, ?)");
        $stmt->bind_param("ss", $email, $hashed_password);
        if ($stmt->execute()) {
            session_regenerate_id(true);
            $_SESSION['user'] = $email;
            echo json_encode(['status' => 'success', 'message' => 'Sign up successful']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Error: ' . $stmt->error]);
        }
        $stmt->close();
    }
}
$conn->close();
