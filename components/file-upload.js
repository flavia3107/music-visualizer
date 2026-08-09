const audioElement = new Audio();
audioElement.crossOrigin = 'anonymous';

const fileInput = document.getElementById('audio-file-input');
const triggerIcon = document.getElementById('btn-select-file');
const fileNameInput = document.getElementById('file-name-input');

let currentObjectUrl = null;
let audioCtx = null;
let analyser = null;
let sourceNode = null;

function initAudioContext() {
	if (audioCtx) return;

	// 1. Create AudioContext
	audioCtx = new (window.AudioContext || window.webkitAudioContext)();

	// 2. Create AnalyserNode for your visualizer
	analyser = audioCtx.createAnalyser();
	analyser.fftSize = 256; // Adjust frequency resolution (e.g., 64, 128, 256, 512)

	// 3. Connect audioElement -> analyser -> speakers
	sourceNode = audioCtx.createMediaElementSource(audioElement);
	sourceNode.connect(analyser);
	analyser.connect(audioCtx.destination);
}

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

	// Setup Web Audio nodes on first upload
	initAudioContext();

	// Resume AudioContext if suspended by browser autoplay policy
	if (audioCtx && audioCtx.state === 'suspended') {
		audioCtx.resume();
	}
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

export function getAudioData() {
	if (!analyser) return new Uint8Array(0);

	const dataArray = new Uint8Array(analyser.frequencyBinCount);
	analyser.getByteFrequencyData(dataArray);
	return dataArray;
}