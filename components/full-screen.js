document.addEventListener('DOMContentLoaded', () => {
	const partyBtn = document.querySelector('.btn-party');
	const uiContainer = document.querySelector('.ui-container');

	partyBtn.addEventListener('click', toggleFullscreen);

	function toggleFullscreen() {
		if (!document.fullscreenElement && !document.webkitFullscreenElement) {
			const requestFS = uiContainer.requestFullscreen || uiContainer.webkitRequestFullscreen;
			if (requestFS) {
				requestFS.call(uiContainer).catch(err => {
					console.error(`Error attempting to enable fullscreen: ${err.message}`);
				});
			}
		} else {
			const exitFS = document.exitFullscreen || document.webkitExitFullscreen;
			if (exitFS) {
				exitFS.call(document);
			}
		}
	}

	function handleFullscreenChange() {
		const isFullscreen = Boolean(document.fullscreenElement || document.webkitFullscreenElement);
		uiContainer.classList.toggle('party-fullscreen', isFullscreen);
		window.dispatchEvent(new Event('resize'));
	}

	document.addEventListener('fullscreenchange', handleFullscreenChange);
	document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
});