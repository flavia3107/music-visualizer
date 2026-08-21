const formatTime = (seconds) => {
	if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
	const mins = Math.floor(seconds / 60);
	const secs = Math.floor(seconds % 60);
	return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export function initPlayerControls(audio, controlsContainer = '.player-controls', trackOptions = {}) {
	const container = typeof controlsContainer === 'string'
		? document.querySelector(controlsContainer)
		: controlsContainer;

	if (!audio || !container) return null;

	const {
		getTracks = () => [],
		getCurrentTrackId = () => null,
		playTrack = () => { }
	} = trackOptions;
	const root = container.closest('.playback-bar') || container.parentElement || document;
	const elements = {
		scrubber: root.querySelector('.progress .scrubber'),
		currentTime: root.querySelector('.progress .time:nth-of-type(1)'),
		durationTime: root.querySelector('.progress .time:nth-of-type(2)'),
		volumeScrubber: root.querySelector('.volume-control .volume-scrubber'),
		volumeIcon: root.querySelector('.volume-control .volume-icon'),
		volumeValue: root.querySelector('.volume-control .volume-value'),
		muteBtn: root.querySelector('.volume-control .mute-btn'),
		playBtnIcon: container.querySelector('[data-action="play-pause"] .material-symbols-outlined, .action-btn .material-symbols-outlined')
	};

	let isShuffle = false;
	let isSeeking = false;
	let lastVolume = audio.volume || 1;


	const updateVolumeUI = () => {
		const currentVol = audio.muted ? 0 : audio.volume;
		const displayVal = Math.round(currentVol * 100);

		if (elements.volumeScrubber) elements.volumeScrubber.value = displayVal;
		if (elements.volumeValue) elements.volumeValue.textContent = `${displayVal}%`;

		if (elements.volumeIcon) {
			if (audio.muted || audio.volume === 0) elements.volumeIcon.textContent = 'volume_off';
			else if (audio.volume < 0.5) elements.volumeIcon.textContent = 'volume_down';
			else elements.volumeIcon.textContent = 'volume_up';
		}
	};

	const updateProgressUI = () => {
		const current = audio.currentTime || 0;
		const duration = audio.duration || 0;

		if (elements.currentTime) elements.currentTime.textContent = formatTime(current);
		if (elements.durationTime) elements.durationTime.textContent = formatTime(duration);

		if (elements.scrubber && !isSeeking) {
			elements.scrubber.max = duration || 100;
			elements.scrubber.value = current;
		}
	};

	const updatePlaybackState = () => {
		if (elements.playBtnIcon) {
			elements.playBtnIcon.textContent = audio.paused ? 'play_arrow' : 'pause';
		}
	};

	// --- Track Navigation ---

	const getOrderedTracks = () => [...getTracks()].reverse();

	const navigateTrack = (direction) => {
		const tracks = getOrderedTracks();
		if (!tracks.length) return;

		if (direction === 'next' && isShuffle) {
			const randomIndex = Math.floor(Math.random() * tracks.length);
			return playTrack(tracks[randomIndex].id);
		}

		const currentId = getCurrentTrackId();
		const currentIndex = tracks.findIndex(t => t.id === currentId);

		if (currentIndex === -1) return playTrack(tracks[0].id);

		const targetIndex = direction === 'next'
			? (currentIndex + 1) % tracks.length
			: (currentIndex - 1 + tracks.length) % tracks.length;

		playTrack(tracks[targetIndex].id);
	};

	const handlePrevTrack = () => {
		if (audio.currentTime > 3) {
			audio.currentTime = 0;
			return;
		}
		navigateTrack('prev');
	};

	const handleScrubberInput = () => {
		isSeeking = true;
		if (elements.currentTime && elements.scrubber) {
			elements.currentTime.textContent = formatTime(elements.scrubber.value);
		}
	};

	const handleScrubberChange = () => {
		if (elements.scrubber) {
			audio.currentTime = parseFloat(elements.scrubber.value);
		}
		isSeeking = false;
	};

	const handleVolumeInput = (e) => {
		const value = parseFloat(e.target.value) / 100;
		audio.volume = value;
		audio.muted = value === 0;
		if (value > 0) lastVolume = value;
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

	const handleActionClick = (e) => {
		const btn = e.target.closest('.action-btn');
		if (!btn) return;

		const action = btn.dataset.action || btn.querySelector('.material-symbols-outlined')?.textContent.trim();

		switch (action) {
			case 'play-pause':
			case 'play_arrow':
			case 'pause':
				if (window.audioCtx?.state === 'suspended') window.audioCtx.resume();
				audio.paused ? audio.play() : audio.pause();
				break;

			case 'prev':
			case 'fast_rewind':
			case 'skip_previous':
				handlePrevTrack();
				break;

			case 'next':
			case 'fast_forward':
			case 'skip_next':
				navigateTrack('next');
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


	const eventBindings = [
		[container, 'click', handleActionClick],
		[audio, 'play', updatePlaybackState],
		[audio, 'pause', updatePlaybackState],
		[audio, 'timeupdate', updateProgressUI],
		[audio, 'loadedmetadata', updateProgressUI],
		[audio, 'volumechange', updateVolumeUI],
		[elements.scrubber, 'input', handleScrubberInput],
		[elements.scrubber, 'change', handleScrubberChange],
		[elements.volumeScrubber, 'input', handleVolumeInput],
		[elements.muteBtn, 'click', handleMuteToggle],
	];

	eventBindings.forEach(([target, event, handler]) => {
		target?.addEventListener(event, handler);
	});

	updatePlaybackState();
	updateProgressUI();
	updateVolumeUI();

	return {
		getIsShuffle: () => isShuffle,
		destroy: () => {
			eventBindings.forEach(([target, event, handler]) => {
				target?.removeEventListener(event, handler);
			});
		}
	};
}