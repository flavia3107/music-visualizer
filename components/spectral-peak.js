export class SpectralPeakVisualizer {
	constructor() {
		this.smoothedData = new Float32Array(0);
		this.peaks = new Float32Array(0);
		this.beatEnergy = 0;
	}

	draw(ctx, data = new Uint8Array(0), bounds = {}, colors = {}) {
		if (!ctx || !bounds.width || !bounds.height) return;

		const { width, height, centerY = height / 2 } = bounds;
		const primary = colors.primary || 'hsla(195, 100%, 50%, 1)';
		const secondary = colors.secondary || 'hsla(320, 100%, 55%, 1)';
		const accent = colors.accent || 'hsla(45, 100%, 50%, 1)';
		const mutedPrimary = colors.mutedPrimary || 'hsla(195, 45%, 45%, 0.35)';
		const mutedSecondary = colors.mutedSecondary || 'hsla(320, 45%, 50%, 0.35)';

		ctx.save();
		ctx.clearRect(0, 0, width, height);
		ctx.globalCompositeOperation = 'lighter';

		// 1. Shorter Wave Width Configuration (75% of container width)
		const waveWidthRatio = 0.75;
		const totalWaveWidth = width * waveWidthRatio;
		const startX = (width - totalWaveWidth) / 2;

		// Background Center Reference Dash Line
		ctx.beginPath();
		ctx.moveTo(startX, centerY);
		ctx.lineTo(startX + totalWaveWidth, centerY);
		ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
		ctx.lineWidth = 0.75;
		ctx.setLineDash([3, 3]);
		ctx.stroke();
		ctx.setLineDash([]);

		// Dynamic Gradients based on shortened bounds
		const strokeGradient = ctx.createLinearGradient(startX, 0, startX + totalWaveWidth, 0);
		strokeGradient.addColorStop(0.0, primary);
		strokeGradient.addColorStop(0.5, accent);
		strokeGradient.addColorStop(1.0, secondary);

		const fillGradient = ctx.createLinearGradient(startX, 0, startX + totalWaveWidth, 0);
		fillGradient.addColorStop(0.0, mutedPrimary);
		fillGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.08)');
		fillGradient.addColorStop(1.0, mutedSecondary);

		const hasData = data && data.length > 0;
		const numPoints = 80;

		if (this.smoothedData.length !== numPoints) {
			this.smoothedData = new Float32Array(numPoints);
			this.peaks = new Float32Array(numPoints);
		}

		let instantBass = 0;
		if (hasData) {
			// Bass Energy Calculation
			const bassBins = Math.max(1, Math.floor(data.length * 0.15));
			let bassSum = 0;
			for (let i = 0; i < bassBins; i++) bassSum += data[i];
			instantBass = (bassSum / bassBins) / 255;

			// Expanded active bin range for richer treble details
			const activeBins = Math.floor(data.length * 0.85);

			for (let i = 0; i < numPoints; i++) {
				const normalizedX = i / (numPoints - 1);

				// Logarithmic Indexing: gives high frequencies significantly more canvas resolution
				const logIndex = Math.pow(normalizedX, 1.3) * (activeBins - 1);
				const idxLower = Math.floor(logIndex);
				const idxUpper = Math.min(idxLower + 1, activeBins - 1);
				const frac = logIndex - idxLower;
				const val = (data[idxLower] * (1 - frac) + data[idxUpper] * frac) / 255;

				// High-contrast gamma curve (accentuates dynamic spikes / low drops)
				let targetAmp = Math.pow(val, 2.2) * 1.4;

				// Extra boost factor for high frequencies
				if (normalizedX > 0.6) {
					targetAmp *= 1.35;
				}

				// Dynamic interpolation rate (fast attack, natural falloff)
				const attackRate = targetAmp > this.smoothedData[i] ? 0.6 : 0.25;
				this.smoothedData[i] += (targetAmp - this.smoothedData[i]) * attackRate;

				// Peak memory tracking (holds transient high-energy spikes)
				if (this.smoothedData[i] > this.peaks[i]) {
					this.peaks[i] = this.smoothedData[i];
				} else {
					this.peaks[i] = Math.max(0, this.peaks[i] - 0.015);
				}
			}
		} else {
			for (let i = 0; i < numPoints; i++) {
				this.smoothedData[i] *= 0.82;
				this.peaks[i] *= 0.82;
			}
		}

		if (instantBass > this.beatEnergy) this.beatEnergy = instantBass;
		else this.beatEnergy += (instantBass - this.beatEnergy) * 0.15;

		const isPlaying = hasData && this.beatEnergy > 0.01;
		const step = totalWaveWidth / (numPoints - 1);

		const wavePoints = [];
		const peakPoints = [];

		for (let i = 0; i < numPoints; i++) {
			const x = startX + i * step;
			const normalizedX = i / (numPoints - 1);
			const direction = (i % 2 === 0) ? -1 : 1;
			const envelope = Math.sin(normalizedX * Math.PI);

			const maxAmplitude = height * 0.45;
			const amp = Math.min(this.smoothedData[i], 1.2);
			const peakAmp = Math.min(this.peaks[i], 1.25);

			const y = centerY + (direction * amp * maxAmplitude * envelope);
			const peakY = centerY + (direction * peakAmp * maxAmplitude * envelope);

			wavePoints.push({ x, y });
			peakPoints.push({ x, y: peakY, amp: peakAmp });
		}

		const buildWavePath = (points) => {
			ctx.beginPath();
			ctx.moveTo(points[0].x, points[0].y);
			for (let i = 0; i < points.length - 1; i++) {
				const xc = (points[i].x + points[i + 1].x) / 2;
				const yc = (points[i].y + points[i + 1].y) / 2;
				ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
			}
		};

		// 2. Wave Fill Area
		if (isPlaying) {
			ctx.save();
			ctx.beginPath();
			ctx.moveTo(wavePoints[0].x, centerY);
			for (let i = 0; i < wavePoints.length - 1; i++) {
				const xc = (wavePoints[i].x + wavePoints[i + 1].x) / 2;
				const yc = (wavePoints[i].y + wavePoints[i + 1].y) / 2;
				ctx.quadraticCurveTo(wavePoints[i].x, wavePoints[i].y, xc, yc);
			}
			ctx.lineTo(startX + totalWaveWidth, centerY);
			ctx.closePath();
			ctx.fillStyle = fillGradient;
			ctx.fill();
			ctx.restore();
		}

		// 3. Primary Wave Curve Pass
		ctx.save();
		buildWavePath(wavePoints);
		ctx.strokeStyle = strokeGradient;
		ctx.lineWidth = 2.5;
		ctx.shadowColor = secondary;
		ctx.shadowBlur = isPlaying ? 10 + this.beatEnergy * 28 : 0;
		ctx.stroke();
		ctx.restore();

		// 4. Floating Peak Markers Pass (highlights sharp bursts)
		if (isPlaying) {
			ctx.save();
			for (let i = 1; i < numPoints - 1; i++) {
				const pt = peakPoints[i];
				if (pt.amp > 0.18) {
					const alpha = Math.min(1, (pt.amp - 0.18) * 1.5);
					const size = Math.min(3.5, 1 + pt.amp * 2.5);

					ctx.beginPath();
					ctx.arc(pt.x, pt.y, size, 0, Math.PI * 2);
					ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(2)})`;
					ctx.shadowColor = accent;
					ctx.shadowBlur = 8;
					ctx.fill();
				}
			}
			ctx.restore();
		}

		ctx.restore();
	}
}