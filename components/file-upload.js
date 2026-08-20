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
	analyser.fftSize = 256;
	sourceNode = audioCtx.createMediaElementSource(audioElement);
	sourceNode.connect(analyser);
	analyser.connect(audioCtx.destination);
}

audioElement.addEventListener('play', () => updatePlaylistUI());
audioElement.addEventListener('pause', () => updatePlaylistUI());
audioElement.addEventListener('ended', async () => {
	updatePlaylistUI();

	if (uploadedFiles.length <= 1) return;

	const currentIndex = uploadedFiles.findIndex(t => t.id === currentTrackId);
	if (currentIndex === uploadedFiles.length - 1) await playTrack(uploadedFiles[0].id);
	else if (currentIndex !== -1 && currentIndex + 1 < uploadedFiles.length)
		await playTrack(uploadedFiles[currentIndex + 1].id);
});

export async function playTrack(trackId) {
	const track = uploadedFiles.find(t => t.id === trackId);
	if (!track) return;

	if (currentTrackId === trackId) {
		if (audioElement.paused) await audioElement.play();
		else audioElement.pause();
		return;
	}

	currentTrackId = track.id;
	audioElement.src = track.url;
	fileNameInput.textContent = track.name;
	fileNameInput.dataset.originalText = track.name;

	_checkAndStartMarquee();
	initAudioContext();
	updatePlaylistUI();

	if (audioCtx && audioCtx.state === 'suspended') await audioCtx.resume();

	await audioElement.play();
}

async function _handleUpload(e) {
	const file = e.target.files[0];
	if (!file) return;

	const existingIndex = uploadedFiles.findIndex(t => t.name === file.name && t.file?.size === file.size);

	if (existingIndex !== -1) {
		URL.revokeObjectURL(uploadedFiles[existingIndex].url);
		uploadedFiles.splice(existingIndex, 1);
	}

	const track = {
		id: `track_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
		name: file.name,
		url: URL.createObjectURL(file),
		file: file
	};

	uploadedFiles.push(track);
	fileInput.value = '';

	await playTrack(track.id);
}

function updatePlaylistUI() {
	if (!playlistContainer) return;

	playlistContainer.innerHTML = '';
	const mostRecentTrack = uploadedFiles[uploadedFiles.length - 1];
	const historyTracks = uploadedFiles
		.filter(track => !mostRecentTrack || track.id !== mostRecentTrack.id)
		.reverse();

	if (historyTracks.length === 0) {
		playlistContainer.innerHTML = `<div class="track flex-row space-between element">No previous tracks</div>`;
		return;
	}

	historyTracks.forEach((track) => {
		const isActive = track.id === currentTrackId;
		const isPlaying = isActive && !audioElement.paused && !audioElement.ended;
		const trackDiv = document.createElement('div');
		trackDiv.className = `track flex-row space-between element${isActive ? ' active' : ''}`;
		trackDiv.dataset.id = track.id;
		const textNode = document.createTextNode(track.name);
		trackDiv.appendChild(textNode);
		const iconSpan = document.createElement('span');
		iconSpan.textContent = isPlaying ? '▶' : 'II';
		trackDiv.appendChild(iconSpan);
		trackDiv.addEventListener('click', () => playTrack(track.id));
		playlistContainer.appendChild(trackDiv);
	});
}

function _checkAndStartMarquee() {
	const container = document.querySelector('.song-title');
	if (!container) return;

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
	fileInput.addEventListener('change', _handleUpload);
	updatePlaylistUI();
}

export function getAudioData() {
	if (!analyser) return new Uint8Array(0);

	const dataArray = new Uint8Array(analyser.frequencyBinCount);
	analyser.getByteFrequencyData(dataArray);
	return dataArray;
}

export { audioElement };