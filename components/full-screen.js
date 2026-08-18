export class PartyMode {
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

	init() {
		if (!this.partyBtn || !this.targetElement) {
			console.warn('PartyMode: Button or target element not found in DOM.');
			return;
		}

		this.partyBtn.addEventListener('click', this._boundToggle);
		document.addEventListener('fullscreenchange', this._boundHandleChange);
		document.addEventListener('webkitfullscreenchange', this._boundHandleChange);
	}

	toggle() {
		if (!this.isFullscreen) this.enter();
		else this.exit();
	}

	enter() {
		const requestFS = this.targetElement.requestFullscreen ||
			this.targetElement.webkitRequestFullscreen;

		if (requestFS) requestFS.call(this.targetElement)
	}


	exit() {
		const exitFS = document.exitFullscreen || document.webkitExitFullscreen;
		if (exitFS) exitFS.call(document);
	}


	get isFullscreen() {
		return Boolean(document.fullscreenElement || document.webkitFullscreenElement);
	}

	_handleFullscreenChange() {
		const active = this.isFullscreen;
		this.targetElement.classList.toggle(this.fullscreenClass, active);
		this.partyBtn.classList.toggle('active', active);
		window.dispatchEvent(new Event('resize'));
	}

	destroy() {
		if (this.partyBtn) this.partyBtn.removeEventListener('click', this._boundToggle);
		document.removeEventListener('fullscreenchange', this._boundHandleChange);
		document.removeEventListener('webkitfullscreenchange', this._boundHandleChange);
	}
}