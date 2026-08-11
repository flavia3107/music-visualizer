export function initPlayerControls(audio, controlsContainer = '.player-controls') {
	const container = typeof controlsContainer === 'string'
		? document.querySelector(controlsContainer)
		: controlsContainer;

	if (!audio || !container) {
		console.warn('initPlayerControls: Missing audio element or controls container.');
		return;
	}

	let isShuffle = false;

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

	container.addEventListener('click', handleClick);
	audio.addEventListener('play', handleStateChange);
	audio.addEventListener('pause', handleStateChange);
	handleStateChange();

	return {
		isShuffle: () => isShuffle,
		destroy: () => {
			container.removeEventListener('click', handleClick);
			audio.removeEventListener('play', handleStateChange);
			audio.removeEventListener('pause', handleStateChange);
		}
	};
}