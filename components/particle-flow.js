import { Particle } from './particle.js';

export class ParticleFlowVisualizer {
	constructor() {
		this.particles = [];
		this.smoothedData = new Float32Array(0);
		this.maxParticles = 1000;

		// Shape Mode: 'wave' (default)
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
		const baselineY = height * 0.65; // Place wave comfortably in lower-middle area

		// 1. Clear frame
		ctx.save();
		ctx.clearRect(0, 0, width, height);

		// 2. Resolve Palette
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
		}

		// 3. Audio Processing (Mirrored Symmetrical Spectrum)
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

				let targetAmp = Math.pow(rawVal, 1.6);
				const rate = targetAmp > this.smoothedData[i] ? 0.45 : 0.2;
				this.smoothedData[i] += (targetAmp - this.smoothedData[i]) * rate;
			}
		} else {
			for (let i = 0; i < numHalfPoints; i++) {
				this.smoothedData[i] *= 0.85;
			}
		}

		// 4. Generate Symmetrical Wave Coordinates
		this.phase += 0.02; // Subtle undulating animation
		const wavePoints = new Array(numTotalPoints);
		const drawWidth = width * 0.9;
		const halfWidth = drawWidth / 2;
		const step = halfWidth / (numHalfPoints - 1);
		const maxWaveHeight = height * 0.4;

		for (let i = 0; i < numHalfPoints; i++) {
			const amp = Math.min(1.0, Math.max(0.01, this.smoothedData[i]));

			// Subtle ambient sine motion so the wave moves even during quiet sections
			const ambientWave = Math.sin(this.phase + (i * 0.2)) * 6;
			const y = baselineY - (amp * maxWaveHeight) + ambientWave;

			const xOffset = i * step;
			const centerIdx = numHalfPoints - 1;

			// Emission angle points upward
			const emitAngle = -Math.PI / 2 + (Math.sin(this.phase + i) * 0.1);

			wavePoints[centerIdx + i] = { x: centerX + xOffset, y, amp, angle: emitAngle, index: i };
			wavePoints[centerIdx - i] = { x: centerX - xOffset, y, amp, angle: emitAngle, index: i };
		}

		// 5. Draw Glowing Base Wave Ribbon
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(wavePoints[0].x, wavePoints[0].y);

		for (let i = 0; i < wavePoints.length - 1; i++) {
			const xc = (wavePoints[i].x + wavePoints[i + 1].x) / 2;
			const yc = (wavePoints[i].y + wavePoints[i + 1].y) / 2;
			ctx.quadraticCurveTo(wavePoints[i].x, wavePoints[i].y, xc, yc);
		}

		ctx.strokeStyle = themePalette[2] || '#00d2ff';
		ctx.lineWidth = 3;
		ctx.shadowColor = themePalette[2] || '#00d2ff';
		ctx.shadowBlur = 12;
		ctx.stroke();
		ctx.restore();

		// 6. Spawn Particles Across the Entire Wave Width
		if (hasData) {
			for (let i = 0; i < wavePoints.length; i++) {
				const pt = wavePoints[i];

				// A. Base Continuous Emission: Keeps full wave shape visible across all 63 points
				if (Math.random() < 0.4 && this.particles.length < this.maxParticles) {
					const colorIndex = Math.floor((i / wavePoints.length) * themePalette.length);
					const color = themePalette[colorIndex % themePalette.length];

					const p = new Particle(pt.x, pt.y, pt.angle, color);
					p.decay = 0.03 + Math.random() * 0.02; // Faster decay keeps particles tight along the wave
					this.particles.push(p);
				}

				// B. Dynamic Peak Bursts: Spawn additional particles on audio peaks
				if (pt.amp > 0.12) {
					const burstCount = Math.floor(pt.amp * 3);

					for (let s = 0; s < burstCount; s++) {
						if (this.particles.length >= this.maxParticles) break;

						const colorIndex = Math.floor((i / wavePoints.length) * themePalette.length);
						const color = themePalette[colorIndex % themePalette.length];

						const jitterX = pt.x + (Math.random() - 0.5) * 8;
						const p = new Particle(jitterX, pt.y, pt.angle, color);
						p.decay = 0.025 + Math.random() * 0.02;
						this.particles.push(p);
					}
				}
			}
		}

		// 7. Update and Draw active particles
		for (let i = this.particles.length - 1; i >= 0; i--) {
			const p = this.particles[i];
			p.update();
			p.draw(ctx);

			if (p.alpha <= 0 || p.x < -20 || p.x > width + 20 || p.y < -20 || p.y > height + 20) {
				this.particles.splice(i, 1);
			}
		}

		ctx.restore();
	}
}