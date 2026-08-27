import { Particle } from './particle.js';

export class RadialBarsVisualizer {
	constructor() {
		this.config = { barCount: 160, minBarHeight: 2, minRenderHeight: 5 };
		this.RING_SPACING_FACTORS = [0.18, 0.24, 0.38, 0.50, 0.64, 0.74, 0.84, 0.95];
		this.particles = [];
		this.simRotation = 0;
		this.smoothedHeights = new Float32Array(this.config.barCount);
	}

	_getThemeColors(colors = {}) {
		return {
			blue: colors.blue || colors.primary || 'hsla(195, 100%, 50%, 1)',
			dullBlue: colors.dullBlue || colors.secondary || 'hsla(195, 45%, 45%, 0.7)',
			pink: colors.pink || colors.accent || 'hsla(320, 100%, 55%, 1)',
			dullPink: colors.dullPink || 'hsla(320, 45%, 50%, 0.7)',
			yellow: colors.yellow || 'hsla(45, 100%, 50%, 1)',
			transparent: colors.transparent || 'hsla(0, 0%, 0%, 0)'
		};
	}

	_getSimulatedAudioData(bufferLength) {
		const raw = new Uint8Array(bufferLength);
		for (let i = 0; i < bufferLength; i++)  raw[i] = 0;
		return raw;
	}

	_processAudioData(inputData, targetLength) {
		if (!inputData || inputData.length === 0) return this._getSimulatedAudioData(targetLength);

		const rawBands = new Float32Array(targetLength);
		const inputLen = inputData.length;

		for (let i = 0; i < targetLength; i++) {
			const angle = (i / targetLength) * Math.PI * 2;
			const u = Math.abs(Math.sin(angle));

			const fftIdx = Math.floor(Math.pow(u, 1.1) * (inputLen * 0.45));
			let rawVal = (inputData[fftIdx] || 0) / 255;

			const verticalFactor = 0.65 + 0.35 * u;
			const contrastVal = Math.pow(rawVal, 2.0) * 1.4 * verticalFactor;

			rawBands[i] = Math.min(1.0, contrastVal);
		}

		const spatialBands = new Float32Array(targetLength);
		for (let i = 0; i < targetLength; i++) {
			const prev = rawBands[(i - 1 + targetLength) % targetLength];
			const curr = rawBands[i];
			const next = rawBands[(i + 1) % targetLength];
			spatialBands[i] = (prev * 0.25) + (curr * 0.50) + (next * 0.25);
		}

		const output = new Uint8Array(targetLength);
		for (let i = 0; i < targetLength; i++) {
			const targetVal = spatialBands[i];
			const currentVal = this.smoothedHeights[i];

			if (targetVal > currentVal) this.smoothedHeights[i] = currentVal + (targetVal - currentVal) * 0.85;
			else this.smoothedHeights[i] = currentVal - (currentVal - targetVal) * 0.28;
			output[i] = Math.floor(this.smoothedHeights[i] * 255);
		}

		return output;
	}

	_getRingGradient(ctx, ringNumber, radius, palette) {
		const grad = ctx.createLinearGradient(-radius, 0, radius, 0);
		switch (ringNumber) {
			case 1:
				grad.addColorStop(0.00, palette.blue);
				grad.addColorStop(0.50, palette.blue);
				grad.addColorStop(0.5001, palette.pink);
				grad.addColorStop(1.00, palette.pink);
				break;
			case 2:
				grad.addColorStop(0.00, palette.dullBlue);
				grad.addColorStop(0.50, palette.dullBlue);
				grad.addColorStop(0.5001, palette.dullPink);
				grad.addColorStop(1.00, palette.dullPink);
				break;
			case 3:
				grad.addColorStop(0.00, palette.pink);
				grad.addColorStop(0.50, palette.pink);
				grad.addColorStop(0.5001, palette.yellow);
				grad.addColorStop(1.00, palette.yellow);
				break;
			case 4:
				grad.addColorStop(0.00, palette.dullPink);
				grad.addColorStop(0.50, palette.dullPink);
				grad.addColorStop(0.5001, palette.dullBlue);
				grad.addColorStop(1.00, palette.dullBlue);
				break;
			case 5:
				grad.addColorStop(0.00, palette.pink);
				grad.addColorStop(0.50, palette.pink);
				grad.addColorStop(0.5001, palette.blue);
				grad.addColorStop(1.00, palette.blue);
				break;
			case 6:
				grad.addColorStop(0.00, palette.dullBlue);
				grad.addColorStop(0.50, palette.dullBlue);
				grad.addColorStop(0.5001, palette.transparent);
				grad.addColorStop(1.00, palette.transparent);
				break;
			case 7:
				grad.addColorStop(0.00, palette.blue);
				grad.addColorStop(0.50, palette.blue);
				grad.addColorStop(0.5001, palette.dullPink);
				grad.addColorStop(1.00, palette.dullPink);
				break;
			case 8:
				grad.addColorStop(0.00, palette.blue);
				grad.addColorStop(0.35, palette.blue);
				grad.addColorStop(0.45, palette.pink);
				grad.addColorStop(0.55, palette.pink);
				grad.addColorStop(0.65, palette.yellow);
				grad.addColorStop(1.00, palette.yellow);
				break;
			default:
				grad.addColorStop(0, palette.blue);
				grad.addColorStop(1, palette.pink);
		}
		return grad;
	}

	_getPureBarColor(angle, palette) {
		const cosVal = Math.cos(angle);
		const sinVal = Math.sin(angle);
		if (Math.abs(sinVal) > 0.82) return palette.pink;
		return cosVal < 0 ? palette.blue : palette.yellow;
	}

	draw(ctx, rawAudioData, metrics, colors) {
		const palette = this._getThemeColors(colors);

		ctx.clearRect(0, 0, metrics.width, metrics.height);

		const isAudioActive = rawAudioData && rawAudioData.length > 0;
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

			ctx.strokeStyle = this._getRingGradient(ctx, ringNumber, currentRadius, palette);
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

				ctx.shadowColor = palette.blue;
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
			const normVal = value / 255;
			const barHeight = dynamicMinBarHeight + normVal * dynamicMaxBarHeight;

			if (isAudioActive && barHeight < this.config.minRenderHeight) continue;

			const progress = i / this.config.barCount;
			const angle = progress * Math.PI * 2;
			const startX = Math.cos(angle) * dynamicRing8Radius;
			const startY = Math.sin(angle) * dynamicRing8Radius;
			const endX = Math.cos(angle) * (dynamicRing8Radius + barHeight);
			const endY = Math.sin(angle) * (dynamicRing8Radius + barHeight);
			const color = this._getPureBarColor(angle, palette);

			ctx.save();
			ctx.strokeStyle = color;
			ctx.shadowColor = color;
			ctx.shadowBlur = 6;
			ctx.lineWidth = barWidth;
			ctx.lineCap = 'round';
			ctx.beginPath();
			ctx.moveTo(startX, startY);
			ctx.lineTo(endX, endY);
			ctx.stroke();
			ctx.restore();

			if (isAudioActive && normVal > 0.58 && Math.random() < 0.30)
				this.particles.push(new Particle(endX, endY, angle, color));
		}

		for (let i = this.particles.length - 1; i >= 0; i--) {
			const p = this.particles[i];
			p.update();
			if (p.alpha <= 0) this.particles.splice(i, 1);
			else p.draw(ctx);
		}
		ctx.restore();
	}
}