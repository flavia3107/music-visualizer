const audioElement = new Audio();
audioElement.crossOrigin = 'anonymous';

const fileInput = document.getElementById('audio-file-input');
const selectFileBtn = document.getElementById('btn-select-file');
const urlInput = document.getElementById('audio-url-input');
const loadUrlBtn = document.getElementById('btn-load-url');

let currentObjectUrl = null;

function cleanupPreviousUrl() {
	if (currentObjectUrl) {
		URL.revokeObjectURL(currentObjectUrl);
		currentObjectUrl = null;
	}
}

selectFileBtn.addEventListener('click', () => {
	fileInput.click();
});

fileInput.addEventListener('change', (e) => {
	const file = e.target.files[0];
	if (!file) return;

	cleanupPreviousUrl();

	currentObjectUrl = URL.createObjectURL(file);
	audioElement.src = currentObjectUrl;
	selectFileBtn.textContent = file.name;
	selectFileBtn.title = file.name;
});

loadUrlBtn.addEventListener('click', () => {
	const url = urlInput.value.trim();
	if (!url) return;

	cleanupPreviousUrl();

	audioElement.src = url;
	const urlFilename = url.split('/').pop().split('?')[0] || url;
	selectFileBtn.textContent = urlFilename;
	selectFileBtn.title = url;
});