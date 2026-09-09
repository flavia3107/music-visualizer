import { Particle } from './particle.js';

export class ParticleFlowVisualizer {
	constructor() {
		this.particles = [];
		this.smoothedData = new Float32Array(0);
		this.spatialData = new Float32Array(0);
		this.maxParticles = 1200;

		this.shapeMode = 'vortex';
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

		// 1. Clear frame
		ctx.save();
		ctx.clearRect(0, 0, width, height);

		// 2. Resolve Dynamic Theme Palette
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

		// 3. Process Audio Frequency Data
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

			// Spatial smoothing across adjacent nodes
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

		// 4. Generate Left-Half Nodes (REVERSED: Bass/index 0 sits at centerX)
		this.phase += 0.03;
		const leftPoints = [];
		const maxFlameHeight = height * 0.5;

		for (let i = 0; i < numHalfPoints; i++) {
			const amp = Math.min(1.0, Math.max(0.02, this.spatialData[i]));

			// Reversing the ratio puts index 0 (bass/peaks) at centerX and high frequencies at edge 0
			const x = (1 - (i / (numHalfPoints - 1))) * centerX;
			const flicker = (Math.sin(this.phase + i * 0.4) * 3) + (Math.cos(this.phase * 1.3 + i * 0.6) * 3);
			const y = baselineY - (amp * maxFlameHeight) + flicker;

			leftPoints.push({ x, y, amp, index: i });
		}

		// 5. Spawn Left Particles and Direct-Mirror Them to the Right
		if (hasData) {
			for (let i = 0; i < leftPoints.length; i++) {
				const pt = leftPoints[i];

				// Palette colors map outward from center (index 0) to outer edges
				const colorRatio = pt.index / (numHalfPoints - 1);
				const colorIdx = Math.floor(colorRatio * themePalette.length);
				const color = themePalette[colorIdx % themePalette.length];

				// A. Base Ember Bed
				if (Math.random() < 0.5 && this.particles.length < this.maxParticles - 1) {
					const vx = (Math.random() - 0.5) * 0.6;
					const vy = -0.8 - (Math.random() * 1.5);
					const decay = 0.025 + Math.random() * 0.02;

					// Spawn Left Particle
					const pLeft = new Particle(pt.x, baselineY, -Math.PI / 2, color);
					pLeft.vx = vx;
					pLeft.vy = vy;
					pLeft.decay = decay;
					this.particles.push(pLeft);

					// Spawn Mirrored Right Particle
					if (pt.x < centerX - 2) {
						const pRight = new Particle(width - pt.x, baselineY, -Math.PI / 2, color);
						pRight.vx = -vx;
						pRight.vy = vy;
						pRight.decay = decay;
						this.particles.push(pRight);
					}
				}

				// B. Audio Peak Flares (Blasts tallest in center)
				if (pt.amp > 0.06) {
					const burstCount = Math.floor(pt.amp * 2);

					for (let s = 0; s < burstCount; s++) {
						if (this.particles.length >= this.maxParticles - 1) break;

						const offsetX = (Math.random() - 0.5) * 8;
						const offsetY = (Math.random() - 0.5) * 6;
						const vx = (Math.random() - 0.5) * 0.8;
						const vy = -(1.8 + (pt.amp * 2.5) + (Math.random() * 1.2));
						const decay = 0.02 + Math.random() * 0.02;

						// Left Peak Particle
						const pLeft = new Particle(pt.x + offsetX, pt.y + offsetY, -Math.PI / 2, color);
						pLeft.vx = vx;
						pLeft.vy = vy;
						pLeft.decay = decay;
						this.particles.push(pLeft);

						// Mirrored Right Peak Particle
						if (pt.x < centerX - 2) {
							const pRight = new Particle(width - (pt.x + offsetX), pt.y + offsetY, -Math.PI / 2, color);
							pRight.vx = -vx;
							pRight.vy = vy;
							pRight.decay = decay;
							this.particles.push(pRight);
						}
					}
				}
			}
		}

		// 6. Update and Render Particles
		for (let i = this.particles.length - 1; i >= 0; i--) {
			const p = this.particles[i];

			p.vy -= 0.03; // Thermal upward buoyancy
			p.update();
			p.draw(ctx);

			if (p.alpha <= 0 || p.x < -20 || p.x > width + 20 || p.y < -20 || p.y > height + 20) {
				this.particles.splice(i, 1);
			}
		}

		ctx.restore();
	}
}