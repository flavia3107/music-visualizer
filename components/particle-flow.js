import { Particle } from './particle.js';

export class ParticleFlowVisualizer {
	constructor() {
		this.particles = [];
		this.smoothedData = new Float32Array(0);
		this.maxParticles = 800;

		// Shape Mode: 'circle', 'vortex', 'helix', or 'wave'
		this.shapeMode = 'circle';
		this.angleOffset = 0;
	}

	// Helper method to switch flow layouts on the fly
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
		const centerY = height / 2;

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

		const numPoints = 64;

		if (this.smoothedData.length !== numPoints) {
			this.smoothedData = new Float32Array(numPoints);
		}

		// 3. Audio Processing & Smoothing
		const hasData = data && data.length > 0;
		if (hasData) {
			const activeBins = Math.floor(data.length * 0.75);

			for (let i = 0; i < numPoints; i++) {
				const normalizedDistance = i / (numPoints - 1);
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
			for (let i = 0; i < numPoints; i++) {
				this.smoothedData[i] *= 0.85;
			}
		}

		// 4. Generate Visualizer Emission Points based on `shapeMode`
		const emissionPoints = [];
		this.angleOffset += 0.005; // Slow rotation for dynamic motion

		const baseRadius = Math.min(width, height) * 0.22;

		for (let i = 0; i < numPoints; i++) {
			const amp = Math.min(1.0, Math.max(0.01, this.smoothedData[i]));
			const pct = i / numPoints;
			const angle = (pct * Math.PI * 2) + this.angleOffset;

			let x = centerX;
			let y = centerY;
			let emitAngle = angle;

			switch (this.shapeMode) {
				case 'circle': {
					// Radial burst outward from an audio-driven circle ring
					const r = baseRadius + (amp * baseRadius * 0.8);
					x = centerX + Math.cos(angle) * r;
					y = centerY + Math.sin(angle) * r;
					emitAngle = angle; // Points outward from center
					break;
				}

				case 'vortex': {
					// Spiral formation pushing particles inward/outward in a vortex
					const r = (baseRadius * 0.3) + (pct * baseRadius * 1.5) + (amp * 40);
					x = centerX + Math.cos(angle * 2) * r;
					y = centerY + Math.sin(angle * 2) * r;
					emitAngle = angle + (Math.PI / 2); // Tangential angle for spiral flow
					break;
				}

				case 'helix': {
					// Double wave/DNA helix structure across the screen
					const waveX = (width * 0.1) + (pct * width * 0.8);
					const helixHeight = height * 0.2;
					const phase = (pct * Math.PI * 4) + (this.angleOffset * 4);

					x = waveX;
					y = centerY + Math.sin(phase) * helixHeight * (1 + amp);
					emitAngle = Math.cos(phase) > 0 ? -Math.PI / 2 : Math.PI / 2;
					break;
				}

				case 'wave':
				default: {
					// Curved arch across the lower portion of screen
					const waveWidth = width * 0.8;
					x = (width * 0.1) + (pct * waveWidth);
					y = (height * 0.85) - (amp * height * 0.6);
					emitAngle = -Math.PI / 2; // Upward flow
					break;
				}
			}

			emissionPoints.push({ x, y, angle: emitAngle, amp, index: i });
		}

		// 5. Spawn standard particles from transformed shape coordinates
		if (hasData) {
			for (let i = 0; i < emissionPoints.length; i++) {
				const pt = emissionPoints[i];

				if (pt.amp > 0.1) {
					const spawnRate = Math.min(3, Math.floor(pt.amp * 4));

					for (let s = 0; s < spawnRate; s++) {
						if (this.particles.length >= this.maxParticles) break;

						const colorIndex = Math.floor((i / emissionPoints.length) * themePalette.length);
						const color = themePalette[colorIndex % themePalette.length];

						// Instantiate standard Particle class without modifying it
						this.particles.push(new Particle(pt.x, pt.y, pt.angle, color));
					}
				}
			}
		}

		// 6. Update and Draw active particles
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

/**
 * visualizer.setShapeMode('circle');  // Radial burst ring
 * visualizer.setShapeMode('vortex');  // Spiral energy swirl
 * visualizer.setShapeMode('helix');   // Sine-wave / DNA strands
 * visualizer.setShapeMode('wave');    // Upward arching spectrum
 */