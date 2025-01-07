<?php
session_start();

if (!isset($_SESSION['user'])) {
    header('Location: ../html/index.html?action=unauthorized');
    exit();
}

header('Content-Type: application/json');
echo json_encode(['status' => 'authenticated']);
