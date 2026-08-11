export class VisualizerManager {
	constructor(canvasId, audioDataProvider = null) {
		this.canvas = document.getElementById(canvasId);
		this.ctx = this.canvas.getContext('2d');

		this.currentVisualizer = null;
		this.animationFrameId = null;
		this.audioDataProvider = audioDataProvider;

		this.width = 0;
		this.height = 0;
		this.centerX = 0;
		this.centerY = 0;

		this._initResizeHandler();
	}

	setAudioDataProvider(providerFn) {
		this.audioDataProvider = providerFn;
	}

	_initResizeHandler() {
		this.adjustCanvasSize();
		window.addEventListener('resize', () => this.adjustCanvasSize());
	}

	adjustCanvasSize() {
		if (!this.canvas) return;
		const rect = this.canvas.getBoundingClientRect();
		const dpr = window.devicePixelRatio || 1;

		this.canvas.style.width = `${rect.width}px`;
		this.canvas.style.height = `${rect.height}px`;
		this.width = rect.width;
		this.height = rect.height;
		this.canvas.width = rect.width * dpr;
		this.canvas.height = rect.height * dpr;
		this.ctx.scale(dpr, dpr);
		this.centerX = rect.width / 2;
		this.centerY = rect.height / 2;
	}

	setVisualizer(visualizerStrategy) {
		this.currentVisualizer = visualizerStrategy;
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		this.ctx.globalCompositeOperation = 'source-over';
	}

	start() {
		if (!this.animationFrameId) this._loop()
	}

	stop() {
		if (this.animationFrameId) {
			cancelAnimationFrame(this.animationFrameId);
			this.animationFrameId = null;
		}
	}

	_loop() {
		this.animationFrameId = requestAnimationFrame(() => this._loop());

		if (this.currentVisualizer && typeof this.currentVisualizer.draw === 'function') {
			const audioData = this.audioDataProvider ? this.audioDataProvider() : new Uint8Array(0);
			this.currentVisualizer.draw(this.ctx, audioData, {
				width: this.width,
				height: this.height,
				centerX: this.centerX,
				centerY: this.centerY
			});
		}
	}
}