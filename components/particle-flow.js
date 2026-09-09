import { Particle } from './particle.js';

export class ParticleFlowVisualizer {
	constructor() {
		this.particles = [];
		this.smoothedData = new Float32Array(0);
		this.spatialData = new Float32Array(0);
		this.maxParticles = 1200;

		this.shapeMode = 'wave';
		this.phase = 0;
	}

	setShapeMode(mode) {
		const validModes = ['circle', 'vortex', 'helix', 'wave'];
		if (validModes.includes(mode)) {
			this.shapeMode = mode;
		}
	}

	draw(ctx, data = new Uint8Array(0), bounds = {}, colors = {}) {
		if (!ctx || !bounds.width || !bounds.height) return;

		const { width, height } = bounds;
		const centerX = width / 2;
		const baselineY = height * 0.92;

		ctx.save();
		ctx.clearRect(0, 0, width, height);

		let themePalette = [];
		if (Array.isArray(colors.palette) && colors.palette.length > 0) {
			themePalette = colors.palette;
		} else {
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

		const leftPoints = [];
		for (let i = 0; i < numHalfPoints; i++) {
			const amp = Math.min(1.0, Math.max(0.02, this.spatialData[i]));
			const x = (1 - (i / (numHalfPoints - 1))) * centerX;
			leftPoints.push({ x, amp, index: i });
		}

		if (hasData) {
			for (let i = 0; i < leftPoints.length; i++) {
				const pt = leftPoints[i];
				const colorRatio = pt.index / (numHalfPoints - 1);
				const colorIdx = Math.floor(colorRatio * themePalette.length);
				const color = themePalette[colorIdx % themePalette.length];

				if (Math.random() < 0.4 && this.particles.length < this.maxParticles - 1) {
					const vx = (Math.random() - 0.5) * 0.5;
					const vy = -1.0 - (Math.random() * 1.5);
					const decay = 0.02 + Math.random() * 0.015;
					const pLeft = new Particle(pt.x, baselineY, -Math.PI / 2, color);
					pLeft.vx = vx;
					pLeft.vy = vy;
					pLeft.decay = decay;
					this.particles.push(pLeft);

					if (pt.x < centerX - 2) {
						const pRight = new Particle(width - pt.x, baselineY, -Math.PI / 2, color);
						pRight.vx = -vx;
						pRight.vy = vy;
						pRight.decay = decay;
						this.particles.push(pRight);
					}
				}

				if (pt.amp > 0.05) {
					const burstCount = Math.floor(pt.amp * 3);

					for (let s = 0; s < burstCount; s++) {
						if (this.particles.length >= this.maxParticles - 1) break;

						const spawnX = pt.x + (Math.random() - 0.5) * 12;
						const spawnY = baselineY + (Math.random() - 0.5) * 6;
						const vx = (Math.random() - 0.5) * 0.8;
						const vy = -(2.5 + (pt.amp * 5.5) + (Math.random() * 1.5));
						const decay = 0.01 + Math.random() * 0.012;
						const pLeft = new Particle(spawnX, spawnY, -Math.PI / 2, color);
						pLeft.vx = vx;
						pLeft.vy = vy;
						pLeft.decay = decay;
						this.particles.push(pLeft);

						if (pt.x < centerX - 2) {
							const pRight = new Particle(width - spawnX, spawnY, -Math.PI / 2, color);
							pRight.vx = -vx;
							pRight.vy = vy;
							pRight.decay = decay;
							this.particles.push(pRight);
						}
					}
				}
			}
		}

		for (let i = this.particles.length - 1; i >= 0; i--) {
			const p = this.particles[i];
			p.vy -= 0.025;
			p.update();
			p.draw(ctx);
			if (p.alpha <= 0 || p.x < -20 || p.x > width + 20 || p.y < -20 || p.y > height + 20) this.particles.splice(i, 1);
		}

		ctx.restore();
	}
}

// Update the shape so there isn't only one main peak