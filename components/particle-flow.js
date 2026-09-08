import { Particle } from './particle.js';

export class ParticleFlowVisualizer {
	constructor() {
		this.particles = [];
		this.smoothedData = new Float32Array(0);
		this.maxParticles = 1200; // Increased cap for dense, fiery flame volume

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

		// Anchor baseline near the bottom edge like a bed of fire
		const baselineY = height * 0.95;

		// 1. Clear frame
		ctx.save();
		ctx.clearRect(0, 0, width, height);

		// 2. Resolve Dynamic Fire Palette (White Core -> Yellow -> Orange -> Deep Red)
		let themePalette = [];
		if (Array.isArray(colors.palette) && colors.palette.length > 0) {
			themePalette = colors.palette;
		} else {
			themePalette = ['#ffffff', '#ffeb3b', '#ff9800', '#ff3d00', '#dd2c00'];
		}

		const numHalfPoints = 32;
		const numTotalPoints = numHalfPoints * 2 - 1;

		if (this.smoothedData.length !== numHalfPoints) {
			this.smoothedData = new Float32Array(numHalfPoints);
		}

		// 3. Audio Frequency Processing (Symmetrical Bass Center for Big Middle Flame)
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

				// High exponent makes big bass hits explode like a flame flare
				let targetAmp = Math.pow(rawVal, 1.7);
				const rate = targetAmp > this.smoothedData[i] ? 0.5 : 0.18; // Fast rise, warm slow cooling decay
				this.smoothedData[i] += (targetAmp - this.smoothedData[i]) * rate;
			}
		} else {
			for (let i = 0; i < numHalfPoints; i++) {
				this.smoothedData[i] *= 0.88;
			}
		}

		// 4. Compute Flame Origin Nodes
		this.phase += 0.04; // Flame turbulence speed
		const wavePoints = new Array(numTotalPoints);
		const drawWidth = width * 0.95;
		const halfWidth = drawWidth / 2;
		const step = halfWidth / (numHalfPoints - 1);
		const maxFlameHeight = height * 0.7;

		for (let i = 0; i < numHalfPoints; i++) {
			const amp = Math.min(1.0, Math.max(0.02, this.smoothedData[i]));

			// Thermal flicker noise
			const flicker = (Math.sin(this.phase + i * 0.5) * 4) + (Math.cos(this.phase * 1.5 + i) * 3);
			const y = baselineY - (amp * maxFlameHeight) + flicker;

			const xOffset = i * step;
			const centerIdx = numHalfPoints - 1;

			// Upward vertical heat trajectory with slight outward draft away from center
			const outwardDraft = (i / numHalfPoints) * 0.2;
			const angleLeft = -Math.PI / 2 - outwardDraft;
			const angleRight = -Math.PI / 2 + outwardDraft;

			wavePoints[centerIdx + i] = { x: centerX + xOffset, y, amp, angle: angleRight, index: i };
			wavePoints[centerIdx - i] = { x: centerX - xOffset, y, amp, angle: angleLeft, index: i };
		}

		// NOTE: No line/stroke rendering here! Pure particle combustion.

		// 5. Fire Particle Generation
		if (hasData) {
			for (let i = 0; i < wavePoints.length; i++) {
				const pt = wavePoints[i];

				// A. Base Ember Bed: Continuous glowing embers across the whole bottom bed
				if (Math.random() < 0.6 && this.particles.length < this.maxParticles) {
					// Pick warmer colors (red/orange) for background embers
					const emberColor = themePalette[Math.min(themePalette.length - 1, 2 + Math.floor(Math.random() * 3))];

					const p = new Particle(pt.x, baselineY, pt.angle, emberColor);

					// Modify velocity for rising fire dynamics
					p.vy = -1.0 - (Math.random() * 2.0);
					p.vx = (Math.random() - 0.5) * 1.2;
					p.decay = 0.02 + Math.random() * 0.02; // Soft fade

					this.particles.push(p);
				}

				// B. Audio Flame Flares: Intense white/yellow bursts shooting up on music peaks
				if (pt.amp > 0.08) {
					const burstCount = Math.floor(pt.amp * 5);

					for (let s = 0; s < burstCount; s++) {
						if (this.particles.length >= this.maxParticles) break;

						// Hotter intensity (white/yellow) at the core of high peaks
						const colorIdx = Math.floor(Math.random() * Math.min(3, themePalette.length));
						const flameColor = themePalette[colorIdx];

						const spawnX = pt.x + (Math.random() - 0.5) * 12;
						const spawnY = pt.y + (Math.random() - 0.5) * 10;

						const p = new Particle(spawnX, spawnY, pt.angle, flameColor);

						// Stronger audio peaks blast particles higher with faster upward velocity
						p.vy = -(2.5 + (pt.amp * 4.5) + (Math.random() * 2.0));
						p.vx += (Math.random() - 0.5) * 1.5;
						p.decay = 0.015 + Math.random() * 0.02;

						this.particles.push(p);
					}
				}
			}
		}

		// 6. Update and Render Fire Particles
		for (let i = this.particles.length - 1; i >= 0; i--) {
			const p = this.particles[i];

			// Thermal buoyancy: simulate heat rising & turbulence draft
			p.vy -= 0.05; // Accelerate upward
			p.vx += (Math.random() - 0.5) * 0.2; // Heat turbulence shaking

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