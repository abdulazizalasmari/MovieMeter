<?php
$API_KEY = '56e24d840bb0cfc2b14ce2c59d34f54b';
$BASE_URL = 'https://api.themoviedb.org/3';

$query = isset($_GET['query']) ? $_GET['query'] : '';
$context = isset($_GET['context']) ? $_GET['context'] : 'all';

$suggestions = [];

if ($query) {
    switch ($context) {
        case 'recent':
            $url = "$BASE_URL/movie/now_playing?api_key=$API_KEY";
            break;
        case 'top_rated':
            $url = "$BASE_URL/movie/top_rated?api_key=$API_KEY";
            break;
        case 'watchlist':
            $url = '../html/watchlist.html?action=get';
            break;
        case 'favorites':
            $url = '../html/favorites.html?action=get';
            break;
        default:
            $url = "$BASE_URL/search/movie?api_key=$API_KEY&query=" . urlencode($query);
            break;
    }

    if ($context === 'watchlist' || $context === 'favorites') {
        $response = file_get_contents($url);
        $data = json_decode($response, true);
        $movies = $data;
    } else {
        $response = file_get_contents($url);
        $data = json_decode($response, true);
        $movies = $data['results'];
    }

    $suggestions = array_filter(array_map(function ($movie) use ($query) {
        return stripos($movie['title'], $query) !== false ? $movie['title'] : null;
    }, $movies));
}

echo json_encode(array_values($suggestions));
