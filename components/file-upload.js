const audioElement = new Audio();
audioElement.crossOrigin = 'anonymous';

const fileInput = document.getElementById('audio-file-input');
const triggerIcon = document.getElementById('btn-select-file');
const fileNameInput = document.getElementById('file-name-input');

let currentObjectUrl = null;

function cleanupPreviousUrl() {
	if (currentObjectUrl) {
		URL.revokeObjectURL(currentObjectUrl);
		currentObjectUrl = null;
	}
}

function _handleUpload(e) {
	const file = e.target.files[0];
	if (!file) return;

	cleanupPreviousUrl();

	currentObjectUrl = URL.createObjectURL(file);
	audioElement.src = currentObjectUrl;
	fileNameInput.textContent = file.name;
}

export function initButtons() {
	triggerIcon.addEventListener('click', () => fileInput.click());
	fileInput.addEventListener('change', (e) => _handleUpload(e));
}