export class VisualizerManager {
	constructor(canvasId, audioDataProvider = null, options = {}) {
		this.canvas = typeof canvasId === 'string' ? document.getElementById(canvasId) : canvasId;
		this.ctx = this.canvas?.getContext('2d');
		this.audioDataProvider = audioDataProvider;

		this.currentVisualizer = null;
		this.animationFrameId = null;

		this.colors = {
			primary: '#00f0ff',
			secondary: '#7000ff',
			accent: '#ff0055',
			background: '#0a0a12',
			...options.colors
		};

		if (this.canvas) {
			this.adjustCanvasSize();
			window.addEventListener('resize', () => this.adjustCanvasSize());
		}
	}

	setAudioDataProvider(provider) {
		this.audioDataProvider = provider;
	}

	setColors(newColors = {}) {
		this.colors = { ...this.colors, ...newColors };
	}

	setPalette(palette) {
		this.colors = { ...palette };
	}

	getColor(key) {
		return key ? this.colors[key] : { ...this.colors };
	}

	adjustCanvasSize() {
		if (!this.canvas) return;
		const { width, height } = this.canvas.getBoundingClientRect();
		const dpr = window.devicePixelRatio || 1;

		Object.assign(this.canvas.style, { width: `${width}px`, height: `${height}px` });
		Object.assign(this.canvas, { width: width * dpr, height: height * dpr });
		this.ctx.scale(dpr, dpr);

		this.bounds = { width, height, centerX: width / 2, centerY: height / 2 };
	}

	setVisualizer(strategy) {
		this.currentVisualizer = strategy;
		if (this.ctx) {
			this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
			this.ctx.globalCompositeOperation = 'source-over';
		}
	}

	start() {
		if (!this.animationFrameId) this._loop();
	}

	stop() {
		cancelAnimationFrame(this.animationFrameId);
		this.animationFrameId = null;
	}

	_loop = () => {
		this.animationFrameId = requestAnimationFrame(this._loop);
		if (!this.currentVisualizer?.draw) return;

		const data = this.audioDataProvider?.() ?? new Uint8Array(0);
		this.currentVisualizer.draw(this.ctx, data, this.bounds, this.colors);
	}
}