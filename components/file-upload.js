// Central HTML5 Audio Element (shared with your controller section)
const audioElement = new Audio();
audioElement.crossOrigin = 'anonymous';

// DOM Elements
const fileInput = document.getElementById('audio-file-input');
const selectFileBtn = document.getElementById('btn-select-file');
const fileNameDisplay = document.getElementById('file-name-display');
const urlInput = document.getElementById('audio-url-input');
const loadUrlBtn = document.getElementById('btn-load-url');

let currentObjectUrl = null;

// Helper to revoke old object URLs to prevent browser memory leaks
function cleanupPreviousUrl() {
	if (currentObjectUrl) {
		URL.revokeObjectURL(currentObjectUrl);
		currentObjectUrl = null;
	}
}

// Handle local file selection
selectFileBtn.addEventListener('click', () => {
	fileInput.click();
});

fileInput.addEventListener('change', (e) => {
	const file = e.target.files[0];
	if (!file) return;

	cleanupPreviousUrl();

	currentObjectUrl = URL.createObjectURL(file);
	audioElement.src = currentObjectUrl;

	// Display the local file name in the UI
	fileNameDisplay.textContent = file.name;
	fileNameDisplay.title = file.name; // Shows full name on hover if truncated

	console.log('Local file loaded:', file.name);
});

// Handle remote URL loading
loadUrlBtn.addEventListener('click', () => {
	const url = urlInput.value.trim();
	if (!url) return;

	cleanupPreviousUrl();

	audioElement.src = url;

	// Extract filename from URL or fallback to the URL string
	const urlFilename = url.split('/').pop().split('?')[0] || url;
	fileNameDisplay.textContent = urlFilename;
	fileNameDisplay.title = url;

	console.log('URL source set:', url);
});