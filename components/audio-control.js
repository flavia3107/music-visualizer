export function initPlayerControls(audio, controlsContainer = '.player-controls') {
	const container = typeof controlsContainer === 'string'
		? document.querySelector(controlsContainer)
		: controlsContainer;

	if (!audio || !container) {
		console.warn('initPlayerControls: Missing audio element or controls container.');
		return;
	}

	// Find progress element related to this controls section
	const progressContainer = container.previousElementSibling?.classList.contains('progress')
		? container.previousElementSibling
		: document.querySelector('.progress');

	const scrubber = progressContainer?.querySelector('.scrubber');
	const timeSpans = progressContainer?.querySelectorAll('.time');
	const currentTimeSpan = timeSpans?.[0];
	const durationTimeSpan = timeSpans?.[1];

	let isShuffle = false;
	let isSeeking = false;

	// Helper to convert seconds into MM:SS format
	const formatTime = (seconds) => {
		if (isNaN(seconds) || seconds === Infinity) return '00:00';
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
	};

	// Update scrubber position and time labels
	const updateProgress = () => {
		const current = audio.currentTime || 0;
		const duration = audio.duration || 0;

		if (currentTimeSpan) {
			currentTimeSpan.textContent = formatTime(current);
		}
		if (durationTimeSpan) {
			durationTimeSpan.textContent = formatTime(duration);
		}
		if (scrubber && !isSeeking) {
			scrubber.max = duration || 100;
			scrubber.value = current;
		}
	};

	// Handle scrubber interactions
	const handleScrubberInput = () => {
		isSeeking = true;
		if (currentTimeSpan) {
			currentTimeSpan.textContent = formatTime(scrubber.value);
		}
	};

	const handleScrubberChange = () => {
		audio.currentTime = parseFloat(scrubber.value);
		isSeeking = false;
	};

	const handleClick = (e) => {
		const btn = e.target.closest('.action-btn');
		if (!btn) return;

		const icon = btn.querySelector('.material-symbols-outlined');
		if (!icon) return;

		const action = icon.textContent.trim();

		switch (action) {
			case 'pause':
			case 'play_arrow':
				if (window.audioCtx && window.audioCtx.state === 'suspended') window.audioCtx.resume();

				if (audio.paused) audio.play();
				else audio.pause();
				break;

			case 'fast_rewind':
				audio.currentTime = Math.max(0, audio.currentTime - 5);
				break;

			case 'fast_forward':
				audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 5);
				break;

			case 'shuffle':
				isShuffle = !isShuffle;
				btn.classList.toggle('active', isShuffle);
				break;

			case 'repeat':
				audio.loop = !audio.loop;
				btn.classList.toggle('active', audio.loop);
				break;
		}
	};

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

	// Event Listeners
	container.addEventListener('click', handleClick);
	audio.addEventListener('play', handleStateChange);
	audio.addEventListener('pause', handleStateChange);
	audio.addEventListener('timeupdate', updateProgress);
	audio.addEventListener('loadedmetadata', updateProgress);

	if (scrubber) {
		scrubber.addEventListener('input', handleScrubberInput);
		scrubber.addEventListener('change', handleScrubberChange);
	}

	// Initial sync
	handleStateChange();
	updateProgress();

	return {
		isShuffle: () => isShuffle,
		destroy: () => {
			container.removeEventListener('click', handleClick);
			audio.removeEventListener('play', handleStateChange);
			audio.removeEventListener('pause', handleStateChange);
			audio.removeEventListener('timeupdate', updateProgress);
			audio.removeEventListener('loadedmetadata', updateProgress);

			if (scrubber) {
				scrubber.removeEventListener('input', handleScrubberInput);
				scrubber.removeEventListener('change', handleScrubberChange);
			}
		}
	};
}