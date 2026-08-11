/**
 * Initializes audio player controls using event delegation.
 * @param {HTMLAudioElement} audio - The audio DOM element to control.
 * @param {string|HTMLElement} [controlsContainer='.player-controls'] - Selector string or HTML element containing the control buttons.
 * @returns {Object} An object containing player state and cleanup handlers.
 */
export function initPlayerControls(audio, controlsContainer = '.player-controls') {
	const container = typeof controlsContainer === 'string'
		? document.querySelector(controlsContainer)
		: controlsContainer;

	if (!audio || !container) {
		console.warn('initPlayerControls: Missing audio element or controls container.');
		return;
	}

	let isShuffle = false;

	// Delegate click handling across all player buttons
	const handleClick = (e) => {
		const btn = e.target.closest('.action-btn');
		if (!btn) return;

		const icon = btn.querySelector('.material-symbols-outlined');
		if (!icon) return;

		const action = icon.textContent.trim();

		switch (action) {
			case 'pause':
			case 'play_arrow':
				if (window.audioCtx && window.audioCtx.state === 'suspended') {
					window.audioCtx.resume();
				}

				if (audio.paused) {
					audio.play();
				} else {
					audio.pause();
				}
				break;

			case 'fast_rewind':
				// Seek backward 5 seconds
				audio.currentTime = Math.max(0, audio.currentTime - 5);
				break;

			case 'fast_forward':
				// Seek forward 5 seconds
				audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 5);
				break;

			case 'shuffle':
				isShuffle = !isShuffle;
				btn.classList.toggle('active', isShuffle);
				break;

			case 'repeat':
				// Native HTMLMediaElement loop state toggle
				audio.loop = !audio.loop;
				btn.classList.toggle('active', audio.loop);
				break;
		}
	};

	// Synchronize button icon with actual audio playing state
	const handleStateChange = () => {
		const playBtn = Array.from(container.querySelectorAll('.action-btn')).find((btn) => {
			const text = btn.querySelector('.material-symbols-outlined')?.textContent.trim();
			return text === 'pause' || text === 'play_arrow';
		});

		if (playBtn) {
			const icon = playBtn.querySelector('.material-symbols-outlined');
			icon.textContent = audio.paused ? 'play_arrow' : 'pause';
		}
	};

	// Bind event listeners
	container.addEventListener('click', handleClick);
	audio.addEventListener('play', handleStateChange);
	audio.addEventListener('pause', handleStateChange);

	// Initial state check
	handleStateChange();

	// Return state inspection and cleanup method
	return {
		isShuffle: () => isShuffle,
		destroy: () => {
			container.removeEventListener('click', handleClick);
			audio.removeEventListener('play', handleStateChange);
			audio.removeEventListener('pause', handleStateChange);
		}
	};
}