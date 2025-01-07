const API_KEY = '56e24d840bb0cfc2b14ce2c59d34f54b';
const BASE_URL = 'https://api.themoviedb.org/3';
let guestSessionId = '';
const SESSION_RATINGS_KEY = 'userMovieRatings';

async function createGuestSession() {
    try {
        const response = await fetch(`${BASE_URL}/authentication/guest_session/new?api_key=${API_KEY}`);
        if (response.ok) {
            const data = await response.json();
            guestSessionId = data.guest_session_id;
        } else {
            console.error('Failed to create guest session');
        }
    } catch (error) {
        console.error('Error creating guest session:', error);
    }
}

createGuestSession();

async function fetchMovieDetails(movieId) {
    try {
        const response = await fetch(`${BASE_URL}/movie/${movieId}?api_key=${API_KEY}`);
        if (!response.ok) {
            throw new Error('Failed to fetch movie details');
        }
        const movie = await response.json();
        return movie;
    } catch (error) {
        console.error('Error fetching movie details:', error);
        showToast('Failed to load movie details', {
            type: 'error',
            backgroundColor: '#dc3545'
        });
        return null;
    }
}

async function fetchMovieCredits(movieId) {
    try {
        const response = await fetch(`${BASE_URL}/movie/${movieId}/credits?api_key=${API_KEY}`);
        if (!response.ok) {
            throw new Error('Failed to fetch movie credits');
        }
        const credits = await response.json();
        return credits;
    } catch (error) {
        console.error('Error fetching movie credits:', error);
        showToast('Failed to load movie credits', {
            type: 'error',
            backgroundColor: '#dc3545'
        });
        return null;
    }
}

async function fetchSimilarMovies(movieId) {
    try {
        const response = await fetch(`${BASE_URL}/movie/${movieId}/similar?api_key=${API_KEY}`);
        if (!response.ok) {
            throw new Error('Failed to fetch similar movies');
        }
        const similarMovies = await response.json();
        return similarMovies.results;
    } catch (error) {
        console.error('Error fetching similar movies:', error);
        showToast('Failed to load similar movies', {
            type: 'error',
            backgroundColor: '#dc3545'
        });
        return [];
    }
}

async function fetchMovieVideos(movieId) {
    try {
        const response = await fetch(`${BASE_URL}/movie/${movieId}/videos?api_key=${API_KEY}`);
        if (!response.ok) {
            throw new Error('Failed to fetch movie videos');
        }
        const videos = await response.json();
        return videos.results;
    } catch (error) {
        console.error('Error fetching movie videos:', error);
        showToast('Failed to load movie videos', {
            type: 'error',
            backgroundColor: '#dc3545'
        });
        return [];
    }
}

async function addToWatchList(movie) {
    try {
        const response = await fetch('../php/watchlist.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'add', movie })
        });
        const result = await response.json();

        showToast('Added to watchlist!', {
            type: 'success',
            backgroundColor: '#28a745'
        });

        document.getElementById('add-to-watchlist-button').style.display = 'none';
        document.getElementById('remove-from-watchlist-button').style.display = 'flex';
    } catch (error) {
        console.error('Error adding to watchlist:', error);
        showToast('Failed to add to watchlist', {
            type: 'error',
            backgroundColor: '#dc3545'
        });
    }
}

async function removeFromWatchList(movieId) {
    try {
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
                        const response = await fetch('../php/watchlist.php', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'remove', movieId })
                        });
                        const result = await response.json();

                        showToast('Removed from watchlist!', {
                            type: 'success',
                            backgroundColor: '#28a745'
                        });

                        document.getElementById('add-to-watchlist-button').style.display = 'flex';
                        document.getElementById('remove-from-watchlist-button').style.display = 'none';
                    }
                },
                {
                    text: 'Cancel',
                    onClick: () => { }
                }
            ]
        });
    } catch (error) {
        console.error('Error removing from watchlist:', error);
        showToast('Failed to remove from watchlist', {
            type: 'error',
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
        const result = await response.json();

        showToast('Added to favorites!', {
            type: 'success',
            backgroundColor: '#28a745'
        });

        document.getElementById('add-to-favorites-button').style.display = 'none';
        document.getElementById('remove-from-favorites-button').style.display = 'flex';
    } catch (error) {
        console.error('Error adding to favorites:', error);
        showToast('Failed to add to favorites', {
            type: 'error',
            backgroundColor: '#dc3545'
        });
    }
}

async function removeFromFavorites(movieId) {
    try {
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
                        const response = await fetch('../php/favorites.php', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'remove', movieId })
                        });
                        const result = await response.json();

                        showToast('Removed from favorites!', {
                            type: 'success',
                            backgroundColor: '#28a745'
                        });

                        document.getElementById('add-to-favorites-button').style.display = 'flex';
                        document.getElementById('remove-from-favorites-button').style.display = 'none';
                    }
                },
                {
                    text: 'Cancel',
                    onClick: () => { }
                }
            ]
        });
    } catch (error) {
        console.error('Error removing from favorites:', error);
        showToast('Failed to remove from favorites', {
            type: 'error',
            backgroundColor: '#dc3545'
        });
    }
}

function getStoredRatings() {
    const ratings = sessionStorage.getItem(SESSION_RATINGS_KEY);
    return ratings ? JSON.parse(ratings) : {};
}

function storeRating(movieId, rating) {
    const ratings = getStoredRatings();
    ratings[movieId] = rating;
    sessionStorage.setItem(SESSION_RATINGS_KEY, JSON.stringify(ratings));
}
function updateStarSelection(rating) {
    const stars = document.querySelectorAll('.star');
    stars.forEach((star) => {
        if (parseInt(star.getAttribute('data-value'), 10) <= rating) {
            star.classList.add('selected');
        } else {
            star.classList.remove('selected');
        }
    });
}
async function rateMovie(movieId, rating) {
    try {
        const response = await fetch(`${BASE_URL}/movie/${movieId}/rating?api_key=${API_KEY}&guest_session_id=${guestSessionId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ value: rating })
        });

        if (response.ok) {
            storeRating(movieId, rating);

            showToast('Rating submitted!', {
                type: 'success',
                backgroundColor: '#28a745'
            });

            updateRatingUI(rating);
        } else {
            throw new Error('Failed to save rating');
        }
    } catch (error) {
        console.error('Error rating the movie:', error);
        showToast('Failed to rate movie', {
            type: 'error',
            backgroundColor: '#dc3545'
        });
    }
}

function updateRatingUI(rating) {
    const rateMovieButton = document.getElementById('rate-movie-button');
    rateMovieButton.innerHTML = `
        <span style="color: black; font-size: 38px; padding-bottom: 7px;">&#9733;</span>
        <span class="action-text">Rated ${rating}/10</span>
    `;
    rateMovieButton.style.backgroundColor = '#F2C14E';
}

async function loadExistingRating(movieId) {
    try {
        const ratings = getStoredRatings();
        const storedRating = ratings[movieId];

        if (storedRating) {
            updateRatingUI(storedRating);
            selectedRating = storedRating;
            updateStarSelection(storedRating);
        }
    } catch (error) {
        console.error('Error loading existing rating:', error);
    }
}

async function removeRating(movieId) {
    try {
        const response = await fetch(`${BASE_URL}/movie/${movieId}/rating?api_key=${API_KEY}&guest_session_id=${guestSessionId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            const ratings = getStoredRatings();
            delete ratings[movieId];
            sessionStorage.setItem(SESSION_RATINGS_KEY, JSON.stringify(ratings));

            showToast('Rating removed successfully', {
                type: 'success',
                backgroundColor: '#28a745'
            });
        } else {
            throw new Error('Failed to remove rating');
        }
    } catch (error) {
        console.error('Error removing rating:', error);
        showToast('Failed to remove rating', {
            type: 'error',
            backgroundColor: '#dc3545'
        });
    }
}

async function fetchRatedMovies() {
    try {
        const ratings = getStoredRatings();

        const moviePromises = Object.entries(ratings).map(async ([movieId, rating]) => {
            const response = await fetch(`${BASE_URL}/movie/${movieId}?api_key=${API_KEY}`);
            const movie = await response.json();
            return { ...movie, rating };
        });

        const ratedMovies = await Promise.all(moviePromises);
        return ratedMovies;
    } catch (error) {
        console.error('Error fetching rated movies:', error);
        showToast('Failed to load rated movies', {
            type: 'error',
            backgroundColor: '#dc3545'
        });
        return [];
    }
}

async function showRatedMovies() {
    try {
        const ratedMovies = await fetchRatedMovies();
        const ratedContainer = document.getElementById('rated-movies');

        if (!ratedContainer) return;

        ratedContainer.innerHTML = '';

        if (ratedMovies.length === 0) {
            showEmptyState(ratedContainer);
            return;
        }

        ratedMovies.forEach(movie => {
            const movieElement = document.createElement('div');
            movieElement.classList.add('movie');
            movieElement.innerHTML = `
                <a href="../html/movie-details.html?id=${movie.id}">
                    <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" 
                         alt="${movie.title}"
                         onerror="this.src='../img/no-poster.png'">
                    <div class="movie-info">
                        <h3>${movie.title}</h3>
                        <p class="user-rating">Your Rating: ${movie.rating}/10 ⭐</p>
                        <p class="avg-rating">Average: ${movie.vote_average.toFixed(1)}/10</p>
                    </div>
                </a>
                <button class="remove-button" title="Remove Rating">&times;</button>
            `;

            ratedContainer.appendChild(movieElement);

            const removeButton = movieElement.querySelector('.remove-button');
            removeButton.addEventListener('click', async () => {
                if (confirm('Are you sure you want to remove this rating?')) {
                    await removeRating(movie.id);
                    movieElement.remove();

                    if (document.querySelectorAll('#rated-movies .movie').length === 0) {
                        showEmptyState(ratedContainer);
                    }
                }
            });
        });
    } catch (error) {
        console.error('Error showing rated movies:', error);
        showToast('Failed to display rated movies', {
            type: 'error',
            backgroundColor: '#dc3545'
        });
    }
}

function showEmptyState(container) {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.innerHTML = `
        <img src="../img/empty-rated.png" alt="No Ratings">
        <h3>No Rated Movies Yet</h3>
        <p>Start rating movies to build your personal movie opinions!</p>
        <a href="../html/homepage.html" class="browse-button">Browse Movies</a>
    `;
    container.appendChild(emptyState);
}

async function fetchMovieKeywords(movieId) {
    try {
        const response = await fetch(`${BASE_URL}/movie/${movieId}/keywords?api_key=${API_KEY}`);
        if (!response.ok) {
            throw new Error('Failed to fetch movie keywords');
        }
        const data = await response.json();
        return data.keywords;
    } catch (error) {
        console.error('Error fetching movie keywords:', error);
        return [];
    }
}

function displayMovieDetails(movie) {
    try {
        if (!movie) return;
        document.getElementById('movie-poster').src = `https://image.tmdb.org/t/p/original${movie.poster_path}`;
        document.getElementById('movie-title').textContent = movie.title;
        document.getElementById('movie-overview').textContent = movie.overview;
        document.getElementById('movie-release-date').textContent = `Release Date: ${movie.release_date}`;
        document.getElementById('movie-rating').textContent = `Rating: ${movie.vote_average.toFixed(1)}`;
        document.getElementById('movie-genres').textContent = `Genres: ${movie.genres.map(genre => genre.name).join(', ')}`;

        fetchMovieKeywords(movie.id).then(keywords => {
            const keywordsText = keywords.length > 0
                ? `Keywords: ${keywords.slice(0, 4).map(keyword => keyword.name).join(', ')}`
                : 'Keywords: None available';
            document.getElementById('movie-keywords').textContent = keywordsText;
        });

        const hours = Math.floor(movie.runtime / 60);
        const minutes = movie.runtime % 60;
        const runtimeText = hours > 0
            ? `Runtime: ${hours}h ${minutes}min`
            : `Runtime: ${minutes}min`;
        document.getElementById('movie-runtime').textContent = runtimeText;

        document.getElementById('movie-tagline').textContent = movie.tagline ? `Tagline: ${movie.tagline}` : '';
        document.getElementById('movie-companies').textContent = `Production Companies: ${movie.production_companies.map(company => company.name).join(', ')}`;
        document.getElementById('movie-budget').textContent = `Budget: $${movie.budget.toLocaleString()}`;
        document.getElementById('movie-revenue').textContent = `Revenue: $${movie.revenue.toLocaleString()}`;
        document.getElementById('movie-language').textContent = `Original Language: ${movie.original_language}`;
        document.getElementById('movie-vote-count').textContent = `Vote Count: ${movie.vote_count}`;
        document.getElementById('movie-popularity').textContent = `Popularity: ${movie.popularity}`;
        document.getElementById('movie-backdrop').src = `https://image.tmdb.org/t/p/original${movie.backdrop_path}`;

        const detailsBody = document.getElementById('details-body');
        detailsBody.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('https://image.tmdb.org/t/p/original${movie.backdrop_path}')`;
        detailsBody.style.backgroundSize = 'cover';
        detailsBody.style.backgroundPosition = 'center';
        detailsBody.style.backgroundRepeat = 'no-repeat';
        detailsBody.style.backgroundAttachment = 'fixed';

        const backgroundBlur = document.getElementById('background-blur');
        backgroundBlur.style.backgroundImage = `url('https://image.tmdb.org/t/p/original${movie.backdrop_path}')`;
        backgroundBlur.style.position = 'fixed';
        backgroundBlur.style.top = '0';
        backgroundBlur.style.left = '0';
        backgroundBlur.style.width = '100%';
        backgroundBlur.style.height = '100%';
        backgroundBlur.style.backgroundSize = 'cover';
        backgroundBlur.style.backgroundPosition = 'center';
        backgroundBlur.style.filter = 'blur(10px)';
        backgroundBlur.style.zIndex = '-1';

        document.getElementById('movie-collection').textContent = movie.belongs_to_collection ? `Part of: ${movie.belongs_to_collection.name}` : 'Not part of a collection';
        document.getElementById('movie-production-countries').textContent = `Production Countries: ${movie.production_countries.map(country => country.name).join(', ')}`;
        document.getElementById('movie-director').textContent = `Director: ${movie.director}`;
    } catch (error) {
        console.error('Error displaying movie details:', error);
        showToast('Failed to display movie details', {
            type: 'error',
            backgroundColor: '#dc3545'
        });
    }
}

function displayMovieCredits(credits) {
    try {
        if (!credits) return;
        const castContainer = document.getElementById('movie-cast');
        const director = credits.crew.find(member => member.job === 'Director');

        if (director) {
            document.getElementById('movie-director').textContent = `Director: ${director.name}`;
        }

        const castWithPhotos = credits.cast.filter(member => member.profile_path);

        castWithPhotos.slice(0, 10).forEach(member => {
            const castMember = document.createElement('div');
            castMember.classList.add('cast-member');
            castMember.innerHTML = `
                <img src="https://image.tmdb.org/t/p/w185${member.profile_path}" alt="${member.name}">
                <p>${member.name} as ${member.character}</p>
            `;
            castContainer.appendChild(castMember);
        });

        if (castWithPhotos.length === 0) {
            castContainer.innerHTML = '<p>No cast information available</p>';
        }
    } catch (error) {
        console.error('Error displaying movie credits:', error);
        showToast('Failed to display movie credits', {
            type: 'error',
            backgroundColor: '#dc3545'
        });
    }
}

function displaySimilarMovies(movies) {
    try {
        if (!movies || !movies.length) {
            const similarMoviesContainer = document.getElementById('similar-movies');
            similarMoviesContainer.innerHTML = '<p>No similar movies found</p>';
            return;
        }

        const moviesWithPosters = movies.filter(movie => movie.poster_path);

        if (!moviesWithPosters.length) {
            const similarMoviesContainer = document.getElementById('similar-movies');
            similarMoviesContainer.innerHTML = '<p>No similar movies found</p>';
            return;
        }

        const similarMoviesContainer = document.getElementById('similar-movies');
        similarMoviesContainer.innerHTML = '';
        moviesWithPosters.slice(0, 4).forEach(movie => {
            const movieElement = document.createElement('div');
            movieElement.classList.add('movie');
            movieElement.innerHTML = `
                <a href="../html/movie-details.html?id=${movie.id}">
                    <img src="https://image.tmdb.org/t/p/original${movie.poster_path}" alt="${movie.title}">
                    <div class="movie-info">
                        <h3>${movie.title}</h3>
                        <p class="release-date">Release Date: ${movie.release_date}</p>
                        <p>Rating: ${movie.vote_average.toFixed(1)}</p>
                    </div>
                </a>
            `;
            similarMoviesContainer.appendChild(movieElement);
        });
    } catch (error) {
        console.error('Error displaying similar movies:', error);
        showToast('Failed to display similar movies', {
            type: 'error',
            backgroundColor: '#dc3545'
        });
    }
}

function displayMovieVideos(videos) {
    try {
        if (!videos || !videos.length) {
            const videosContainer = document.getElementById('movie-videos');
            videosContainer.innerHTML = '<p>No videos available</p>';
            return;
        }
        const videosContainer = document.getElementById('movie-videos');
        videosContainer.innerHTML = '';
        const trailers = videos.filter(video => video.type === 'Trailer');
        trailers.reverse().forEach(video => {
            const videoElement = document.createElement('iframe');
            videoElement.src = `https://www.youtube.com/embed/${video.key}`;
            videoElement.width = "560";
            videoElement.height = "315";
            videoElement.style.borderRadius = "20px";
            videoElement.frameBorder = "0";
            videoElement.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
            videoElement.allowFullscreen = true;
            videosContainer.appendChild(videoElement);
        });
    } catch (error) {
        console.error('Error displaying movie videos:', error);
        showToast('Failed to display movie videos', {
            type: 'error',
            backgroundColor: '#dc3545'
        });
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    try {

        let selectedRating = 0;

        const urlParams = new URLSearchParams(window.location.search);
        const movieId = urlParams.get('id');
        if (movieId) {
            const movie = await fetchMovieDetails(movieId);
            displayMovieDetails(movie);

            const credits = await fetchMovieCredits(movieId);
            displayMovieCredits(credits);

            const similarMovies = await fetchSimilarMovies(movieId);
            displaySimilarMovies(similarMovies);

            const videos = await fetchMovieVideos(movieId);
            displayMovieVideos(videos);

            await loadExistingRating(movieId);

            const watchlistResponse = await fetch('../php/watchlist.php?action=get');
            const watchlistMovies = await watchlistResponse.json();
            const isInWatchlist = watchlistMovies.some(watchlistMovie => watchlistMovie.id === movie.id);

            const favoritesResponse = await fetch('../php/favorites.php?action=get');
            const favoriteMovies = await favoritesResponse.json();
            const isInFavorites = favoriteMovies.some(favoriteMovie => favoriteMovie.id === movie.id);

            if (isInWatchlist) {
                document.getElementById('add-to-watchlist-button').style.display = 'none';
                document.getElementById('remove-from-watchlist-button').style.display = 'flex';
            }

            if (isInFavorites) {
                document.getElementById('add-to-favorites-button').style.display = 'none';
                document.getElementById('remove-from-favorites-button').style.display = 'flex';
            }

            document.getElementById('add-to-watchlist-button').addEventListener('click', () => {
                addToWatchList(movie).catch(console.error);
            });

            document.getElementById('remove-from-watchlist-button').addEventListener('click', () => {
                removeFromWatchList(movie.id).catch(console.error);
            });

            document.getElementById('add-to-favorites-button').addEventListener('click', () => {
                addToFavorites(movie).catch(console.error);
            });

            document.getElementById('remove-from-favorites-button').addEventListener('click', () => {
                removeFromFavorites(movie.id).catch(console.error);
            });

            const rateMovieButton = document.getElementById('rate-movie-button');
            const rateMovieModal = document.getElementById('rate-movie-modal');
            const closeModal = document.querySelector('.close');

            rateMovieButton.addEventListener('click', () => {
                rateMovieModal.style.display = 'block';
                rateMovieModal.style.opacity = '1';
            });

            closeModal.addEventListener('click', () => {
                rateMovieModal.style.display = 'none';
                rateMovieModal.style.opacity = '0';
            });

            window.addEventListener('click', (event) => {
                if (event.target === rateMovieModal) {
                    rateMovieModal.style.display = 'none';
                    rateMovieModal.style.opacity = '0';
                }
            });
        }

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

        const rateMovieButton = document.getElementById('rate-movie-button');
        const rateMovieModal = document.getElementById('rate-movie-modal');
        const closeModal = document.querySelector('.close');
        const submitRatingButton = document.getElementById('submit-rating-button');

        rateMovieButton.addEventListener('click', () => {
            rateMovieModal.style.display = 'block';
        });

        closeModal.addEventListener('click', () => {
            rateMovieModal.style.display = 'none';
        });

        window.addEventListener('click', (event) => {
            if (event.target === rateMovieModal) {
                rateMovieModal.style.display = 'none';
            }
        });

        submitRatingButton.addEventListener('click', () => {
            if (selectedRating >= 1 && selectedRating <= 10) {
                const urlParams = new URLSearchParams(window.location.search);
                const movieId = urlParams.get('id');
                rateMovie(movieId, selectedRating);
                rateMovieModal.style.display = 'none';
            } else {
                alert('Please select a rating.');
            }
        });

        const stars = document.querySelectorAll('.star');
        stars.forEach((star) => {
            star.addEventListener('click', () => {
                selectedRating = parseInt(star.getAttribute('data-value'), 10);
                updateStarSelection(selectedRating);
            });

            star.addEventListener('mouseover', () => {
                const hoverValue = parseInt(star.getAttribute('data-value'), 10);
                updateStarSelection(hoverValue);
            });

            star.addEventListener('mouseout', () => {
                updateStarSelection(selectedRating);
            });
        });

        function updateStarSelection(rating) {
            stars.forEach((star) => {
                if (parseInt(star.getAttribute('data-value'), 10) <= rating) {
                    star.classList.add('selected');
                } else {
                    star.classList.remove('selected');
                }
            });
        }
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
        });

        if (document.getElementById('rated-movies')) {
            await showRatedMovies();
            const searchInput = document.querySelector('.section-search-input[data-section="rated"]');
            if (searchInput) {
                searchInput.addEventListener('input', () => {
                    const searchTerm = searchInput.value.toLowerCase();
                    let hasResults = false;

                    document.querySelectorAll('#rated-movies .movie').forEach(movieElement => {
                        const title = movieElement.querySelector('h3').textContent.toLowerCase();
                        const rating = movieElement.querySelector('.user-rating').textContent.toLowerCase();

                        const matches = title.includes(searchTerm) || rating.includes(searchTerm);
                        movieElement.style.display = matches ? 'block' : 'none';
                        if (matches) hasResults = true;
                    });

                    const noResultsDiv = document.querySelector('.no-results[data-for="rated"]');
                    if (noResultsDiv) {
                        noResultsDiv.style.display = !hasResults && searchTerm.length > 0 ? 'block' : 'none';
                    }
                });
            }
        }
    } catch (error) {
        console.error('Error initializing page:', error);
        showToast('Failed to load page content', {
            type: 'error',
            backgroundColor: '#dc3545'
        });
    }
});

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
