const API_KEY = '56e24d840bb0cfc2b14ce2c59d34f54b';
const BASE_URL = 'https://api.themoviedb.org/3';

async function fetchMovies(endpoint) {
    const response = await fetch(`${BASE_URL}${endpoint}?api_key=${API_KEY}`);
    const data = await response.json();

    const movies = [];
    for (let i = 0; i < data.results.length; i += 5) {
        const batch = data.results.slice(i, i + 5);
        const detailPromises = batch.map(movie =>
            fetch(`${BASE_URL}/movie/${movie.id}?api_key=${API_KEY}&append_to_response=credits,keywords`)
                .then(res => res.json())
        );

        const details = await Promise.all(detailPromises);
        movies.push(...details.map((detail, index) => ({
            ...batch[index],
            genres: detail.genres,
            actors: detail.credits.cast.slice(0, 5),
            keywords: detail.keywords.keywords
        })));
    }
    return movies;
}

function createMovieElement(movie, isInWatchlist, isInFavorites, index) {
    const movieElement = document.createElement('div');
    movieElement.classList.add('movie');
    movieElement.style.setProperty('--animation-order', index);

    const genres = movie.genres.map(g => g.name).join(', ');
    const actors = movie.actors.map(a => a.name).join(', ');
    const keywords = movie.keywords.map(k => k.name).join(', ');

    movieElement.innerHTML = `
        <div class="movie-inner">
            <a href="../html/movie-details.html?id=${movie.id}">
                <div class="movie-poster-wrapper">
                    <div class="movie-poster-overlay"></div>
                    <img src="https://image.tmdb.org/t/p/original${movie.poster_path}" 
                         alt="${movie.title}">
                </div>
                <div class="movie-info">
                    <h3>${movie.title}</h3>
                    <p class="release-date">Release Date: ${movie.release_date}</p>
                    <p class="rating">Rating: ${movie.vote_average.toFixed(1)}</p>
                </div>
            </a>
                <button class="watchlist-button" data-movie-id="${movie.id}">
                    <img src="${isInWatchlist ? '../img/remove-w.png' : '../img/add-w.png'}" 
                         alt="${isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}">
                    <span class="action-text">${isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}</span>
                </button>
                <button class="favorites-button" data-movie-id="${movie.id}">
                    <img src="${isInFavorites ? '../img/remove-f.png' : '../img/add-f.png'}" 
                         alt="${isInFavorites ? 'Remove from Favorites' : 'Add to Favorites'}">
                    <span class="action-text">${isInFavorites ? 'Remove from Favorites' : 'Add to Favorites'}</span>
                </button>
                <div class="movie-metadata" style="display: none;">
                    <span class="genres">${genres}</span>
                    <span class="actors">${actors}</span>
                    <span class="keywords">${keywords}</span>
                </div>
        </div>
    `;

    const watchlistButton = movieElement.querySelector('.watchlist-button');
    watchlistButton.addEventListener('click', async (event) => {
        event.preventDefault();
        if (isInWatchlist) {
            showToast('Remove from watchlist?', {
                duration: -1,
                backgroundColor: '#ff9800',
                close: false,
                gravity: 'top',
                position: 'center',
                onClick: null,
                className: 'confirmation-toast',
                customButtons: [
                    {
                        text: 'Yes',
                        onClick: async () => {
                            await removeFromWatchList(movie.id);
                            watchlistButton.querySelector('img').src = '../img/add-w.png';
                            watchlistButton.querySelector('img').alt = 'Add to Watchlist';
                            watchlistButton.querySelector('.action-text').textContent = 'Add to Watchlist';
                            isInWatchlist = false;
                        }
                    },
                    {
                        text: 'Cancel',
                        onClick: () => { }
                    }
                ]
            });
        } else {
            await addToWatchList(movie);
            watchlistButton.querySelector('img').src = '../img/remove-w.png';
            watchlistButton.querySelector('img').alt = 'Remove from Watchlist';
            watchlistButton.querySelector('.action-text').textContent = 'Remove from Watchlist';
            isInWatchlist = true;
        }
    });

    const favoritesButton = movieElement.querySelector('.favorites-button');
    favoritesButton.addEventListener('click', async (event) => {
        event.preventDefault();
        if (isInFavorites) {
            showToast('Remove from favorites?', {
                duration: -1,
                backgroundColor: '#ff9800',
                close: false,
                gravity: 'top',
                position: 'center',
                onClick: null,
                className: 'confirmation-toast',
                customButtons: [
                    {
                        text: 'Yes',
                        onClick: async () => {
                            await removeFromFavorites(movie.id);
                            favoritesButton.querySelector('img').src = '../img/add-f.png';
                            favoritesButton.querySelector('img').alt = 'Add to Favorites';
                            isInFavorites = false;
                        }
                    },
                    {
                        text: 'Cancel',
                        onClick: () => { }
                    }
                ]
            });
        } else {
            await addToFavorites(movie);
            favoritesButton.querySelector('img').src = '../img/remove-f.png';
            favoritesButton.querySelector('img').alt = 'Remove from Favorites';
            isInFavorites = true;
        }
    });

    return movieElement;
}

async function displayMovies() {
    const containers = ['recent-movies', 'highly-rated-movies'];
    containers.forEach(containerId => {
        const container = document.getElementById(containerId);
        container.innerHTML = `
            <div class="loading-skeleton">
                ${Array(4).fill('<div class="movie-skeleton"></div>').join('')}
            </div>`;
    });

    const [recentMovies, highlyRatedMovies, watchlistResponse, favoritesResponse] = await Promise.all([
        fetchMovies('/movie/now_playing'),
        fetchMovies('/movie/top_rated'),
        fetch('../php/watchlist.php?action=get'),
        fetch('../php/favorites.php?action=get')
    ]);

    let watchlistMovieIds = [];
    let favoritesMovieIds = [];
    try {
        const watchlistData = await watchlistResponse.json();
        watchlistMovieIds = Array.isArray(watchlistData) ? watchlistData.map(m => m.id) : [];

        const favoritesData = await favoritesResponse.json();
        favoritesMovieIds = Array.isArray(favoritesData) ? favoritesData.map(m => m.id) : [];
    } catch (error) {
        console.error('Error processing lists:', error);
    }

    containers.forEach(containerId => {
        const container = document.getElementById(containerId);
        container.innerHTML = '';
    });

    const recentMoviesContainer = document.getElementById('recent-movies');
    const highlyRatedMoviesContainer = document.getElementById('highly-rated-movies');

    recentMovies.slice(0, 20).forEach((movie, index) => {
        const isInWatchlist = watchlistMovieIds.includes(movie.id);
        const isInFavorites = favoritesMovieIds.includes(movie.id);
        recentMoviesContainer.appendChild(createMovieElement(movie, isInWatchlist, isInFavorites, index));
    });

    highlyRatedMovies.slice(0, 20).forEach((movie, index) => {
        const isInWatchlist = watchlistMovieIds.includes(movie.id);
        const isInFavorites = favoritesMovieIds.includes(movie.id);
        highlyRatedMoviesContainer.appendChild(createMovieElement(movie, isInWatchlist, isInFavorites, index));
    });

    setupSectionSearch();
}

function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

function setupSectionSearch() {
    $('.section-search-wrapper .search-input').each(function () {
        const section = $(this).data('section');
        const container = section === 'recent' ? '#recent-movies' : '#highly-rated-movies';
        $(container).after(`<div class="no-results" data-for="${section}" style="display:none;">No movies found matching your search.</div>`);

        const debouncedSearch = debounce(function (searchTerm) {
            let hasResults = false;
            $(`${container} .movie`).each(function () {
                const movieElement = $(this);
                const title = movieElement.find('h3').text().toLowerCase();
                const releaseDate = movieElement.find('.release-date').text().toLowerCase();
                const rating = movieElement.find('.rating').text().toLowerCase();
                const genres = movieElement.find('.genres').text().toLowerCase();
                const actors = movieElement.find('.actors').text().toLowerCase();
                const keywords = movieElement.find('.keywords').text().toLowerCase();

                const matches = title.includes(searchTerm) ||
                    releaseDate.includes(searchTerm) ||
                    rating.includes(searchTerm) ||
                    genres.includes(searchTerm) ||
                    actors.includes(searchTerm) ||
                    keywords.includes(searchTerm);

                movieElement.removeClass('search-hidden search-visible');

                if (matches) {
                    hasResults = true;
                    movieElement.addClass('search-visible');
                } else {
                    movieElement.addClass('search-hidden');
                }
            });

            const noResults = $(`.no-results[data-for="${section}"]`);
            if (!hasResults && searchTerm.length > 0) {
                noResults.fadeIn(300);
            } else {
                noResults.fadeOut(300);
            }
        }, 300);

        $(this).on('input', function () {
            const searchTerm = $(this).val().toLowerCase();
            debouncedSearch(searchTerm);
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('signup') === 'success') {
        showToast('Signed up successfuly! Welcome to MovieMeter.', {
            backgroundColor: '#28a745',
            duration: 5000
        });
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    displayMovies();

    const loadScript = (src) => {
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        document.body.appendChild(script);
    };

    setTimeout(() => {
        loadScript('../js/jquery.js');
    }, 1000);
});

$(document).ready(function () {
    $('#search-input.search-input').autocomplete({
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
});

document.getElementById('search-button').addEventListener('click', () => {
    const query = document.getElementById('search-input').value;
    const context = document.getElementById('search-context').value;
    if (query) {
        window.location.href = `../html/search-results.html?query=${encodeURIComponent(query)}&context=${context}`;
    }
});

document.getElementById('search-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const query = e.target.value;
        const context = document.getElementById('search-context').value;
        if (query) {
            window.location.href = `../html/search-results.html?query=${encodeURIComponent(query)}&context=${context}`;
        }
    }
});

async function addToWatchList(movie) {
    try {
        const response = await fetch('../php/watchlist.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'add', movie })
        });

        const responseText = await response.text();
        let result;
        try {
            result = JSON.parse(responseText);
        } catch (e) {
            throw new Error(`Invalid JSON response: ${responseText}`);
        }

        showToast('Movie added to watchlist', {
            backgroundColor: '#28a745'
        });

        const addButton = document.getElementById('add-to-watchlist-button');
        const removeButton = document.getElementById('remove-from-watchlist-button');
        if (addButton && removeButton) {
            addButton.style.display = 'none';
            removeButton.style.display = 'flex';
        }

        return result;
    } catch (error) {
        console.error('Error adding to watchlist:', error);
        showToast('Failed to add to watchlist', {
            backgroundColor: '#dc3545'
        });
    }
}

async function removeFromWatchList(movieId) {
    try {
        const response = await fetch('../php/watchlist.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'remove', movieId })
        });

        const responseText = await response.text();
        let result;
        try {
            result = JSON.parse(responseText);
        } catch (e) {
            throw new Error(`Invalid JSON response: ${responseText}`);
        }

        showToast('Movie removed from watchlist', {
            backgroundColor: '#28a745'
        });

        const addButton = document.getElementById('add-to-watchlist-button');
        const removeButton = document.getElementById('remove-from-watchlist-button');
        if (addButton && removeButton) {
            addButton.style.display = 'flex';
            removeButton.style.display = 'none';
        }

        return result;
    } catch (error) {
        console.error('Error removing from watchlist:', error);
        showToast('Failed to remove from watchlist', {
            backgroundColor: '#dc3545'
        });
    }
}

async function addToFavorites(movie) {
    try {
        const response = await fetch('../php/favorites.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'add', movie })
        });

        const responseText = await response.text();
        let result;
        try {
            result = JSON.parse(responseText);
        } catch (e) {
            if (response.ok) {
                result = { success: true };
            } else {
                throw new Error(`Invalid response: ${responseText}`);
            }
        }

        showToast('Movie added to favorites', {
            backgroundColor: '#28a745'
        });

        const addButton = document.getElementById('add-to-favorites-button');
        const removeButton = document.getElementById('remove-from-favorites-button');
        if (addButton && removeButton) {
            addButton.style.display = 'none';
            removeButton.style.display = 'flex';
        }
    } catch (error) {
        console.error('Error adding to favorites:', error);
        showToast('Failed to add to favorites', {
            backgroundColor: '#dc3545'
        });
    }
}

async function removeFromFavorites(movieId) {
    try {
        const response = await fetch('../php/favorites.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'remove', movieId })
        });

        const responseText = await response.text();
        let result;
        try {
            result = JSON.parse(responseText);
        } catch (e) {
            if (response.ok) {
                result = { success: true };
            } else {
                throw new Error(`Invalid response: ${responseText}`);
            }
        }

        showToast('Movie removed from favorites', {
            backgroundColor: '#28a745'
        });

        const addButton = document.getElementById('add-to-favorites-button');
        const removeButton = document.getElementById('remove-from-favorites-button');
        if (addButton && removeButton) {
            addButton.style.display = 'flex';
            removeButton.style.display = 'none';
        }
    } catch (error) {
        console.error('Error removing from favorites:', error);
        showToast('Failed to remove from favorites', {
            backgroundColor: '#dc3545'
        });
    }
}

function showToast(message, options = {}) {
    const toastElement = Toastify({
        text: message,
        duration: options.duration || 4000,
        close: options.close || true,
        gravity: options.gravity || "top",
        position: options.position || "center",
        backgroundColor: options.backgroundColor,
        stopOnFocus: options.stopOnFocus || true,
        onClick: options.onClick || function () { },
        className: options.className || ''
    }).showToast();

    if (options.customButtons) {
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'toast-buttons';

        options.customButtons.forEach(button => {
            const btn = document.createElement('button');
            btn.textContent = button.text;
            btn.className = 'toast-button';
            btn.onclick = () => {
                button.onClick();
                toastElement.hideToast();
            };
            buttonContainer.appendChild(btn);
        });

        toastElement.toastElement.appendChild(buttonContainer);
    }

    return toastElement;
}
