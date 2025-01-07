document.addEventListener('DOMContentLoaded', async () => {
    const response = await fetch('../php/favorites.php?action=get');
    const favoriteMovies = await response.json();
    const favoritesContainer = document.getElementById('favorite-movies');
    favoritesContainer.innerHTML = '';
    if (favoriteMovies.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
            <h3>Your Favorites List is Empty</h3>
            <p>Add movies you love to your favorites list. Discover great films and keep track of the ones that move you!</p>
            <a href="../html/homepage.html" class="browse-button">Browse Movies</a>
        `;
        favoritesContainer.appendChild(emptyState);
        return;
    }
    favoriteMovies.forEach((movie, index) => {
        const movieElement = document.createElement('div');
        movieElement.classList.add('movie');
        movieElement.style.setProperty('--animation-order', index);
        movieElement.innerHTML = `
            <a href="../html/movie-details.html?id=${movie.id}">
                <img src="https://image.tmdb.org/t/p/original${movie.poster_path}" alt="${movie.title}">
                <div class="movie-info">
                    <h3>${movie.title}</h3>
                    <p class="release-date">Release Date: ${movie.release_date}</p>
                    <p class="rating">Rating: ${movie.vote_average.toFixed(1)}</p>
                </div>
            </a>
            <button class="remove-button" data-movie-id="${movie.id}">&times;</button>
            <div class="movie-metadata" style="display: none;">
                <span class="genres">${movie.genres ? movie.genres.map(g => g.name).join(', ') : ''}</span>
                <span class="actors">${movie.actors ? movie.actors.map(a => a.name).join(', ') : ''}</span>
                <span class="keywords">${movie.keywords ? movie.keywords.map(k => k.name).join(', ') : ''}</span>
            </div>
        `;
        favoritesContainer.appendChild(movieElement);
        const removeButton = movieElement.querySelector('.remove-button');
        removeButton.addEventListener('click', async (event) => {
            event.preventDefault();
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
                            movieElement.remove();
                            showToast('Movie removed from favorites', {
                                backgroundColor: '#4CAF50',
                                duration: 3000
                            });
                            if (document.querySelectorAll('#favorite-movies .movie').length === 0) {
                                const emptyState = document.createElement('div');
                                emptyState.className = 'empty-state';
                                emptyState.innerHTML = `
                                    <h3>Your Favorites List is Empty</h3>
                                    <p>Add movies you love to your favorites list. Discover great films and keep track of the ones that move you!</p>
                                    <a href="../html/homepage.html" class="browse-button">Browse Movies</a>
                                `;
                                document.getElementById('favorite-movies').appendChild(emptyState);
                            }
                        }
                    },
                    {
                        text: 'Cancel',
                        onClick: () => { }
                    }
                ]
            });
        });
    });
    $('#favorite-movies').after('<div class="no-results" style="display:none;">No movies found matching your search.</div>');
    function debounce(func, wait) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }
    const debouncedSearch = debounce(function (searchTerm) {
        let hasResults = false;
        $('#favorite-movies .movie').each(function () {
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
        if (!hasResults && searchTerm.length > 0) {
            $('.no-results').fadeIn(300);
        } else {
            $('.no-results').fadeOut(300);
        }
    }, 300);
    $('.section-search-wrapper .search-input').on('input', function () {
        const searchTerm = $(this).val().toLowerCase();
        debouncedSearch(searchTerm);
    });
});
async function removeFromFavorites(movieId) {
    try {
        const response = await fetch('../php/favorites.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'remove', movieId })
        });
        const result = await response.json();
    } catch (error) {
        console.error('Error removing from favorites:', error);
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
        onClick: options.onClick || function () { }
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
});