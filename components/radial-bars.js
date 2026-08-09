import { Particle } from './particle.js';

export class RadialBarsVisualizer {
	constructor() {
		this.config = { barCount: 160, minBarHeight: 3 };
		this.RING_SPACING_FACTORS = [0.18, 0.24, 0.38, 0.50, 0.64, 0.74, 0.84, 0.95];
		this.particles = [];
		this.simRotation = 0;

		// Dynamic height tracker for smooth transitions
		this.smoothedHeights = new Float32Array(this.config.barCount);

		// Color Constants
		this.COLOR_BLUE = 'hsla(195, 100%, 50%, 1)';
		this.COLOR_DULL_BLUE = 'hsla(195, 45%, 45%, 0.7)';
		this.COLOR_PINK = 'hsla(320, 100%, 55%, 1)';
		this.COLOR_DULL_PINK = 'hsla(320, 45%, 50%, 0.7)';
		this.COLOR_YELLOW = 'hsla(45, 100%, 50%, 1)';
		this.COLOR_TRANSPARENT = 'hsla(0, 0%, 0%, 0)';
	}

	_getSimulatedAudioData(bufferLength) {
		const raw = new Uint8Array(bufferLength);
		for (let i = 0; i < bufferLength; i++) {
			const norm = i / bufferLength;
			const kickBeat = Math.pow(Math.max(0, Math.sin(this.simRotation * 5)), 6) * 160;
			const wave1 = Math.sin(norm * Math.PI * 6 + this.simRotation * 3) * 60;
			const wave2 = Math.cos(norm * Math.PI * 3 - this.simRotation * 2) * 40;
			const val = Math.max(0, wave1 + wave2 + kickBeat + (Math.random() * 12));
			raw[i] = Math.min(255, val);
		}
		this.simRotation += 0.025;
		return raw;
	}

	/**
	 * Maps audio spectrum symmetrically across the vertical Y-axis.
	 * Guarantees left (blue) and right (yellow) sides mirror each other perfectly.
	 */
	_processAudioData(inputData, targetLength) {
		if (!inputData || inputData.length === 0) {
			return this._getSimulatedAudioData(targetLength);
		}

		const rawBands = new Float32Array(targetLength);
		const inputLen = inputData.length;

		for (let i = 0; i < targetLength; i++) {
			const angle = (i / targetLength) * Math.PI * 2;

			// Normalized distance from vertical center (0.0 at top/bottom, 1.0 at outer sides)
			const u = Math.abs(Math.cos(angle));

			// Map frequencies outwards from vertical center
			const fftIdx = Math.floor(Math.pow(u, 1.2) * (inputLen * 0.50));
			let rawVal = (inputData[fftIdx] || 0) / 255;

			// Apply equal dynamic scaling to both sides
			const contrastVal = Math.pow(rawVal, 2.2) * 1.6;
			rawBands[i] = Math.min(1.0, contrastVal);
		}

		// 3-tap spatial smoothing
		const spatialBands = new Float32Array(targetLength);
		for (let i = 0; i < targetLength; i++) {
			const prev = rawBands[(i - 1 + targetLength) % targetLength];
			const curr = rawBands[i];
			const next = rawBands[(i + 1) % targetLength];
			spatialBands[i] = (prev * 0.25) + (curr * 0.50) + (next * 0.25);
		}

		// Fast attack, smooth decay
		const output = new Uint8Array(targetLength);
		for (let i = 0; i < targetLength; i++) {
			const targetVal = spatialBands[i];
			const currentVal = this.smoothedHeights[i];

			if (targetVal > currentVal) {
				this.smoothedHeights[i] = currentVal + (targetVal - currentVal) * 0.85;
			} else {
				this.smoothedHeights[i] = currentVal - (currentVal - targetVal) * 0.28;
			}
			output[i] = Math.floor(this.smoothedHeights[i] * 255);
		}

		return output;
	}

	_getRingGradient(ctx, ringNumber, radius) {
		const grad = ctx.createLinearGradient(-radius, 0, radius, 0);
		switch (ringNumber) {
			case 1:
				grad.addColorStop(0.00, this.COLOR_BLUE);
				grad.addColorStop(0.50, this.COLOR_BLUE);
				grad.addColorStop(0.5001, this.COLOR_PINK);
				grad.addColorStop(1.00, this.COLOR_PINK);
				break;
			case 2:
				grad.addColorStop(0.00, this.COLOR_DULL_BLUE);
				grad.addColorStop(0.50, this.COLOR_DULL_BLUE);
				grad.addColorStop(0.5001, this.COLOR_DULL_PINK);
				grad.addColorStop(1.00, this.COLOR_DULL_PINK);
				break;
			case 3:
				grad.addColorStop(0.00, this.COLOR_PINK);
				grad.addColorStop(0.50, this.COLOR_PINK);
				grad.addColorStop(0.5001, this.COLOR_YELLOW);
				grad.addColorStop(1.00, this.COLOR_YELLOW);
				break;
			case 4:
				grad.addColorStop(0.00, this.COLOR_DULL_PINK);
				grad.addColorStop(0.50, this.COLOR_DULL_PINK);
				grad.addColorStop(0.5001, this.COLOR_DULL_BLUE);
				grad.addColorStop(1.00, this.COLOR_DULL_BLUE);
				break;
			case 5:
				grad.addColorStop(0.00, this.COLOR_PINK);
				grad.addColorStop(0.50, this.COLOR_PINK);
				grad.addColorStop(0.5001, this.COLOR_BLUE);
				grad.addColorStop(1.00, this.COLOR_BLUE);
				break;
			case 6:
				grad.addColorStop(0.00, this.COLOR_DULL_BLUE);
				grad.addColorStop(0.50, this.COLOR_DULL_BLUE);
				grad.addColorStop(0.5001, this.COLOR_TRANSPARENT);
				grad.addColorStop(1.00, this.COLOR_TRANSPARENT);
				break;
			case 7:
				grad.addColorStop(0.00, this.COLOR_BLUE);
				grad.addColorStop(0.50, this.COLOR_BLUE);
				grad.addColorStop(0.5001, this.COLOR_DULL_PINK);
				grad.addColorStop(1.00, this.COLOR_DULL_PINK);
				break;
			case 8:
				grad.addColorStop(0.00, this.COLOR_BLUE);
				grad.addColorStop(0.35, this.COLOR_BLUE);
				grad.addColorStop(0.45, this.COLOR_PINK);
				grad.addColorStop(0.55, this.COLOR_PINK);
				grad.addColorStop(0.65, this.COLOR_YELLOW);
				grad.addColorStop(1.00, this.COLOR_YELLOW);
				break;
			default:
				grad.addColorStop(0, this.COLOR_BLUE);
				grad.addColorStop(1, this.COLOR_PINK);
		}
		return grad;
	}

	_getPureBarColor(angle) {
		const cosVal = Math.cos(angle);
		const sinVal = Math.sin(angle);
		if (Math.abs(sinVal) > 0.82) return this.COLOR_PINK;
		return cosVal < 0 ? this.COLOR_BLUE : this.COLOR_YELLOW;
	}

	draw(ctx, rawAudioData, metrics) {
		ctx.clearRect(0, 0, metrics.width, metrics.height);

		const audioData = this._processAudioData(rawAudioData, this.config.barCount);

		let bassSum = 0;
		for (let i = 0; i < 12; i++) bassSum += audioData[i];
		const bassIntensity = bassSum / (12 * 255);

		const minDimension = Math.min(metrics.width, metrics.height);
		const maxOuterRadius = minDimension * 0.44;
		const ring8Factor = this.RING_SPACING_FACTORS[this.RING_SPACING_FACTORS.length - 1];
		const baseInnerRadius = maxOuterRadius * 0.72;
		const dynamicRing8Radius = baseInnerRadius * ring8Factor * (0.96 + bassIntensity * 0.08);

		const dynamicMaxBarHeight = maxOuterRadius * 0.35;
		const dynamicMinBarHeight = this.config.minBarHeight;

		ctx.save();
		ctx.translate(metrics.centerX, metrics.centerY);

		// Draw Rings
		this.RING_SPACING_FACTORS.forEach((factor, index) => {
			const ringNumber = index + 1;
			const baseRadius = baseInnerRadius * factor;
			const currentRadius = baseRadius * (0.96 + bassIntensity * 0.08);

			ctx.strokeStyle = this._getRingGradient(ctx, ringNumber, currentRadius);
			ctx.lineWidth = (ringNumber % 2 === 1) ? 3 : 1.5;

			if ([1, 3, 5, 8].includes(ringNumber)) {
				ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';
				ctx.shadowBlur = 6 + (bassIntensity * 12);
				ctx.beginPath();
				ctx.arc(0, 0, currentRadius, 0, Math.PI * 2);
				ctx.stroke();
			} else if (ringNumber === 7) {
				ctx.shadowColor = 'transparent';
				ctx.shadowBlur = 0;
				ctx.beginPath();
				ctx.arc(0, 0, currentRadius, 0, Math.PI * 2);
				ctx.stroke();

				ctx.save();
				ctx.beginPath();
				ctx.rect(-currentRadius - 10, -currentRadius - 10, currentRadius + 10, (currentRadius + 10) * 2);
				ctx.clip();

				ctx.shadowColor = this.COLOR_BLUE;
				ctx.shadowBlur = 6 + (bassIntensity * 12);
				ctx.beginPath();
				ctx.arc(0, 0, currentRadius, 0, Math.PI * 2);
				ctx.stroke();
				ctx.restore();
			} else {
				ctx.shadowColor = 'transparent';
				ctx.shadowBlur = 0;
				ctx.beginPath();
				ctx.arc(0, 0, currentRadius, 0, Math.PI * 2);
				ctx.stroke();
			}
		});

		// Draw Radial Bars
		const circum = dynamicRing8Radius * Math.PI * 2;
		const barWidth = Math.max(1.8, (circum / this.config.barCount) * 0.55);

		for (let i = 0; i < this.config.barCount; i++) {
			const value = audioData[i];
			const progress = i / this.config.barCount;
			const angle = progress * Math.PI * 2;
			const normVal = value / 255;

			const barHeight = dynamicMinBarHeight + normVal * dynamicMaxBarHeight;
			const startX = Math.cos(angle) * dynamicRing8Radius;
			const startY = Math.sin(angle) * dynamicRing8Radius;
			const endX = Math.cos(angle) * (dynamicRing8Radius + barHeight);
			const endY = Math.sin(angle) * (dynamicRing8Radius + barHeight);

			const color = this._getPureBarColor(angle);

			ctx.strokeStyle = color;
			ctx.shadowColor = color;
			ctx.shadowBlur = 2 + (normVal * 8);
			ctx.lineWidth = barWidth;
			ctx.lineCap = 'round';
			ctx.beginPath();
			ctx.moveTo(startX, startY);
			ctx.lineTo(endX, endY);
			ctx.stroke();

			// Burst particles on sharp beat hits
			if (normVal > 0.58 && Math.random() < 0.30) {
				this.particles.push(new Particle(endX, endY, angle, color));
			}
		}

		// Render Particle Physics
		for (let i = this.particles.length - 1; i >= 0; i--) {
			const p = this.particles[i];
			p.update();
			if (p.alpha <= 0) this.particles.splice(i, 1);
			else p.draw(ctx);
		}

		ctx.restore();
	}
}