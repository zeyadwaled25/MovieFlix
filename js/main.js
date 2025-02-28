const API_KEY = "56c8c008043f25732b707cc9cae710d1";
const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/original";

let currentSlide = { trending: 0, movie: 0, tv: 0 };
let sectionMovies = { trending: [], movie: [], tv: [] };
let searchTimeout;
let currentContentType = "trending";

// Content title
function updateContentTitle(
  type = currentContentType,
  isSearch = false,
  searchQuery = ""
) {
  const titleElements = document.querySelectorAll(".content-type-title");
  titleElements.forEach((title) => {
    const section = title.closest(".section-container");
    if (section) {
      const sectionType = section.dataset.type;
      switch (sectionType) {
        case "trending":
          title.textContent = "Trending Now";
          break;
        case "movie":
          title.textContent = "Popular Movies";
          break;
        case "tv":
          title.textContent = "Popular TV Shows";
          break;
      }
    }
  });

  if (isSearch) {
    const heroTitle = document.querySelector(".hero-section-title");
    if (heroTitle) {
      heroTitle.textContent = `Search Results for "${searchQuery}"`;
    }
  }
}

// Initialization
async function initializeSections() {
  try {
    showLoadingSpinner(true);
    const [trending, movies, tvShows] = await Promise.all([
      fetchContent("trending"),
      fetchContent("movie"),
      fetchContent("tv"),
    ]);

    sectionMovies.trending = trending;
    sectionMovies.movie = movies;
    sectionMovies.tv = tvShows;

    updateCarouselContent(".trending-slider .d-flex", trending, "trending");
    updateCarouselContent(".movies-slider .d-flex", movies, "movie"); // هنا نستخدم movies-slider
    updateCarouselContent(".tv-slider .d-flex", tvShows, "tv");

    if (trending.length > 0) {
      updateHeroSection(trending[0]);
    }

    updateContentTitle();
    setupSliderControls();
    showLoadingSpinner(false);
  } catch (error) {
    showLoadingSpinner(false);
    showError("Failed to load content. Please try again later.");
  }
}

// Fetch API
async function fetchContent(type = "trending") {
  try {
    let endpoint;
    switch (type) {
      case "trending":
        endpoint = `/trending/movie/week?api_key=${API_KEY}`;
        break;
      case "movie":
        endpoint = `/movie/popular?api_key=${API_KEY}`;
        break;
      case "tv":
        endpoint = `/tv/popular?api_key=${API_KEY}`;
        break;
      default:
        endpoint = `/trending/movie/week?api_key=${API_KEY}`;
    }

    const response = await fetch(`${BASE_URL}${endpoint}`);
    if (!response.ok) throw new Error("Network response was not ok");
    const data = await response.json();
    return data.results;
  } catch (error) {
    return [];
  }
}

async function searchMovies(query) {
  try {
    const response = await fetch(
      `${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(
        query
      )}`
    );
    if (!response.ok) throw new Error("Network response was not ok");
    const data = await response.json();
    return data.results.filter((item) => item.media_type !== "person");
  } catch (error) {
    return [];
  }
}

async function getGenres() {
  try {
    const [movieGenres, tvGenres] = await Promise.all([
      fetch(`${BASE_URL}/genre/movie/list?api_key=${API_KEY}`).then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      }),
      fetch(`${BASE_URL}/genre/tv/list?api_key=${API_KEY}`).then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      }),
    ]);
    return [...movieGenres.genres, ...tvGenres.genres];
  } catch (error) {
    return [];
  }
}

async function getTrailer(contentId) {
  try {
    const response = await fetch(
      `${BASE_URL}/movie/${contentId}/videos?api_key=${API_KEY}`
    );
    if (!response.ok) throw new Error("Network response was not ok");
    const data = await response.json();
    const trailer = data.results.find((video) => video.type === "Trailer");
    return trailer ? trailer.key : null;
  } catch (error) {
    return null;
  }
}

// UI Update Functions
async function updateHeroSection(content) {
  const heroSection = document.querySelector(".hero-section");
  const title = document.querySelector(".hero-title");
  const description = document.querySelector(".movie-description");
  const rating = document.querySelector(".movie-rating");
  const genreElement = document.querySelector(".movie-genre");
  const starsContainer = document.querySelector(".stars-container");

  if (content) {
    const genres = await getGenres();
    const contentGenres = content.genre_ids
      .map((id) => genres.find((g) => g.id === id)?.name)
      .filter(Boolean)
      .join(" • ");

    title.textContent = content.title || content.name;
    description.textContent = content.overview
      ? content.overview.length > 200
        ? content.overview.slice(0, 200) + "..."
        : content.overview
      : "No description available";
    rating.textContent = content.vote_average.toFixed(1);
    genreElement.textContent =
      contentGenres || "Genre information not available";
    heroSection.dataset.movieId = content.id;

    if (content.backdrop_path) {
      const newImage = new Image();
      newImage.src = `${IMAGE_BASE_URL}${content.backdrop_path}`;
      newImage.onload = () => {
        heroSection.style.backgroundImage = `url(${newImage.src})`;
      };
    }

    updateStarRating(content.vote_average, starsContainer);
  }
}

function updateCarouselContent(selector, items, type) {
  const carousel = document.querySelector(selector);
  if (!carousel) return;

  carousel.innerHTML = "";
  items.forEach((item) => {
    if (item.poster_path) {
      carousel.innerHTML += `
        <div class="movie-card" data-movie-id="${item.id}" data-type="${type}">
            <img src="${IMAGE_BASE_URL}${item.poster_path}" 
                  class="img-fluid rounded" 
                  alt="${item.title || item.name}"
                  loading="lazy">
            <div class="movie-card-overlay">
                <h5 class="movie-card-title">${item.title || item.name}</h5>
                <p class="movie-card-rating">⭐ ${item.vote_average.toFixed(1)} 
                    <span class="text-secondary">(${item.vote_count})</span></p>
            </div>
        </div>
      `;
    }
  });

  updateSliderVisibility(type);
}

function updateStarRating(rating, container) {
  const starCount = Math.round(rating / 2);
  container.innerHTML = Array(5)
    .fill()
    .map(
      (_, i) =>
        `<i class="fas fa-star ${
          i < starCount ? "text-warning" : "text-secondary"
        }"></i>`
    )
    .join("");
}

function showTrailer(trailerKey) {
  const modal = new bootstrap.Modal(document.getElementById("trailerModal"));
  const iframe = document.querySelector("#trailerModal iframe");
  iframe.src = `https://www.youtube.com/embed/${trailerKey}`;
  modal.show();

  document
    .getElementById("trailerModal")
    .addEventListener("hidden.bs.modal", () => {
      iframe.src = "";
    });
}

function showSearchSuggestions(results) {
  const container = document.querySelector(".suggestions-container");
  const suggestionsDiv = document.querySelector(".search-suggestions");
  container.innerHTML = "";

  if (results.length === 0) {
    container.innerHTML = '<div class="p-3 text-center">No results found</div>';
    suggestionsDiv.style.display = "block";
    return;
  }

  results.forEach((movie) => {
    if (movie.title || movie.name) {
      container.innerHTML += `
        <div class="suggestion-item" data-movie-id="${movie.id}">
            <img src="${
              movie.poster_path
                ? IMAGE_BASE_URL + movie.poster_path
                : "images/placeholder.jpg"
            }" 
                  class="suggestion-poster" 
                  alt="${movie.title || movie.name}"
                  loading="lazy">
            <div class="suggestion-info">
                <h6>${movie.title || movie.name}</h6>
                <small>Voted by ${movie.vote_count}</small>
            </div>
        </div>
      `;
    }
  });
  suggestionsDiv.style.display = "block";
}

// Slider Functions
function updateSliderVisibility(type) {
  const sliderClass = type === "movie" ? "movies-slider" : `${type}-slider`;
  const section = document
    .querySelector(`.${sliderClass}`)
    .closest(".section-container");
  const prevBtn = section.querySelector(".prev-btn");
  const nextBtn = section.querySelector(".next-btn");
  const movies = sectionMovies[type];

  prevBtn.style.display = currentSlide[type] === 0 ? "none" : "flex";
  nextBtn.style.display =
    currentSlide[type] >= Math.floor(movies.length / 5) - 1 ? "none" : "flex";
}

function updateSliderPosition(type) {
  const sliderClass = type === "movie" ? "movies-slider" : `${type}-slider`;
  const slider = document.querySelector(`.${sliderClass} .d-flex`);
  const offset = currentSlide[type] * -100;
  slider.style.transition = "1s";
  slider.style.transform = `translateX(${offset}%)`;
  updateSliderVisibility(type);
}

function setupSliderControls() {
  ["trending", "movie", "tv"].forEach((type) => {
    const sliderClass = type === "movie" ? "movies-slider" : `${type}-slider`;
    const section = document
      .querySelector(`.${sliderClass}`)
      .closest(".section-container");

    section.querySelector(".next-btn")?.addEventListener("click", () => {
      if (currentSlide[type] < Math.floor(sectionMovies[type].length / 5) - 1) {
        currentSlide[type]++;
        updateSliderPosition(type);
      }
    });

    section.querySelector(".prev-btn")?.addEventListener("click", () => {
      if (currentSlide[type] > 0) {
        currentSlide[type]--;
        updateSliderPosition(type);
      }
    });
  });
}

function showLoadingSpinner(show) {
  const spinner = document.querySelector(".loading-spinner");
  if (spinner) {
    spinner.style.display = show ? "flex" : "none";
  }
}

function showError(message) {
  const existingAlerts = document.querySelectorAll(".alert");
  existingAlerts.forEach((alert) => alert.remove());

  const errorAlert = document.createElement("div");
  errorAlert.className = "alert alert-danger alert-dismissible fade show";
  errorAlert.style.position = "fixed";
  errorAlert.style.left = "10px";
  errorAlert.style.top = "75px";
  errorAlert.style.zIndex = "1050";
  errorAlert.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  document.querySelector("body").prepend(errorAlert);
}

function showSuccess(message) {
  const existingAlerts = document.querySelectorAll(".alert");
  existingAlerts.forEach((alert) => alert.remove());

  const successAlert = document.createElement("div");
  successAlert.className = "alert alert-success alert-dismissible fade show";
  successAlert.style.position = "fixed";
  successAlert.style.left = "10px";
  successAlert.style.top = "75px";
  successAlert.style.zIndex = "1050";
  successAlert.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  document.querySelector("body").prepend(successAlert);

  setTimeout(() => {
    successAlert.remove();
  }, 3000);
}
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Event Listeners
document.addEventListener("DOMContentLoaded", async () => {
  // Check authentication
  if (!localStorage.getItem('currentUser')) {
    window.location.href = 'login.html';
    return;
  }

  // Add user welcome and logout button to navbar
  const navbarNav = document.querySelector('#navbarNav');
  if (navbarNav) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const authDiv = document.createElement('div');
    authDiv.className = 'd-flex align-items-center me-3';
    authDiv.innerHTML = `
      <span class="text-light mb-2 mb-lg-0">Welcome, ${currentUser.name}</span>
    `;
    navbarNav.insertBefore(authDiv, navbarNav.querySelector('form'));

    // Add logout functionality
    document.getElementById('logoutBtn').addEventListener('click', () => {
      localStorage.removeItem('currentUser');
      window.location.href = 'login.html';
    });
  }

  // Continue with existing initialization
  await initializeSections();

  document.querySelectorAll(".nav-link[data-type]").forEach((link) => {
    link.addEventListener("click", async (e) => {
      e.preventDefault();
      const type = e.target.dataset.type;
      currentContentType = type;
      const content = sectionMovies[type];
      if (content.length > 0) {
        updateHeroSection(content[0]);
        updateContentTitle(type);
      }
    });
  });

  // Search functionality
  const searchForm = document.querySelector("form");
  const searchInput = searchForm.querySelector("input");
  const suggestionsDiv = document.querySelector(".search-suggestions");

  searchInput.addEventListener("input", async (e) => {
    clearTimeout(searchTimeout);
    const query = e.target.value.trim();

    if (query.length < 2) {
      suggestionsDiv.style.display = "none";
      return;
    }

    searchTimeout = setTimeout(async () => {
      const results = await searchMovies(query);
      showSearchSuggestions(results.slice(0, 5));
    }, 300);
  });

  // Search suggestions
  document
    .querySelector(".suggestions-container")
    .addEventListener("click", async (e) => {
      const suggestionItem = e.target.closest(".suggestion-item");
      if (suggestionItem) {
        const movieId = suggestionItem.dataset.movieId;
        const results = await searchMovies(searchInput.value.trim());
        const selectedMovie = results.find((m) => m.id.toString() === movieId);

        if (selectedMovie) {
          await updateHeroSection(selectedMovie);
          updateContentTitle("", true, searchInput.value.trim());
        }

        suggestionsDiv.style.display = "none";
        searchInput.value = "";
      }
    });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".search-suggestions") && !e.target.closest("form")) {
      suggestionsDiv.style.display = "none";
    }
  });

  searchForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const query = searchInput.value.trim();

    if (query) {
      const results = await searchMovies(query);
      if (results.length > 0) {
        await updateHeroSection(results[0]);
        updateContentTitle("", true, query);
        suggestionsDiv.style.display = "none";
      } else {
        showError("No results found");
      }
    }
  });

  // Traile
  document.querySelector(".trailer-btn").addEventListener("click", async () => {
    const movieId = document.querySelector(".hero-section").dataset.movieId;
    const trailerKey = await getTrailer(movieId);
    if (trailerKey) {
      showTrailer(trailerKey);
    } else {
      showError("Trailer not available");
    }
  });

  // Movie card clicks
  document.querySelectorAll(".movie-slider").forEach((slider) => {
    slider.addEventListener("click", async (e) => {
      const movieCard = e.target.closest(".movie-card");
      if (movieCard) {
        const movieId = movieCard.dataset.movieId;
        const type = movieCard.dataset.type;
        const clickedMovie = sectionMovies[type].find(
          (m) => m.id.toString() === movieId
        );
        if (clickedMovie) {
          await updateHeroSection(clickedMovie);
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  });

  // Newsletter subscription
  const newsletterForm = document.querySelector(".newsletter-form");
  if (newsletterForm) {
    newsletterForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const emailInput = newsletterForm.querySelector('input[type="email"]');
      const email = emailInput.value.trim();

      if (!email) {
        showError("Please enter your email address");
        return;
      }
      if (!isValidEmail(email)) {
        showError("Please enter a valid email address");
        return;
      }

      showSuccess("Thank you for subscribing to our newsletter!");
      newsletterForm.reset();
    });
  }

  // Contact form
  const contactForm = document.querySelector("#contactForm");
  if (contactForm) {
    contactForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const formData = {
        name: contactForm.querySelector("#name").value.trim(),
        email: contactForm.querySelector("#email").value.trim(),
        subject: contactForm.querySelector("#subject").value.trim(),
        message: contactForm.querySelector("#message").value.trim(),
      };

      // Validation
      for (const [key, value] of Object.entries(formData)) {
        if (!value) {
          showError(`Please enter your ${key}`);
          return;
        }
      }
      if (!isValidEmail(formData.email)) {
        showError("Please enter a valid email address");
        return;
      }
      try {
        showSuccess(
          "Thank you for your message! We will get back to you soon."
        );
        contactForm.reset();
      } catch (error) {
        showError("Failed to send message. Please try again later.");
      }
    });
  }

  // Handle Navbar Toggler
  const menuToggle = document.querySelector(".navbar-toggler");
  const navMenu = document.querySelector(".navbar-collapse");

  if (menuToggle && navMenu) {
    menuToggle.addEventListener("click", () => {
      e.stopPropagation();
      navMenu.classList.toggle("show");
    });

    document.addEventListener("click", (e) => {
      if (!navMenu.contains(e.target) && !menuToggle.contains(e.target)) {
        navMenu.classList.remove("show");
      }
    });
  }

  // Success message
  function showSuccess(message) {
    const successAlert = document.createElement("div");
    successAlert.className = "alert alert-success alert-dismissible fade show";
    successAlert.style.position = "fixed";
    successAlert.style.left = "10px";
    successAlert.style.top = "75px";
    successAlert.style.zIndex = "1050";
    successAlert.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.querySelector(".container").prepend(successAlert);

    setTimeout(() => {
      successAlert.remove();
    }, 3000);
  }
});