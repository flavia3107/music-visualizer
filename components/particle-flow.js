import { Particle } from './particle.js';

export class ParticleFlowVisualizer {
	constructor() {
		this.particles = [];
		this.smoothedData = new Float32Array(0);
		this.maxParticles = 1200;

		// Shape Modes: 'circle', 'vortex', 'helix', 'wave'
		this.shapeMode = 'circle';
		this.angleOffset = 0;

		// Beat/Rhythm tracking variables
		this.previousEnergy = 0;
		this.beatThreshold = 0.15;
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
		const centerY = height / 2;

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

		const numPoints = 64;
		if (this.smoothedData.length !== numPoints) {
			this.smoothedData = new Float32Array(numPoints);
		}

		// 3. Audio Frequency Processing & Overall Energy Calculation
		let currentEnergy = 0;
		const hasData = data && data.length > 0;

		if (hasData) {
			const activeBins = Math.floor(data.length * 0.75);
			let totalVal = 0;

			for (let i = 0; i < numPoints; i++) {
				const normalizedDistance = i / (numPoints - 1);
				const logIndex = Math.pow(normalizedDistance, 1.2) * (activeBins - 1);
				const idxLower = Math.floor(logIndex);
				const idxUpper = Math.min(idxLower + 1, activeBins - 1);
				const frac = logIndex - idxLower;
				const rawVal = (data[idxLower] * (1 - frac) + data[idxUpper] * frac) / 255;

				totalVal += rawVal;
				let targetAmp = Math.pow(rawVal, 1.5);
				const rate = targetAmp > this.smoothedData[i] ? 0.45 : 0.2;
				this.smoothedData[i] += (targetAmp - this.smoothedData[i]) * rate;
			}

			currentEnergy = totalVal / numPoints; // Average volume across spectrum
		} else {
			for (let i = 0; i < numPoints; i++) {
				this.smoothedData[i] *= 0.85;
			}
		}

		// Detect dynamic beat transients (sudden jumps in overall volume)
		const energyDelta = currentEnergy - this.previousEnergy;
		const isBeat = energyDelta > this.beatThreshold;
		this.previousEnergy = currentEnergy;

		// 4. Generate Geometric Shape Nodes
		const emissionPoints = [];
		this.angleOffset += 0.005; // Gentle rotation over time

		const baseRadius = Math.min(width, height) * 0.24;

		for (let i = 0; i < numPoints; i++) {
			const amp = Math.min(1.0, Math.max(0.0, this.smoothedData[i]));
			const pct = i / numPoints;
			const angle = (pct * Math.PI * 2) + this.angleOffset;

			let x = centerX;
			let y = centerY;
			let emitAngle = angle;

			switch (this.shapeMode) {
				case 'circle': {
					const r = baseRadius + (amp * baseRadius * 0.6);
					x = centerX + Math.cos(angle) * r;
					y = centerY + Math.sin(angle) * r;
					emitAngle = angle;
					break;
				}

				case 'vortex': {
					const r = (baseRadius * 0.2) + (pct * baseRadius * 1.4) + (amp * 30);
					x = centerX + Math.cos(angle * 2) * r;
					y = centerY + Math.sin(angle * 2) * r;
					emitAngle = angle + (Math.PI / 2);
					break;
				}

				case 'helix': {
					const waveX = (width * 0.1) + (pct * width * 0.8);
					const helixHeight = height * 0.2;
					const phase = (pct * Math.PI * 4) + (this.angleOffset * 4);

					x = waveX;
					y = centerY + Math.sin(phase) * helixHeight * (1 + amp * 0.8);
					emitAngle = Math.cos(phase) > 0 ? -Math.PI / 2 : Math.PI / 2;
					break;
				}

				case 'wave':
				default: {
					const waveWidth = width * 0.8;
					x = (width * 0.1) + (pct * waveWidth);
					y = (height * 0.85) - (amp * height * 0.5);
					emitAngle = -Math.PI / 2;
					break;
				}
			}

			emissionPoints.push({ x, y, angle: emitAngle, amp, index: i });
		}

		// 5. Dual-Layer Particle Spawning Strategy

		for (let i = 0; i < emissionPoints.length; i++) {
			const pt = emissionPoints[i];
			const colorIndex = Math.floor((i / emissionPoints.length) * themePalette.length);
			const color = themePalette[colorIndex % themePalette.length];

			// A. ALWAYS VISIBLE SHAPE OUTLINE:
			// Every frame, spawn 1 particle at every point along the shape (probabilistic rate to control density)
			if (Math.random() < 0.6 && this.particles.length < this.maxParticles) {
				this.particles.push(new Particle(pt.x, pt.y, pt.angle, color));
			}

			// B. RHYTHM & SPECTRUM BEAT BURSTS:
			// Spawn extra particles on audio peaks OR on beat transients
			let extraBurst = 0;

			if (pt.amp > 0.15) {
				extraBurst += Math.floor(pt.amp * 3); // Frequency peak burst
			}

			if (isBeat) {
				extraBurst += 2; // Global rhythm beat burst across all points
			}

			for (let b = 0; b < extraBurst; b++) {
				if (this.particles.length >= this.maxParticles) break;

				// Add slight spatial jitter for rhythmic bursts
				const jitterX = pt.x + (Math.random() - 0.5) * 6;
				const jitterY = pt.y + (Math.random() - 0.5) * 6;
				this.particles.push(new Particle(jitterX, jitterY, pt.angle, color));
			}
		}

		// 6. Update and Draw Particles
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