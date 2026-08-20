export function initPlayerControls(audio, controlsContainer = '.player-controls', trackOptions = {}) {
	const container = typeof controlsContainer === 'string' ? document.querySelector(controlsContainer) : controlsContainer;
	if (!audio || !container) return;

	const { getTracks = () => [], getCurrentTrackId = () => null, playTrack = () => { } } = trackOptions;
	const playbackBar = container.closest('.playback-bar') || container.parentElement;
	const progressContainer = container.previousElementSibling?.classList.contains('progress')
		? container.previousElementSibling
		: playbackBar?.querySelector('.progress') || document.querySelector('.progress');

	const scrubber = progressContainer?.querySelector('.scrubber');
	const timeSpans = progressContainer?.querySelectorAll('.time');
	const currentTimeSpan = timeSpans?.[0];
	const durationTimeSpan = timeSpans?.[1];
	const volumeContainer = container.nextElementSibling?.classList.contains('volume-control')
		? container.nextElementSibling
		: playbackBar?.querySelector('.volume-control') || document.querySelector('.volume-control');

	const volumeScrubber = volumeContainer?.querySelector('.volume-scrubber');
	const volumeIcon = volumeContainer?.querySelector('.volume-icon');
	const volumeValueSpan = volumeContainer?.querySelector('.volume-value');
	const muteBtn = volumeContainer?.querySelector('.mute-btn');

	let isShuffle = false;
	let isSeeking = false;
	let lastVolume = audio.volume > 0 ? audio.volume : 1;

	const formatTime = (seconds) => {
		if (isNaN(seconds) || seconds === Infinity) return '00:00';
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
	};

	const updateVolumeIcon = () => {
		if (!volumeIcon) return;
		if (audio.muted || audio.volume === 0) volumeIcon.textContent = 'volume_off';
		else if (audio.volume < 0.5) volumeIcon.textContent = 'volume_down';
		else volumeIcon.textContent = 'volume_up';
	};

	const updateVolumeUI = () => {
		const currentVol = audio.muted ? 0 : audio.volume;
		const displayVal = Math.round(currentVol * 100);

		if (volumeScrubber) volumeScrubber.value = displayVal;
		if (volumeValueSpan) volumeValueSpan.textContent = `${displayVal}%`;

		updateVolumeIcon();
	};

	const updateProgress = () => {
		const current = audio.currentTime || 0;
		const duration = audio.duration || 0;

		if (currentTimeSpan) currentTimeSpan.textContent = formatTime(current);
		if (durationTimeSpan) durationTimeSpan.textContent = formatTime(duration);
		if (scrubber && !isSeeking) {
			scrubber.max = duration || 100;
			scrubber.value = current;
		}
	};

	const handleScrubberInput = () => {
		isSeeking = true;
		if (currentTimeSpan) currentTimeSpan.textContent = formatTime(scrubber.value);
	};

	const handleScrubberChange = () => {
		audio.currentTime = parseFloat(scrubber.value);
		isSeeking = false;
	};

	const handleVolumeInput = (e) => {
		const value = parseFloat(e.target.value) / 100;
		audio.volume = value;
		if (value > 0) {
			audio.muted = false;
			lastVolume = value;
		}
		updateVolumeUI();
	};

	const handleMuteToggle = () => {
		if (audio.muted || audio.volume === 0) {
			audio.muted = false;
			audio.volume = lastVolume || 1;
		} else {
			lastVolume = audio.volume;
			audio.muted = true;
		}
		updateVolumeUI();
	};

	const getUiOrderedTracks = () => {
		const tracks = getTracks();
		return [...tracks].reverse();
	};

	const playNextTrack = () => {
		const uiTracks = getUiOrderedTracks();
		if (!uiTracks.length) return;

		if (isShuffle) {
			const randomIndex = Math.floor(Math.random() * uiTracks.length);
			playTrack(uiTracks[randomIndex].id);
			return;
		}

		const currentId = getCurrentTrackId();
		const currentIndex = uiTracks.findIndex(t => t.id === currentId);

		if (currentIndex !== -1 && currentIndex + 1 < uiTracks.length) playTrack(uiTracks[currentIndex + 1].id);
		else playTrack(uiTracks[0].id);
	};

	const playPrevTrack = () => {
		const uiTracks = getUiOrderedTracks();
		if (!uiTracks.length) return;

		if (audio.currentTime > 3) {
			audio.currentTime = 0;
			return;
		}

		const currentId = getCurrentTrackId();
		const currentIndex = uiTracks.findIndex(t => t.id === currentId);
		if (currentIndex > 0) playTrack(uiTracks[currentIndex - 1].id);
		else playTrack(uiTracks[uiTracks.length - 1].id);
	};

	const handleClick = (e) => {
		const btn = e.target.closest('.action-btn');
		if (!btn) return;

		const icon = btn.querySelector('.material-symbols-outlined');
		const action = icon ? icon.textContent.trim() : '';

		switch (action) {
			case 'pause':
			case 'play_arrow':
				if (window.audioCtx && window.audioCtx.state === 'suspended') window.audioCtx.resume();

				if (audio.paused) audio.play();
				else audio.pause();
				break;

			case 'fast_rewind':
			case 'skip_previous':
				playPrevTrack();
				break;

			case 'fast_forward':
			case 'skip_next':
				playNextTrack();
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
			if (icon) icon.textContent = audio.paused ? 'play_arrow' : 'pause';
		}
	};

	container.addEventListener('click', handleClick);
	audio.addEventListener('play', handleStateChange);
	audio.addEventListener('pause', handleStateChange);
	audio.addEventListener('timeupdate', updateProgress);
	audio.addEventListener('loadedmetadata', updateProgress);
	audio.addEventListener('volumechange', updateVolumeUI);

	if (scrubber) {
		scrubber.addEventListener('input', handleScrubberInput);
		scrubber.addEventListener('change', handleScrubberChange);
	}

	if (volumeScrubber) volumeScrubber.addEventListener('input', handleVolumeInput);
	if (muteBtn) muteBtn.addEventListener('click', handleMuteToggle);

	// Initial sync
	handleStateChange();
	updateProgress();
	updateVolumeUI();

	return {
		isShuffle: () => isShuffle,
		destroy: () => {
			container.removeEventListener('click', handleClick);
			audio.removeEventListener('play', handleStateChange);
			audio.removeEventListener('pause', handleStateChange);
			audio.removeEventListener('timeupdate', updateProgress);
			audio.removeEventListener('loadedmetadata', updateProgress);
			audio.removeEventListener('volumechange', updateVolumeUI);

			if (scrubber) {
				scrubber.removeEventListener('input', handleScrubberInput);
				scrubber.removeEventListener('change', handleScrubberChange);
			}

			if (volumeScrubber) volumeScrubber.addEventListener('input', handleVolumeInput);
			if (muteBtn) muteBtn.addEventListener('click', handleMuteToggle);
		}
	};
}