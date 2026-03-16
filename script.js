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
        tabButtons.forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.gallery-grid').forEach(grid => grid.classList.remove('active'));

        button.classList.add('active');

        currentCategory = button.getAttribute('data-target');
        document.getElementById(currentCategory).classList.add('active');

        currentIndex = 0;
        document.getElementById(currentCategory).innerHTML = ''; 
        
        observer.observe(loader);
        loadImages();
    });
});

// --- 5. DATA FETCHING & INITIALIZATION ---
// This is the new part: Fetch the JSON file before doing anything else
async function initializeGallery() {
    try {
        const response = await fetch('data.json');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        imageDatabase = await response.json();
        
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