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
	fileNameInput.dataset.originalText = file.name;

	_checkAndStartMarquee();
}

function _checkAndStartMarquee() {
	const container = document.querySelector('.song-title');
	const originalText = fileNameInput.dataset.originalText || fileNameInput.textContent;
	fileNameInput.textContent = originalText;
	fileNameInput.classList.remove('animate-marquee');

	if (fileNameInput.scrollWidth > container.clientWidth) {
		fileNameInput.textContent = `${originalText} \u00A0\u00A0\u00A0\u00A0 ${originalText} \u00A0\u00A0\u00A0\u00A0`;
		fileNameInput.classList.add('animate-marquee');
	}
}


export function initButtons() {
	triggerIcon.addEventListener('click', () => fileInput.click());
	fileInput.addEventListener('change', (e) => _handleUpload(e));
}