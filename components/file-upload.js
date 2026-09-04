const audioElement = new Audio();
audioElement.crossOrigin = 'anonymous';

const fileInput = document.getElementById('audio-file-input');
const triggerIcon = document.getElementById('btn-select-file');
const fileNameInput = document.getElementById('file-name-input');
const playlistContainer = document.querySelector('.playlist.panel');
const uploadedFiles = [];
let currentTrackId = null;
let audioCtx = null;
let analyser = null;
let sourceNode = null;

function initAudioContext() {
	if (audioCtx) return;
	audioCtx = new (window.AudioContext || window.webkitAudioContext)();
	analyser = audioCtx.createAnalyser();
	analyser.fftSize = 256
	sourceNode = audioCtx.createMediaElementSource(audioElement);
	sourceNode.connect(analyser);
	analyser.connect(audioCtx.destination);
}

audioElement.addEventListener('play', updatePlaylistUI);
audioElement.addEventListener('pause', updatePlaylistUI);
audioElement.addEventListener('ended', async () => {
	updatePlaylistUI();
	if (uploadedFiles.length <= 1) return;

	const currentIndex = uploadedFiles.findIndex(t => t.id === currentTrackId);
	if (currentIndex !== -1) {
		const nextTrack = uploadedFiles[(currentIndex + 1) % uploadedFiles.length];
		await playTrack(nextTrack.id);
	}
});

function getCurrentTrackId() {
	return currentTrackId;
}

async function playTrack(trackId) {
	const track = uploadedFiles.find(t => t.id === trackId);
	if (!track) return;

	if (currentTrackId === trackId) {
		audioElement.paused ? await audioElement.play() : audioElement.pause();
		return;
	}

	currentTrackId = track.id;
	audioElement.src = track.url;
	fileNameInput.textContent = track.name;
	fileNameInput.dataset.originalText = track.name;

	_checkAndStartMarquee();
	initAudioContext();
	updatePlaylistUI();

	if (audioCtx?.state === 'suspended') await audioCtx.resume();
	await audioElement.play();
}

async function _handleUpload(e) {
	const [file] = e.target.files;
	if (!file) return;

	const existingIndex = uploadedFiles.findIndex(t => t.name === file.name && t.file?.size === file.size);
	if (existingIndex !== -1) {
		URL.revokeObjectURL(uploadedFiles[existingIndex].url);
		uploadedFiles.splice(existingIndex, 1);
	}

	const track = {
		id: `track_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
		name: file.name,
		url: URL.createObjectURL(file),
		file
	};

	uploadedFiles.push(track);
	fileInput.value = '';

	await playTrack(track.id);
}

function updatePlaylistUI() {
	if (!playlistContainer) return;

	const historyTracks = uploadedFiles.slice(0, -1).reverse();

	if (!historyTracks.length) {
		playlistContainer.classList.add('flex-row', 'center', 'middle');
		playlistContainer.innerHTML = `<div class="empty-placeholder">No previous tracks</div>`;
		return;
	}

	playlistContainer.innerHTML = '';
	playlistContainer.classList.remove('flex-row', 'center', 'middle');
	historyTracks.forEach(track => {
		const isActive = track.id === currentTrackId;
		const isPlaying = isActive && !audioElement.paused && !audioElement.ended;
		const trackDiv = document.createElement('div');
		trackDiv.className = `track flex-row space-between element${isActive ? ' active' : ''}`;
		trackDiv.dataset.id = track.id;
		trackDiv.innerHTML = `<span>${track.name}</span><span>${isPlaying ? '▶' : 'II'}</span>`;
		trackDiv.addEventListener('click', () => playTrack(track.id));
		playlistContainer.appendChild(trackDiv);
	});
}

function _checkAndStartMarquee() {
	const container = document.querySelector('.song-title');
	if (!container) return;

	const text = fileNameInput.dataset.originalText || fileNameInput.textContent;
	fileNameInput.textContent = text;
	fileNameInput.classList.remove('animate-marquee');

	if (fileNameInput.scrollWidth > container.clientWidth) {
		fileNameInput.textContent = `${text} \u00A0\u00A0\u00A0\u00A0 ${text} \u00A0\u00A0\u00A0\u00A0`;
		fileNameInput.classList.add('animate-marquee');
	}
}

function initButtons() {
	triggerIcon.addEventListener('click', () => fileInput.click());
	fileInput.addEventListener('change', _handleUpload);
	updatePlaylistUI();
}

function getAudioData() {
	if (!analyser) return new Uint8Array(0);
	const dataArray = new Uint8Array(analyser.frequencyBinCount);
	analyser.getByteFrequencyData(dataArray);
	return dataArray;
}

export {
	audioElement,
	uploadedFiles,
	getCurrentTrackId,
	playTrack,
	initButtons,
	getAudioData
};