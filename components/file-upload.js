const audioElement = new Audio();
audioElement.crossOrigin = 'anonymous';

const fileInput = document.getElementById('audio-file-input');
const triggerIcon = document.getElementById('btn-select-file'); // Folder icon trigger
const fileNameInput = document.getElementById('file-name-input'); // Title display input

let currentObjectUrl = null;

function cleanupPreviousUrl() {
	if (currentObjectUrl) {
		URL.revokeObjectURL(currentObjectUrl);
		currentObjectUrl = null;
	}
}

triggerIcon.addEventListener('click', () => {
	fileInput.click();
});

fileInput.addEventListener('change', (e) => {
	const file = e.target.files[0];
	if (!file) return;

	cleanupPreviousUrl();

	currentObjectUrl = URL.createObjectURL(file);
	audioElement.src = currentObjectUrl;
	fileNameInput.textContent = file.name;

});