const API_KEY = '56e24d840bb0cfc2b14ce2c59d34f54b';
const BASE_URL = 'https://api.themoviedb.org/3';

async function searchByKeyword(query) {
    const response = await fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}`);
    return await response.json();
}

async function searchByActor(query) {
    const personResponse = await fetch(`${BASE_URL}/search/person?api_key=${API_KEY}&query=${encodeURIComponent(query)}`);
    const personData = await personResponse.json();

    if (personData.results.length > 0) {
        const actorId = personData.results[0].id;
        const moviesResponse = await fetch(`${BASE_URL}/person/${actorId}/movie_credits?api_key=${API_KEY}`);
        const moviesData = await moviesResponse.json();
        return { results: moviesData.cast };
    }
    return { results: [] };
}

async function searchByGenre(query) {
    const genresResponse = await fetch(`${BASE_URL}/genre/movie/list?api_key=${API_KEY}`);
    const genresData = await genresResponse.json();

    const genre = genresData.genres.find(g =>
        g.name.toLowerCase().includes(query.toLowerCase())
    );

    if (genre) {
        const moviesResponse = await fetch(`${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=${genre.id}`);
        return await moviesResponse.json();
    }
    return { results: [] };
}

async function searchMovies(query, context) {
    const urlParams = new URLSearchParams(window.location.search);
    const searchContext = urlParams.get('context') || 'all';

    try {
        let results = [];

        switch (searchContext) {
            case 'recent':
                const recentResponse = await fetch(`${BASE_URL}/movie/now_playing?api_key=${API_KEY}`);
                const recentData = await recentResponse.json();
                results = recentData.results.filter(movie =>
                    movie.title.toLowerCase().includes(query.toLowerCase()) ||
                    (movie.overview && movie.overview.toLowerCase().includes(query.toLowerCase()))
                );
                break;

            case 'top_rated':
                const topRatedResponse = await fetch(`${BASE_URL}/movie/top_rated?api_key=${API_KEY}`);
                const topRatedData = await topRatedResponse.json();
                results = topRatedData.results.filter(movie =>
                    movie.title.toLowerCase().includes(query.toLowerCase()) ||
                    (movie.overview && movie.overview.toLowerCase().includes(query.toLowerCase()))
                );
                break;

            case 'watchlist':
                const watchlistResponse = await fetch('../html/watchlist.html?action=get');
                const watchlistMovies = await watchlistResponse.json();
                results = watchlistMovies.filter(movie =>
                    movie.title.toLowerCase().includes(query.toLowerCase()) ||
                    (movie.overview && movie.overview.toLowerCase().includes(query.toLowerCase()))
                );
                break;

            case 'favorites':
                const favoritesResponse = await fetch('../html/favorites.html?action=get');
                const favoriteMovies = await favoritesResponse.json();
                results = favoriteMovies.filter(movie =>
                    movie.title.toLowerCase().includes(query.toLowerCase()) ||
                    (movie.overview && movie.overview.toLowerCase().includes(query.toLowerCase()))
                );
                break;

            default:
                const [keywordResults, actorResults, genreResults] = await Promise.all([
                    searchByKeyword(query),
                    searchByActor(query),
                    searchByGenre(query)
                ]);

                const allResults = new Map();
                [...keywordResults.results, ...actorResults.results, ...genreResults.results]
                    .forEach(movie => {
                        if (!allResults.has(movie.id)) {
                            allResults.set(movie.id, movie);
                        }
                    });
                results = Array.from(allResults.values());
        }

        return results;
    } catch (error) {
        console.error('Search error:', error);
        throw error;
    }
}

async function displaySearchResults() {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('query');
    const context = urlParams.get('context') || 'all';

    if (query) {
        const searchResults = document.getElementById('search-results');
        const contextSelect = document.getElementById('search-context');

        contextSelect.value = context;
        searchResults.innerHTML = '<div class="loading">Searching...</div>';

        try {
            let movies = await searchMovies(query, context);

            movies = movies.filter(movie => movie.poster_path);

            searchResults.innerHTML = '';

            if (movies.length === 0) {
                searchResults.innerHTML = '<p>No movies found matching your search.</p>';
                return;
            }

            const headerText = `Search Results for "${query}" in ${context.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}`;
            document.querySelector('h2').textContent = headerText;

            movies.forEach(movie => {
                const movieElement = document.createElement('div');
                movieElement.classList.add('movie');
                movieElement.innerHTML = `
                    <a href="../html/movie-details.html?id=${movie.id}">
                        <img src="https://image.tmdb.org/t/p/original${movie.poster_path}" 
                            alt="${movie.title}">
                        <div class="movie-info">
                            <h3>${movie.title}</h3>
                            <p>Release Date: ${movie.release_date || 'N/A'}</p>
                            <p>Rating: ${movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}</p>
                        </div>
                    </a>
                `;
                searchResults.appendChild(movieElement);
            });
        } catch (error) {
            console.error('Search error:', error);
            searchResults.innerHTML = '<p>An error occurred while searching. Please try again.</p>';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const context = urlParams.get('context') || 'all';
    const searchContext = document.getElementById('search-context');
    if (searchContext) {
        searchContext.value = context;
    }

    displaySearchResults();

    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const contextSelect = document.getElementById('search-context');

    function performSearch() {
        const query = searchInput.value;
        const selectedContext = contextSelect.value;
        if (query) {
            window.location.href = `../html/search-results.html?query=${encodeURIComponent(query)}&context=${selectedContext}`;
        }
    }

    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    $('#search-input').autocomplete({
        source: function (request, response) {
            const context = $('#search-context').val();
            $.ajax({
                url: '../php/autocomplete.php',
                dataType: 'json',
                data: {
                    query: request.term,
                    context: context
                },
                success: function (data) {
                    response(data);
                }
            });
        },
        minLength: 2,
        select: function (event, ui) {
            $('#search-input').val(ui.item.value);
            $('#search-button').click();
        }
    });

    $(document).ready(function () {
        $('#search-input').autocomplete({
            source: function (request, response) {
                const context = $('#search-context').val();
                $.ajax({
                    url: '../php/autocomplete.php',
                    dataType: 'json',
                    data: {
                        query: request.term,
                        context: context
                    },
                    success: function (data) {
                        response(data.slice(0, 7));
                    }
                });
            },
            minLength: 1,
            delay: 300,
            select: function (event, ui) {
                $('#search-input').val(ui.item.value);
                $('#search-button').click();
            },
            open: function (event, ui) {
                $(this).autocomplete("widget").hide().slideDown(200);
            },
            close: function (event, ui) {
                $(this).autocomplete("widget").slideUp(200);
            }
        });

        $(document).on('click', '.watchlist-button', async function (event) {
            event.preventDefault();
            const movieId = $(this).data('movie-id');
            const movieElement = $(this).closest('.movie');
            const movie = {
                id: movieId,
                title: movieElement.find('h3').text(),
                poster_path: movieElement.find('img').attr('src').replace('https://image.tmdb.org/t/p/original', ''),
                release_date: movieElement.find('.movie-info p:first').text().replace('Release Date: ', ''),
                vote_average: parseFloat(movieElement.find('.movie-info p:last').text().replace('Rating: ', ''))
            };
            await addToWatchList(movie);
            $(this).find('img').attr('src', '../img/remove-w.png').attr('alt', 'Remove from Watchlist');
        });

        $(document).on('click', '.favorites-button', async function (event) {
            event.preventDefault();
            const movieId = $(this).data('movie-id');
            const movieElement = $(this).closest('.movie');
            const movie = {
                id: movieId,
                title: movieElement.find('h3').text(),
                poster_path: movieElement.find('img').attr('src').replace('https://image.tmdb.org/t/p/original', ''),
                release_date: movieElement.find('.movie-info p:first').text().replace('Release Date: ', ''),
                vote_average: parseFloat(movieElement.find('.movie-info p:last').text().replace('Rating: ', ''))
            };
            await addToFavorites(movie);
            $(this).find('img').attr('src', '../img/remove-f.png').attr('alt', 'Remove from Favorites');
        });
    });

    async function addToWatchList(movie) {
        try {
            const response = await fetch('../php/watchlist.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'add',
                    movie
                })
            });
            const result = await response.json();
        } catch (error) {
            console.error('Error adding to watchlist:', error);
        }
    }

    async function addToFavorites(movie) {
        try {
            const response = await fetch('../php/favorites.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'add',
                    movie
                })
            });
            const result = await response.json();
        } catch (error) {
            console.error('Error adding to favorites:', error);
        }
    }
});
