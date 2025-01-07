<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user'])) {
    echo json_encode(['error' => 'Not authenticated']);
    exit();
}

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "movies_db";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

$sql = "CREATE TABLE IF NOT EXISTS watchlist (
    id INT(6) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_email VARCHAR(50) NOT NULL,
    movie_id INT(6) NOT NULL,
    movie_data JSON NOT NULL,
    UNIQUE KEY unique_movie (user_email, movie_id)
)";
if ($conn->query($sql) === FALSE) {
    die("Error creating table: " . $conn->error);
}

$user_email = $_SESSION['user'];
$responseData = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $action = $data['action'];

    if ($action === 'add') {
        $movie_id = $data['movie']['id'];
        $movie_data = json_encode($data['movie']);
        $stmt = $conn->prepare("INSERT INTO watchlist (user_email, movie_id, movie_data) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE movie_data=?");
        $stmt->bind_param("siss", $user_email, $movie_id, $movie_data, $movie_data);
        if ($stmt->execute()) {
            $responseData = ['message' => 'Movie added to watchlist'];
        } else {
            $responseData = ['message' => 'Error adding movie to watchlist: ' . $stmt->error];
        }
        $stmt->close();
    } elseif ($action === 'remove') {
        $movie_id = $data['movieId'];
        $stmt = $conn->prepare("DELETE FROM watchlist WHERE user_email=? AND movie_id=?");
        $stmt->bind_param("si", $user_email, $movie_id);
        if ($stmt->execute()) {
            $responseData = ['message' => 'Movie removed from watchlist'];
        } else {
            $responseData = ['message' => 'Error removing movie from watchlist: ' . $stmt->error];
        }
        $stmt->close();
    }
} elseif (isset($_GET['action']) && $_GET['action'] === 'get') {
    $stmt = $conn->prepare("SELECT movie_data FROM watchlist WHERE user_email=?");
    $stmt->bind_param("s", $user_email);
    $stmt->execute();
    $result = $stmt->get_result();
    $movies = [];
    while ($row = $result->fetch_assoc()) {
        $movies[] = json_decode($row['movie_data'], true);
    }
    echo json_encode($movies);
    $stmt->close();
    $conn->close();
    exit();
}

echo json_encode($responseData);
$conn->close();
