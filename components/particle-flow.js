import { Particle } from './particle.js';

export class ParticleFlowVisualizer {
	constructor() {
		this.particles = [];
		this.smoothedData = new Float32Array(0);
		this.spatialData = new Float32Array(0);
		this.maxParticles = 800;
		this.shapeMode = 'wave';
		this.phase = 0;
	}

	setShapeMode(mode) {
		const validModes = ['circle', 'vortex', 'helix', 'wave'];
		if (validModes.includes(mode)) this.shapeMode = mode
	}

	draw(ctx, data = new Uint8Array(0), bounds = {}, colors = {}) {
		if (!ctx || !bounds.width || !bounds.height) return;

		const { width, height } = bounds;
		const centerX = width / 2;
		const baselineY = height * 0.92;

		ctx.save();
		ctx.clearRect(0, 0, width, height);

		let themePalette = [];
		if (Array.isArray(colors.palette) && colors.palette.length > 0) themePalette = colors.palette;
		else {
			const colorList = [colors.primary, colors.secondary, colors.accent, colors.highlight, colors.muted].filter(Boolean);
			themePalette = colorList.length >= 2 ? colorList : ['#ff416c', '#9b51e0', '#00d2ff', '#41e296', '#feb47b'];
		}

		const numHalfPoints = 32;
		if (this.smoothedData.length !== numHalfPoints) {
			this.smoothedData = new Float32Array(numHalfPoints);
			this.spatialData = new Float32Array(numHalfPoints);
		}

		const hasData = data && data.length > 0;
		if (hasData) {
			const activeBins = Math.floor(data.length * 0.75);
			for (let i = 0; i < numHalfPoints; i++) {
				const normalizedDistance = i / (numHalfPoints - 1);
				const logIndex = Math.pow(normalizedDistance, 0.9) * (activeBins - 1);
				const idxLower = Math.floor(logIndex);
				const idxUpper = Math.min(idxLower + 1, activeBins - 1);
				const frac = logIndex - idxLower;
				const rawVal = (data[idxLower] * (1 - frac) + data[idxUpper] * frac) / 255;
				const targetAmp = Math.pow(rawVal, 1.2);
				const rate = targetAmp > this.smoothedData[i] ? 0.45 : 0.15;
				this.smoothedData[i] += (targetAmp - this.smoothedData[i]) * rate;
			}

			for (let i = 0; i < numHalfPoints; i++) {
				const prev = this.smoothedData[Math.max(0, i - 1)];
				const curr = this.smoothedData[i];
				const next = this.smoothedData[Math.min(numHalfPoints - 1, i + 1)];
				this.spatialData[i] = (prev * 0.25) + (curr * 0.5) + (next * 0.25);
			}
		} else {
			for (let i = 0; i < numHalfPoints; i++) {
				this.smoothedData[i] *= 0.88;
				this.spatialData[i] *= 0.88;
			}
		}

		const numTotalPoints = numHalfPoints * 2 - 1;
		const fullPoints = new Array(numTotalPoints);
		const step = width / (numTotalPoints - 1);
		const centerIdx = numHalfPoints - 1;
		const maxAreaHeight = height * 0.65;

		for (let i = 0; i < numHalfPoints; i++) {
			const amp = Math.min(1.0, Math.max(0.01, this.spatialData[i]));
			const topY = baselineY - (amp * maxAreaHeight);
			const rightIdx = centerIdx + i;
			fullPoints[rightIdx] = { x: rightIdx * step, topY, amp, index: i };
			const leftIdx = centerIdx - i;
			fullPoints[leftIdx] = { x: leftIdx * step, topY, amp, index: i };
		}

		if (hasData) {
			for (let i = 0; i < fullPoints.length; i++) {
				const pt = fullPoints[i];
				const areaHeight = baselineY - pt.topY;

				if (areaHeight > 4 && Math.random() < 0.35) {
					const colorRatio = pt.index / (numHalfPoints - 1);
					const colorIdx = Math.floor(colorRatio * themePalette.length);
					const color = themePalette[colorIdx % themePalette.length];

					if (this.particles.length < this.maxParticles) {
						const heightRatio = Math.random();
						const spawnY = baselineY - (heightRatio * areaHeight);
						const spawnX = pt.x + (Math.random() - 0.5) * step * 1.2;
						const p = new Particle(spawnX, spawnY, -Math.PI / 2, color);
						p.vx = (Math.random() - 0.5) * 0.3;
						p.vy = -(0.1 + Math.random() * 0.4);
						p.decay = 0.02 + Math.random() * 0.015;
						this.particles.push(p);
					}
				}
			}
		}

		for (let i = this.particles.length - 1; i >= 0; i--) {
			const p = this.particles[i];
			p.update();
			p.draw(ctx);
			if (p.alpha <= 0 || p.x < -20 || p.x > width + 20 || p.y < -20 || p.y > height + 20) this.particles.splice(i, 1);
		}

		ctx.restore();
	}
}