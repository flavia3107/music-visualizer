export class VisualizerManager {
	constructor(canvasId, audioDataProvider = null, options = {}) {
		this.canvas = typeof canvasId === 'string' ? document.getElementById(canvasId) : canvasId;
		this.ctx = this.canvas?.getContext('2d');
		this.audioDataProvider = audioDataProvider;

		this.currentVisualizer = null;
		this.animationFrameId = null;
		this.colors = {
			blue: 'hsla(195, 100%, 50%, 1)',
			dullBlue: 'hsla(195, 45%, 45%, 0.7)',
			pink: 'hsla(320, 100%, 55%, 1)',
			dullPink: 'hsla(320, 45%, 50%, 0.7)',
			yellow: 'hsla(45, 100%, 50%, 1)',
			transparent: 'hsla(0, 0%, 0%, 0)',
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