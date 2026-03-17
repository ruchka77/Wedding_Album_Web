// --- 1. CONFIGURATION & STATE ---
const imagesPerPage = 20;
let currentCategory = 'prep'; 
let currentIndex = 0; 
let imageDatabase = {}; // This will be populated by data.json

const loader = document.getElementById('loader');

// --- 2. CORE LOGIC ---
function buildImageUrl(fileId) {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w2500`;
}

function loadImages() {
    const container = document.getElementById(currentCategory);
    const imagesArray = imageDatabase[currentCategory] || [];
    const nextBatch = imagesArray.slice(currentIndex, currentIndex + imagesPerPage);
    
    if (nextBatch.length > 0) {
        // Keep the tripwire active and visible while we are loading
        loader.style.display = 'block'; 
        
        nextBatch.forEach(fileId => {
            const img = document.createElement('img');
            img.src = buildImageUrl(fileId);
            img.loading = "lazy"; 
            
            img.onload = () => img.classList.add('loaded');
            container.appendChild(img);
        });

        currentIndex += nextBatch.length;
    }

    // THE FIX: Only hide the tripwire if we have reached the very end of the array
    if (currentIndex >= imagesArray.length) {
        loader.style.display = 'none'; 
    }
}

// --- 3. INFINITE SCROLL ---
const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
        loadImages();
    }
}, { rootMargin: "100px" }); 

// --- 4. TAB SWITCHING LOGIC ---
const tabButtons = document.querySelectorAll('.tab-btn');

tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Remove active class from all buttons and ALL tab-panes
        tabButtons.forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));

        // Make the clicked button and its target pane active
        button.classList.add('active');
        currentCategory = button.getAttribute('data-target');
        document.getElementById(currentCategory).classList.add('active');

        // SPECIAL LOGIC: If it is the movie, do NOT clear it and do NOT load images
        if (currentCategory === 'themovie') {
            loader.style.display = 'none'; // Hide the "Loading more memories..." text
            observer.disconnect(); // Stop looking for the end of the page
        } else {
            // Standard photo loading logic
            currentIndex = 0;
            document.getElementById(currentCategory).innerHTML = ''; 
            observer.observe(loader);
            loadImages();
        }
    });
});

// --- 5. DATA FETCHING & INITIALIZATION ---

// New function to handle the iframe injection
function loadMovie(videoId) {
    const movieContainer = document.getElementById('themovie');
    
    // Check if the div exists and we have an ID
    if (movieContainer && videoId) {
        const iframe = document.createElement('iframe');
        iframe.src = `https://drive.google.com/file/d/${videoId}/preview`;
        iframe.width = "100%";
        iframe.height = "480";
        iframe.allow = "autoplay";
        iframe.frameBorder = "0"; // Note: camelCase in JS for frameBorder
        iframe.allowFullscreen = true;
        
        movieContainer.innerHTML = ''; // Clear anything currently in there
        movieContainer.appendChild(iframe);
    }
}

async function initializeGallery() {
    try {
        const response = await fetch('data.json');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        imageDatabase = await response.json();
        
        // --- NEW: Inject the video if the ID exists in your JSON ---
        if (imageDatabase.highlightMovie) {
            loadMovie(imageDatabase.highlightMovie);
        }
        
        // Now that data is loaded, start the gallery
        observer.observe(loader);
        loadImages();

    } catch (error) {
        console.error("Could not load the image data:", error);
        loader.textContent = "Error loading images. Please try again later.";
        loader.style.display = 'block';
    }
}

// Start the app
initializeGallery();