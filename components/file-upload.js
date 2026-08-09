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

	audioCtx = new (window.AudioContext || window.webkitAudioContext)();
	analyser = audioCtx.createAnalyser();
	analyser.fftSize = 256;
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

async function _handleUpload(e) {
	const file = e.target.files[0];
	if (!file) return;

	cleanupPreviousUrl();

	currentObjectUrl = URL.createObjectURL(file);
	audioElement.src = currentObjectUrl;
	fileNameInput.textContent = file.name;
	fileNameInput.dataset.originalText = file.name;

	_checkAndStartMarquee();
	initAudioContext();

	if (audioCtx && audioCtx.state === 'suspended') await audioCtx.resume();

	try {
		await audioElement.play();
	} catch (err) {
		console.warn("Autoplay blocked or playback interrupted:", err);
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

export { audioElement };