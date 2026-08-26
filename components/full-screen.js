export class PartyMode {
	buttonSelector;
	targetSelector;
	fullscreenClass;
	partyBtn;
	targetElement;
	fullscreenIcon;

	constructor({ buttonSelector = '.btn-party', targetSelector = '.ui-container', fullscreenClass = 'party-fullscreen' } = {}) {
		this.buttonSelector = buttonSelector;
		this.targetSelector = targetSelector;
		this.fullscreenClass = fullscreenClass;
		this.partyBtn = document.querySelector(this.buttonSelector);
		this.targetElement = document.querySelector(this.targetSelector);
		this.fullscreenIcon = document.querySelector('.fullscreen-icon');

		this.init();
	}

	init() {
		if (!this.partyBtn || !this.targetElement) return;

		this.partyBtn.addEventListener('click', this.toggle);
		document.addEventListener('fullscreenchange', this._handleFullscreenChange);
	}

	get isFullscreen() {
		return Boolean(document.fullscreenElement);
	}

	toggle = () => this.isFullscreen ? this.exit() : this.enter();

	async enter() {
		await this.targetElement?.requestFullscreen();
	}

	async exit() {
		if (this.isFullscreen) await document.exitFullscreen();
	}

	_handleFullscreenChange = () => {
		const active = this.isFullscreen;

		this.targetElement?.classList.toggle(this.fullscreenClass, active);
		this.partyBtn?.classList.toggle('active', active);

		if (this.fullscreenIcon) this.fullscreenIcon.innerHTML = active ? 'fullscreen_exit' : 'fullscreen';
		window.dispatchEvent(new Event('resize'));
	};

	destroy() {
		this.partyBtn?.removeEventListener('click', this.toggle);
		document.removeEventListener('fullscreenchange', this._handleFullscreenChange);
	}
}