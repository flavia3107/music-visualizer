document.addEventListener('DOMContentLoaded', () => {
	const audio = document.getElementById('audio-player');
	const controls = document.querySelector('.player-controls');

	if (!audio || !controls) return;

	// Track player states
	let isShuffle = false;
	let isRepeat = false;

	// Single event delegation listener for all controls
	controls.addEventListener('click', (e) => {
		const btn = e.target.closest('.action-btn');
		if (!btn) return;

		const icon = btn.querySelector('.material-symbols-outlined');
		if (!icon) return;

		const action = icon.textContent.trim();

		switch (action) {
			case 'pause':
			case 'play_arrow':
				togglePlayPause(audio, icon);
				break;

			case 'fast_rewind':
				// Rewind 5 seconds
				audio.currentTime = Math.max(0, audio.currentTime - 5);
				break;

			case 'fast_forward':
				// Skip ahead 5 seconds
				audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 5);
				break;

			case 'shuffle':
				isShuffle = !isShuffle;
				btn.classList.toggle('active', isShuffle);
				// Add your track list shuffle logic here
				break;

			case 'repeat':
				isRepeat = !isRepeat;
				audio.loop = isRepeat;
				btn.classList.toggle('active', isRepeat);
				break;
		}
	});

	// Keep icon in sync if audio is paused/played externally (e.g., via visualizer or spacebar)
	audio.addEventListener('play', () => updatePlayIcon(controls, true));
	audio.addEventListener('pause', () => updatePlayIcon(controls, false));
});

function togglePlayPause(audio, iconElement) {
	if (audio.paused) {
		audio.play();
	} else {
		audio.pause();
	}
}

function updatePlayIcon(controlsContainer, isPlaying) {
	// Find the button that handles play/pause (contains either 'pause' or 'play_arrow')
	const playBtn = Array.from(controlsContainer.querySelectorAll('.action-btn'))
		.find(btn => {
			const text = btn.querySelector('.material-symbols-outlined')?.textContent.trim();
			return text === 'pause' || text === 'play_arrow';
		});

	if (playBtn) {
		const icon = playBtn.querySelector('.material-symbols-outlined');
		icon.textContent = isPlaying ? 'pause' : 'play_arrow';
	}
}