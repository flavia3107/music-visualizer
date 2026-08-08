import { Particle } from './particle.js';

export class RadialBarsVisualizer {
	constructor() {
		this.config = { barCount: 160, minBarHeight: 0 };
		this.RING_SPACING_FACTORS = [0.18, 0.24, 0.38, 0.50, 0.64, 0.74, 0.84, 0.95];
		this.particles = [];
		this.simRotation = 0;

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
			const wave1 = Math.sin(norm * Math.PI * 4 + this.simRotation * 2) * 50;
			const wave2 = Math.cos(norm * Math.PI * 2 - this.simRotation * 1.5) * 40;
			const peak = Math.exp(-Math.pow((norm - 0.25) * 6, 2)) * 120;
			const val = Math.max(0, wave1 + wave2 + peak + (Math.random() * 8));
			raw[i] = Math.min(255, val);
		}
		this.simRotation += 0.012;

		const smoothed = new Uint8Array(bufferLength);
		for (let i = 0; i < bufferLength; i++) {
			const prev = raw[(i - 1 + bufferLength) % bufferLength];
			const curr = raw[i];
			const next = raw[(i + 1) % bufferLength];
			smoothed[i] = (prev * 0.25) + (curr * 0.5) + (next * 0.25);
		}
		return smoothed;
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

	draw(ctx, rect, metrics) {
		ctx.clearRect(0, 0, rect.width, rect.height);

		const audioData = this._getSimulatedAudioData(this.config.barCount);
		const intensity = audioData[0] / 255;
		const minDimension = Math.min(rect.width, rect.height);
		const maxOuterRadius = minDimension * 0.44;
		const ring8Factor = this.RING_SPACING_FACTORS[this.RING_SPACING_FACTORS.length - 1];
		const baseInnerRadius = maxOuterRadius * 0.72;
		const dynamicRing8Radius = baseInnerRadius * ring8Factor * (0.97 + intensity * 0.05);
		const dynamicMaxBarHeight = maxOuterRadius * 0.35;
		const dynamicMinBarHeight = this.config.minBarHeight;

		ctx.save();
		ctx.translate(metrics.centerX, metrics.centerY);

		this.RING_SPACING_FACTORS.forEach((factor, index) => {
			const ringNumber = index + 1;
			const baseRadius = baseInnerRadius * factor;
			const currentRadius = baseRadius * (0.97 + intensity * 0.05);

			ctx.strokeStyle = this._getRingGradient(ctx, ringNumber, currentRadius);
			ctx.lineWidth = (ringNumber % 2 === 1) ? 3 : 1.5;

			if ([1, 3, 5, 8].includes(ringNumber)) {
				ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';
				ctx.shadowBlur = 8 + (intensity * 10);
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
				ctx.shadowBlur = 8 + (intensity * 10);
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

		const circum = dynamicRing8Radius * Math.PI * 2;
		const barWidth = Math.max(1.8, (circum / this.config.barCount) * 0.55);

		for (let i = 0; i < this.config.barCount; i++) {
			const value = audioData[i];
			if (value < 2) continue;

			const progress = i / this.config.barCount;
			const angle = progress * Math.PI * 2;
			const barHeight = dynamicMinBarHeight + (value / 255) * dynamicMaxBarHeight;
			const startX = Math.cos(angle) * dynamicRing8Radius;
			const startY = Math.sin(angle) * dynamicRing8Radius;
			const endX = Math.cos(angle) * (dynamicRing8Radius + barHeight);
			const endY = Math.sin(angle) * (dynamicRing8Radius + barHeight);
			const color = this._getPureBarColor(angle);

			ctx.strokeStyle = color;
			ctx.shadowColor = color;
			ctx.shadowBlur = 4 + ((value / 255) * 6);
			ctx.lineWidth = barWidth;
			ctx.lineCap = 'round';
			ctx.beginPath();
			ctx.moveTo(startX, startY);
			ctx.lineTo(endX, endY);
			ctx.stroke();

			if (value > 60 && Math.random() < 0.25) {
				this.particles.push(new Particle(endX, endY, angle, color));
			}
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