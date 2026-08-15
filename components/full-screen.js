export class PartyMode {
	/**
	 * @param {Object} options Configuration options for Party Mode
	 * @param {string} options.buttonSelector Selector for the Party Mode trigger button
	 * @param {string} options.targetSelector Selector for the element to maximize in fullscreen
	 * @param {string} options.fullscreenClass Class added to target when fullscreen is active
	 */
	constructor(options = {}) {
		this.buttonSelector = options.buttonSelector || '.btn-party';
		this.targetSelector = options.targetSelector || '.ui-container';
		this.fullscreenClass = options.fullscreenClass || 'party-fullscreen';

		this.partyBtn = document.querySelector(this.buttonSelector);
		this.targetElement = document.querySelector(this.targetSelector);

		this._boundToggle = this.toggle.bind(this);
		this._boundHandleChange = this._handleFullscreenChange.bind(this);

		this.init();
	}

	/**
	 * Set up event listeners
	 */
	init() {
		if (!this.partyBtn || !this.targetElement) {
			console.warn('PartyMode: Button or target element not found in DOM.');
			return;
		}

		this.partyBtn.addEventListener('click', this._boundToggle);
		document.addEventListener('fullscreenchange', this._boundHandleChange);
		document.addEventListener('webkitfullscreenchange', this._boundHandleChange);
	}

	/**
	 * Toggle fullscreen state
	 */
	toggle() {
		if (!this.isFullscreen) {
			this.enter();
		} else {
			this.exit();
		}
	}

	/**
	 * Request fullscreen mode
	 */
	enter() {
		const requestFS = this.targetElement.requestFullscreen ||
			this.targetElement.webkitRequestFullscreen;

		if (requestFS) {
			requestFS.call(this.targetElement).catch((err) => {
				console.error(`PartyMode: Error enabling fullscreen - ${err.message}`);
			});
		}
	}

	/**
	 * Exit fullscreen mode
	 */
	exit() {
		const exitFS = document.exitFullscreen ||
			document.webkitExitFullscreen;

		if (exitFS) {
			exitFS.call(document);
		}
	}

	/**
	 * Check if currently in fullscreen
	 * @returns {boolean}
	 */
	get isFullscreen() {
		return Boolean(document.fullscreenElement || document.webkitFullscreenElement);
	}

	/**
	 * Internal handler to sync UI and emit resize event
	 */
	_handleFullscreenChange() {
		const active = this.isFullscreen;

		this.targetElement.classList.toggle(this.fullscreenClass, active);
		this.partyBtn.classList.toggle('active', active);

		// Notify canvas / renderer to recalculate dimensions
		window.dispatchEvent(new Event('resize'));
	}

	/**
	 * Clean up event listeners if needed
	 */
	destroy() {
		if (this.partyBtn) {
			this.partyBtn.removeEventListener('click', this._boundToggle);
		}
		document.removeEventListener('fullscreenchange', this._boundHandleChange);
		document.removeEventListener('webkitfullscreenchange', this._boundHandleChange);
	}
}