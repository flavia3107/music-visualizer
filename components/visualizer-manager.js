export class VisualizerManager {
	constructor(canvasId) {
		this.canvas = document.getElementById(canvasId);
		this.ctx = this.canvas.getContext('2d');

		this.currentVisualizer = null;
		this.animationFrameId = null;

		this.width = 0;
		this.height = 0;
		this.centerX = 0;
		this.centerY = 0;

		this._initResizeHandler();
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

		this.width = this.canvas.width = rect.width * dpr;
		this.height = this.canvas.height = rect.height * dpr;

		this.ctx.scale(dpr, dpr);

		this.centerX = rect.width / 2;
		this.centerY = rect.height / 2;
	}

	setVisualizer(visualizerStrategy) {
		this.currentVisualizer = visualizerStrategy;
		// Reset canvas context state on switch
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		this.ctx.globalCompositeOperation = 'source-over';
	}

	start() {
		if (!this.animationFrameId) {
			this._loop();
		}
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
			const rect = this.canvas.getBoundingClientRect();
			this.currentVisualizer.draw(this.ctx, rect, {
				width: this.width,
				height: this.height,
				centerX: this.centerX,
				centerY: this.centerY
			});
		}
	}
}