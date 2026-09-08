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
		const numTotalPoints = numHalfPoints * 2 - 1;

		if (this.smoothedData.length !== numHalfPoints) {
			this.smoothedData = new Float32Array(numHalfPoints);
			this.spatialData = new Float32Array(numHalfPoints);
		}

		// 3. Audio Frequency Processing with Temporal Smoothing
		const hasData = data && data.length > 0;
		if (hasData) {
			const activeBins = Math.floor(data.length * 0.75);

			for (let i = 0; i < numHalfPoints; i++) {
				const normalizedDistance = i / (numHalfPoints - 1);
				// Lower logarithmic power softens the extreme bass spike at bin 0
				const logIndex = Math.pow(normalizedDistance, 0.8) * (activeBins - 1);
				const idxLower = Math.floor(logIndex);
				const idxUpper = Math.min(idxLower + 1, activeBins - 1);
				const frac = logIndex - idxLower;
				const rawVal = (data[idxLower] * (1 - frac) + data[idxUpper] * frac) / 255;

				// Scale down low index (bass) slightly so center peak doesn't overwhelm mid/highs
				const bassDampener = 0.65 + (normalizedDistance * 0.35);
				const targetAmp = Math.pow(rawVal * bassDampener, 1.3);

				const rate = targetAmp > this.smoothedData[i] ? 0.45 : 0.15;
				this.smoothedData[i] += (targetAmp - this.smoothedData[i]) * rate;
			}

			// 4. Spatial Gaussian Smoothing (Blends sharp center peaks softly into neighboring points)
			for (let i = 0; i < numHalfPoints; i++) {
				const prev = this.smoothedData[Math.max(0, i - 1)];
				const curr = this.smoothedData[i];
				const next = this.smoothedData[Math.min(numHalfPoints - 1, i + 1)];

				// 3-point Gaussian kernel weighting [0.25, 0.5, 0.25]
				this.spatialData[i] = (prev * 0.25) + (curr * 0.5) + (next * 0.25);
			}
		} else {
			for (let i = 0; i < numHalfPoints; i++) {
				this.smoothedData[i] *= 0.88;
				this.spatialData[i] *= 0.88;
			}
		}

		// 5. Compute Perfectly Symmetrical Coordinates
		this.phase += 0.03;
		const wavePoints = new Array(numTotalPoints);
		const drawWidth = width * 0.92;
		const halfWidth = drawWidth / 2;
		const step = halfWidth / (numHalfPoints - 1);
		const maxFlameHeight = height * 0.55;

		for (let i = 0; i < numHalfPoints; i++) {
			const amp = Math.min(1.0, Math.max(0.02, this.spatialData[i]));

			// Mirror flicker noise identically across left/right using absolute index distance
			const flicker = (Math.sin(this.phase + i * 0.4) * 3) + (Math.cos(this.phase * 1.3 + i * 0.6) * 3);
			const y = baselineY - (amp * maxFlameHeight) + flicker;

			const xOffset = i * step;
			const centerIdx = numHalfPoints - 1;

			// Equal outward heat angles for mirrored sides
			const outwardDraft = (i / numHalfPoints) * 0.18;
			const angleLeft = -Math.PI / 2 - outwardDraft;
			const angleRight = -Math.PI / 2 + outwardDraft;

			wavePoints[centerIdx + i] = { x: centerX + xOffset, y, amp, angle: angleRight, halfIndex: i };
			wavePoints[centerIdx - i] = { x: centerX - xOffset, y, amp, angle: angleLeft, halfIndex: i };
		}

		// 6. Spawn Symmetrical Fire Particles with Mirrored Palette
		if (hasData) {
			for (let i = 0; i < wavePoints.length; i++) {
				const pt = wavePoints[i];

				// Mirrored color distribution radiating outward from center
				const colorRatio = pt.halfIndex / (numHalfPoints - 1);
				const colorIdx = Math.floor(colorRatio * themePalette.length);
				const color = themePalette[colorIdx % themePalette.length];

				// A. Ember Base Bed
				if (Math.random() < 0.55 && this.particles.length < this.maxParticles) {
					const p = new Particle(pt.x, baselineY, pt.angle, color);
					p.vy = -0.8 - (Math.random() * 1.8);
					p.vx = (Math.random() - 0.5) * 1.0;
					p.decay = 0.02 + Math.random() * 0.02;
					this.particles.push(p);
				}

				// B. Audio Flame Peaks
				if (pt.amp > 0.06) {
					const burstCount = Math.floor(pt.amp * 4);

					for (let s = 0; s < burstCount; s++) {
						if (this.particles.length >= this.maxParticles) break;

						const spawnX = pt.x + (Math.random() - 0.5) * 10;
						const spawnY = pt.y + (Math.random() - 0.5) * 8;

						const p = new Particle(spawnX, spawnY, pt.angle, color);
						p.vy = -(2.0 + (pt.amp * 3.5) + (Math.random() * 1.8));
						p.vx += (Math.random() - 0.5) * 1.2;
						p.decay = 0.018 + Math.random() * 0.02;

						this.particles.push(p);
					}
				}
			}
		}

		// 7. Render Particle Fire Physics
		for (let i = this.particles.length - 1; i >= 0; i--) {
			const p = this.particles[i];

			p.vy -= 0.04; // Gentle thermal rise
			p.vx += (Math.random() - 0.5) * 0.18; // Draft turbulence

			p.update();
			p.draw(ctx);

			if (p.alpha <= 0 || p.x < -20 || p.x > width + 20 || p.y < -20 || p.y > height + 20) {
				this.particles.splice(i, 1);
			}
		}

		ctx.restore();
	}
}