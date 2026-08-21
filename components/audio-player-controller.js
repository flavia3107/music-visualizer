const formatTime = (seconds) => {
	if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
	const mins = Math.floor(seconds / 60);
	const secs = Math.floor(seconds % 60);
	return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const calculateNextTrackIndex = (currentIndex, length, direction = 'next') => {
	if (length === 0) return -1;
	if (direction === 'next') return (currentIndex + 1) % length;
	return (currentIndex - 1 + length) % length;
};

export class AudioPlayerController {
	constructor(audio, controlsContainer = '.player-controls', trackOptions = {}) {
		this.audio = audio;
		this.container = typeof controlsContainer === 'string'
			? document.querySelector(controlsContainer)
			: controlsContainer;

		if (!this.audio || !this.container) return;

		this.trackOptions = {
			getTracks: () => [],
			getCurrentTrackId: () => null,
			playTrack: () => { },
			...trackOptions,
		};

		this.isShuffle = false;
		this.isSeeking = false;
		this.lastVolume = this.audio.volume || 1;

		this._resolveElements();
		this._bindEvents();
		this.syncUI();
	}

	_resolveElements() {
		const root = this.container.closest('.playback-bar') || this.container.parentElement || document;
		this.elements = {
			scrubber: root.querySelector('.progress .scrubber'),
			currentTime: root.querySelector('.progress .time:nth-of-type(1)'),
			durationTime: root.querySelector('.progress .time:nth-of-type(2)'),
			volumeScrubber: root.querySelector('.volume-control .volume-scrubber'),
			volumeIcon: root.querySelector('.volume-control .volume-icon'),
			volumeValue: root.querySelector('.volume-control .volume-value'),
			muteBtn: root.querySelector('.volume-control .mute-btn'),
			playBtnIcon: this.container.querySelector('[aria-label*="Play"] .material-symbols-outlined, [data-action="play-pause"] .material-symbols-outlined')
		};
	}


	updateVolumeUI = () => {
		const currentVol = this.audio.muted ? 0 : this.audio.volume;
		const displayVal = Math.round(currentVol * 100);

		if (this.elements.volumeScrubber) this.elements.volumeScrubber.value = displayVal;
		if (this.elements.volumeValue) this.elements.volumeValue.textContent = `${displayVal}%`;

		if (this.elements.volumeIcon) {
			if (this.audio.muted || this.audio.volume === 0) this.elements.volumeIcon.textContent = 'volume_off';
			else if (this.audio.volume < 0.5) this.elements.volumeIcon.textContent = 'volume_down';
			else this.elements.volumeIcon.textContent = 'volume_up';
		}
	};

	updateProgressUI = () => {
		const current = this.audio.currentTime || 0;
		const duration = this.audio.duration || 0;

		if (this.elements.currentTime) this.elements.currentTime.textContent = formatTime(current);
		if (this.elements.durationTime) this.elements.durationTime.textContent = formatTime(duration);

		if (this.elements.scrubber && !this.isSeeking) {
			this.elements.scrubber.max = duration || 100;
			this.elements.scrubber.value = current;
		}
	};

	updatePlaybackState = () => {
		if (this.elements.playBtnIcon) {
			this.elements.playBtnIcon.textContent = this.audio.paused ? 'play_arrow' : 'pause';
		}
	};

	syncUI() {
		this.updatePlaybackState();
		this.updateProgressUI();
		this.updateVolumeUI();
	}


	getOrderedTracks() {
		return [...this.trackOptions.getTracks()].reverse();
	}

	navigateTrack(direction) {
		const tracks = this.getOrderedTracks();
		if (!tracks.length) return;

		if (direction === 'next' && this.isShuffle) {
			const randomIndex = Math.floor(Math.random() * tracks.length);
			return this.trackOptions.playTrack(tracks[randomIndex].id);
		}

		const currentId = this.trackOptions.getCurrentTrackId();
		const currentIndex = tracks.findIndex(t => t.id === currentId);

		if (currentIndex === -1) return this.trackOptions.playTrack(tracks[0].id);

		const targetIndex = calculateNextTrackIndex(currentIndex, tracks.length, direction);
		this.trackOptions.playTrack(tracks[targetIndex].id);
	}

	handlePrevTrack() {
		if (this.audio.currentTime > 3) {
			this.audio.currentTime = 0;
			return;
		}
		this.navigateTrack('prev');
	}

	handleScrubberInput = () => {
		this.isSeeking = true;
		if (this.elements.currentTime && this.elements.scrubber) {
			this.elements.currentTime.textContent = formatTime(this.elements.scrubber.value);
		}
	};

	handleScrubberChange = () => {
		if (this.elements.scrubber) {
			this.audio.currentTime = parseFloat(this.elements.scrubber.value);
		}
		this.isSeeking = false;
	};

	handleVolumeInput = (e) => {
		const value = parseFloat(e.target.value) / 100;
		this.audio.volume = value;
		this.audio.muted = value === 0;
		if (value > 0) this.lastVolume = value;
		this.updateVolumeUI();
	};

	handleMuteToggle = () => {
		if (this.audio.muted || this.audio.volume === 0) {
			this.audio.muted = false;
			this.audio.volume = this.lastVolume || 1;
		} else {
			this.lastVolume = this.audio.volume;
			this.audio.muted = true;
		}
		this.updateVolumeUI();
	};

	handleActionClick = (e) => {
		const btn = e.target.closest('.action-btn');
		if (!btn) return;

		const action = btn.dataset.action || btn.querySelector('.material-symbols-outlined')?.textContent.trim();

		switch (action) {
			case 'play-pause':
				if (window.audioCtx?.state === 'suspended') window.audioCtx.resume();
				this.audio.paused ? this.audio.play() : this.audio.pause();
				break;

			case 'prev':
				this.handlePrevTrack();
				break;

			case 'next':
				this.navigateTrack('next');
				break;

			case 'shuffle':
				this.isShuffle = !this.isShuffle;
				btn.classList.toggle('active', this.isShuffle);
				break;

			case 'repeat':
				this.audio.loop = !this.audio.loop;
				btn.classList.toggle('active', this.audio.loop);
				break;
		}
	};

	_bindEvents() {
		this.bindings = [
			[this.container, 'click', this.handleActionClick],
			[this.audio, 'play', this.updatePlaybackState],
			[this.audio, 'pause', this.updatePlaybackState],
			[this.audio, 'timeupdate', this.updateProgressUI],
			[this.audio, 'loadedmetadata', this.updateProgressUI],
			[this.audio, 'volumechange', this.updateVolumeUI],
			[this.elements.scrubber, 'input', this.handleScrubberInput],
			[this.elements.scrubber, 'change', this.handleScrubberChange],
			[this.elements.volumeScrubber, 'input', this.handleVolumeInput],
			[this.elements.muteBtn, 'click', this.handleMuteToggle],
		];

		this.bindings.forEach(([target, event, handler]) => {
			target?.addEventListener(event, handler);
		});
	}

	destroy() {
		this.bindings.forEach(([target, event, handler]) => {
			target?.removeEventListener(event, handler);
		});
	}
}