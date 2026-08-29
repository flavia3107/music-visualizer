import { Particle } from './particle.js';
import { RING_GRADIENT_STOPS } from '../config/visualizers.js'

export class RadialBarsVisualizer {
	constructor() {
		this.config = { barCount: 160, minBarHeight: 2, minRenderHeight: 5 };
		this.RING_SPACING_FACTORS = [0.18, 0.24, 0.38, 0.50, 0.64, 0.74, 0.84, 0.95];
		this.particles = [];
		this.smoothedHeights = new Float32Array(this.config.barCount);
	}

	_getThemeColors(colors = {}) {
		return {
			primary: colors.primary || colors.blue || 'hsla(195, 100%, 50%, 1)',
			mutedPrimary: colors.mutedPrimary || colors.dullBlue || 'hsla(195, 45%, 45%, 0.7)',
			secondary: colors.secondary || colors.pink || 'hsla(320, 100%, 55%, 1)',
			mutedSecondary: colors.mutedSecondary || colors.dullPink || 'hsla(320, 45%, 50%, 0.7)',
			accent: colors.accent || colors.yellow || 'hsla(45, 100%, 50%, 1)',
			transparent: colors.transparent || 'hsla(0, 0%, 0%, 0)'
		};
	}

	_processAudioData(inputData, targetLength) {
		if (!inputData?.length) return new Uint8Array(targetLength);

		const inputLen = inputData.length;
		const rawBands = new Float32Array(targetLength);
		const spatialBands = new Float32Array(targetLength);

		for (let i = 0; i < targetLength; i++) {
			const angle = (i / targetLength) * Math.PI * 2;
			const u = Math.abs(Math.sin(angle));
			const fftIdx = Math.floor(Math.pow(u, 1.1) * (inputLen * 0.45));
			const rawVal = (inputData[fftIdx] || 0) / 255;
			const contrastVal = Math.pow(rawVal, 2.0) * 1.4 * (0.65 + 0.35 * u);
			rawBands[i] = Math.min(1.0, contrastVal);
		}

		for (let i = 0; i < targetLength; i++) {
			const prev = rawBands[(i - 1 + targetLength) % targetLength];
			const curr = rawBands[i];
			const next = rawBands[(i + 1) % targetLength];
			spatialBands[i] = prev * 0.25 + curr * 0.50 + next * 0.25;
		}

		const output = new Uint8Array(targetLength);
		for (let i = 0; i < targetLength; i++) {
			const target = spatialBands[i];
			const curr = this.smoothedHeights[i];
			const lerpFactor = target > curr ? 0.85 : 0.28;
			this.smoothedHeights[i] += (target - curr) * lerpFactor;
			output[i] = Math.floor(this.smoothedHeights[i] * 255);
		}

		return output;
	}

	_getRingGradient(ctx, ringNumber, radius, palette) {
		const grad = ctx.createLinearGradient(-radius, 0, radius, 0);
		const stops = RING_GRADIENT_STOPS[ringNumber] || [[0, 'primary'], [1, 'secondary']];

		for (const [offset, colorKey] of stops) {
			grad.addColorStop(offset, palette[colorKey]);
		}
		return grad;
	}

	_getPureBarColor(angle, palette) {
		const cosVal = Math.cos(angle);
		const sinVal = Math.sin(angle);
		if (Math.abs(sinVal) > 0.82) return palette.secondary;
		return cosVal < 0 ? palette.primary : palette.accent;
	}

	draw(ctx, rawAudioData, metrics, colors) {
		const palette = this._getThemeColors(colors);
		ctx.clearRect(0, 0, metrics.width, metrics.height);

		const isAudioActive = Boolean(rawAudioData?.length);
		const audioData = this._processAudioData(rawAudioData, this.config.barCount);
		let bassSum = 0;
		for (let i = 0; i < 12; i++) bassSum += audioData[i];
		const bassIntensity = bassSum / (12 * 255);
		const minDimension = Math.min(metrics.width, metrics.height);
		const maxOuterRadius = minDimension * 0.44;
		const baseInnerRadius = maxOuterRadius * 0.72;
		const ring8Factor = this.RING_SPACING_FACTORS.at(-1);
		const dynamicScale = 0.96 + bassIntensity * 0.08;
		const dynamicRing8Radius = baseInnerRadius * ring8Factor * dynamicScale;

		const dynamicMaxBarHeight = maxOuterRadius * 0.35;
		const dynamicMinBarHeight = this.config.minBarHeight;

		ctx.save();
		ctx.translate(metrics.centerX, metrics.centerY);

		this.RING_SPACING_FACTORS.forEach((factor, index) => {
			const ringNumber = index + 1;
			const currentRadius = baseInnerRadius * factor * dynamicScale;

			ctx.strokeStyle = this._getRingGradient(ctx, ringNumber, currentRadius, palette);
			ctx.lineWidth = ringNumber % 2 === 1 ? 3 : 1.5;

			if ([1, 3, 5, 8].includes(ringNumber)) {
				ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';
				ctx.shadowBlur = 6 + bassIntensity * 12;
			} else {
				ctx.shadowColor = 'transparent';
				ctx.shadowBlur = 0;
			}

			if (ringNumber === 7) {
				ctx.save();
				ctx.beginPath();
				ctx.rect(-currentRadius - 10, -currentRadius - 10, currentRadius + 10, (currentRadius + 10) * 2);
				ctx.clip();
				ctx.shadowColor = palette.primary;
				ctx.shadowBlur = 6 + bassIntensity * 12;

				ctx.beginPath();
				ctx.arc(0, 0, currentRadius, 0, Math.PI * 2);
				ctx.stroke();
				ctx.restore();
			} else {
				ctx.beginPath();
				ctx.arc(0, 0, currentRadius, 0, Math.PI * 2);
				ctx.stroke();
			}
		});

		const circum = dynamicRing8Radius * Math.PI * 2;
		const barWidth = Math.max(1.8, (circum / this.config.barCount) * 0.55);

		for (let i = 0; i < this.config.barCount; i++) {
			const normVal = audioData[i] / 255;
			const barHeight = dynamicMinBarHeight + normVal * dynamicMaxBarHeight;

			if (isAudioActive && barHeight < this.config.minRenderHeight) continue;

			const angle = (i / this.config.barCount) * Math.PI * 2;
			const cos = Math.cos(angle);
			const sin = Math.sin(angle);
			const startX = cos * dynamicRing8Radius;
			const startY = sin * dynamicRing8Radius;
			const endX = cos * (dynamicRing8Radius + barHeight);
			const endY = sin * (dynamicRing8Radius + barHeight);
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

			if (isAudioActive && normVal > 0.58 && Math.random() < 0.30) this.particles.push(new Particle(endX, endY, angle, color));
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