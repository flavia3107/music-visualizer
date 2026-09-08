import { Particle } from './particle.js';

export class ParticleFlowVisualizer {
	constructor() {
		this.particles = [];
		this.smoothedData = new Float32Array(0);
		this.maxParticles = 300;
	}

	draw(ctx, data = new Uint8Array(0), bounds = {}, colors = {}) {
		if (!ctx || !bounds.width || !bounds.height) return;

		const { width, height } = bounds;
		const paddingX = width * 0.05;
		const drawWidth = width - (paddingX * 2);
		const centerX = width / 2;
		const halfWidth = drawWidth / 2;
		const baselineY = height * 0.92;
		const maxWaveHeight = height * 0.75;

		// 1. Clear frame
		ctx.save();
		ctx.clearRect(0, 0, width, height);

		// 2. Resolve Theme Palette
		let themePalette = [];
		if (Array.isArray(colors.palette) && colors.palette.length > 0) {
			themePalette = colors.palette;
		} else {
			const colorList = [colors.primary, colors.secondary, colors.accent, colors.highlight, colors.muted].filter(Boolean);
			themePalette = colorList.length >= 2 ? colorList : ['#ff416c', '#9b51e0', '#00d2ff', '#41e296', '#feb47b'];
		}

		const numHalfPoints = 28;
		const numTotalPoints = numHalfPoints * 2 - 1;

		if (this.smoothedData.length !== numHalfPoints) {
			this.smoothedData = new Float32Array(numHalfPoints);
		}

		// 3. Audio Frequency Data Processing & Smoothing
		const hasData = data && data.length > 0;
		if (hasData) {
			const activeBins = Math.floor(data.length * 0.75);

			for (let i = 0; i < numHalfPoints; i++) {
				const normalizedDistance = i / (numHalfPoints - 1);
				const logIndex = Math.pow(normalizedDistance, 1.2) * (activeBins - 1);
				const idxLower = Math.floor(logIndex);
				const idxUpper = Math.min(idxLower + 1, activeBins - 1);
				const frac = logIndex - idxLower;
				const rawVal = (data[idxLower] * (1 - frac) + data[idxUpper] * frac) / 255;

				let targetAmp = Math.pow(rawVal, 1.8);

				if (normalizedDistance > 0.6) targetAmp *= 1.25;
				const rate = targetAmp > this.smoothedData[i] ? 0.45 : 0.2;
				this.smoothedData[i] += (targetAmp - this.smoothedData[i]) * rate;
			}
		} else {
			for (let i = 0; i < numHalfPoints; i++) {
				this.smoothedData[i] *= 0.85;
			}
		}

		// 4. Calculate Wave/Flow Emitter Points
		const wavePoints = new Array(numTotalPoints);
		const step = halfWidth / (numHalfPoints - 1);

		for (let i = 0; i < numHalfPoints; i++) {
			const amp = Math.min(1.0, Math.max(0.02, this.smoothedData[i]));
			const y = baselineY - (amp * maxWaveHeight);
			const xOffset = i * step;
			const centerIdx = numHalfPoints - 1;

			wavePoints[centerIdx + i] = { x: centerX + xOffset, y, amp, index: i };
			wavePoints[centerIdx - i] = { x: centerX - xOffset, y, amp, index: i };
		}

		// 5. Spawn Particles along audio peaks
		if (hasData) {
			for (let i = 0; i < wavePoints.length; i++) {
				const pt = wavePoints[i];
				// Higher amplitude points have a higher chance to emit particles
				if (pt.amp > 0.15 && Math.random() < pt.amp * 0.7) {
					// Pick a color from palette mapped to the point position
					const colorIndex = Math.floor((i / wavePoints.length) * themePalette.length);
					const color = themePalette[colorIndex % themePalette.length];

					// Angle pointing mostly upwards with slight spread outward from center
					const baseAngle = -Math.PI / 2;
					const directionFromCenter = (pt.x - centerX) / halfWidth;
					const angle = baseAngle + (directionFromCenter * 0.3);

					if (this.particles.length < this.maxParticles) {
						this.particles.push(new Particle(pt.x, pt.y, angle, color));
					}
				}
			}
		}

		// 6. Update and Draw Existing Particles
		for (let i = this.particles.length - 1; i >= 0; i--) {
			const p = this.particles[i];
			p.update();
			p.draw(ctx);

			// Remove dead or off-screen particles
			if (p.alpha <= 0 || p.x < 0 || p.x > width || p.y < 0 || p.y > height) {
				this.particles.splice(i, 1);
			}
		}

		ctx.restore();
	}
}