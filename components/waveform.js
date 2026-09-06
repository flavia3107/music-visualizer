export class WaveformCurveVisualizer {
	constructor() {
		this.smoothedData = new Float32Array(0);
		this.beatEnergy = 0;
	}

	draw(ctx, data = new Uint8Array(0), bounds = {}, colors = {}) {
		if (!ctx || !bounds.width || !bounds.height) return;

		const { width, height, centerY = height / 2 } = bounds;

		const primary = colors.primary || 'hsla(195, 100%, 50%, 1)';
		const secondary = colors.secondary || 'hsla(320, 100%, 55%, 1)';
		const accent = colors.accent || 'hsla(45, 100%, 50%, 1)';
		const mutedPrimary = colors.mutedPrimary || 'hsla(195, 45%, 45%, 0.25)';
		const mutedSecondary = colors.mutedSecondary || 'hsla(320, 45%, 50%, 0.25)';

		ctx.save();
		ctx.clearRect(0, 0, width, height);
		ctx.globalCompositeOperation = 'lighter';

		// 1. Center Axis Line
		ctx.beginPath();
		ctx.moveTo(0, centerY);
		ctx.lineTo(width, centerY);
		ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
		ctx.lineWidth = 0.75;
		ctx.setLineDash([3, 3]);
		ctx.stroke();
		ctx.setLineDash([]);

		// 2. Gradients
		const strokeGradient = ctx.createLinearGradient(0, 0, width, 0);
		strokeGradient.addColorStop(0.0, primary);
		strokeGradient.addColorStop(0.5, accent);
		strokeGradient.addColorStop(1.0, secondary);

		const fillGradient = ctx.createLinearGradient(0, 0, width, 0);
		fillGradient.addColorStop(0.0, mutedPrimary);
		fillGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)');
		fillGradient.addColorStop(1.0, mutedSecondary);

		// 3. Audio Processing & Beat Detection
		const hasData = data && data.length > 0;
		const numPoints = 80; // Smooth resolution across width

		if (this.smoothedData.length !== numPoints) {
			this.smoothedData = new Float32Array(numPoints);
		}

		let instantBass = 0;

		if (hasData) {
			// Sample lower spectrum for overall beat impact
			const bassBins = Math.max(1, Math.floor(data.length * 0.15));
			let bassSum = 0;
			for (let i = 0; i < bassBins; i++) bassSum += data[i];
			instantBass = (bassSum / bassBins) / 255;

			// Map standard audio frequency spectrum across points
			const activeBins = Math.floor(data.length * 0.65); // Use audible spectrum

			for (let i = 0; i < numPoints; i++) {
				const normalizedX = i / (numPoints - 1);

				// Map position to frequency data index
				const floatIndex = normalizedX * (activeBins - 1);
				const idxLower = Math.floor(floatIndex);
				const idxUpper = Math.min(idxLower + 1, activeBins - 1);
				const frac = floatIndex - idxLower;

				// Interpolate value between adjacent bins
				const val = (data[idxLower] * (1 - frac) + data[idxUpper] * frac) / 255;

				// Exaggerate peaks exponentially (audio dynamics feel punchier)
				const targetAmp = Math.pow(val, 1.6);

				// Smooth frame-to-frame jitter (0.35 = fast, snappy response)
				this.smoothedData[i] += (targetAmp - this.smoothedData[i]) * 0.35;
			}
		} else {
			// Decay points smoothly to baseline when stopped/paused
			for (let i = 0; i < numPoints; i++) {
				this.smoothedData[i] *= 0.85;
			}
		}

		// Fast-attack beat energy for glow intensity
		if (instantBass > this.beatEnergy) {
			this.beatEnergy = instantBass;
		} else {
			this.beatEnergy += (instantBass - this.beatEnergy) * 0.15;
		}

		const isPlaying = hasData && this.beatEnergy > 0.01;
		const step = width / (numPoints - 1);
		const wavePoints = [];

		// 4. Generate Peak Wave Points directly from Audio Data
		for (let i = 0; i < numPoints; i++) {
			const x = i * step;
			const normalizedX = i / (numPoints - 1);

			// Alternating directions (+1, -1, +1, -1) create true crests & troughs
			const direction = (i % 2 === 0) ? -1 : 1;

			// Taper ends gracefully at screen borders
			const envelope = Math.sin(normalizedX * Math.PI);

			const amp = this.smoothedData[i];
			const maxAmplitude = height * 0.42;

			const y = centerY + (direction * amp * maxAmplitude * envelope);
			wavePoints.push({ x, y });
		}

		const buildWavePath = () => {
			ctx.beginPath();
			ctx.moveTo(wavePoints[0].x, wavePoints[0].y);
			for (let i = 0; i < wavePoints.length - 1; i++) {
				const xc = (wavePoints[i].x + wavePoints[i + 1].x) / 2;
				const yc = (wavePoints[i].y + wavePoints[i + 1].y) / 2;
				ctx.quadraticCurveTo(wavePoints[i].x, wavePoints[i].y, xc, yc);
			}
		};

		// 5. Translucent Area Fill
		if (isPlaying) {
			ctx.save();
			ctx.beginPath();
			ctx.moveTo(wavePoints[0].x, centerY);
			for (let i = 0; i < wavePoints.length - 1; i++) {
				const xc = (wavePoints[i].x + wavePoints[i + 1].x) / 2;
				const yc = (wavePoints[i].y + wavePoints[i + 1].y) / 2;
				ctx.quadraticCurveTo(wavePoints[i].x, wavePoints[i].y, xc, yc);
			}
			ctx.lineTo(width, centerY);
			ctx.closePath();
			ctx.fillStyle = fillGradient;
			ctx.fill();
			ctx.restore();
		}

		// 6. Glow Pass (Pulsing Blur on Beat)
		ctx.save();
		buildWavePath();
		ctx.strokeStyle = strokeGradient;
		ctx.lineWidth = 3;
		ctx.shadowColor = secondary;
		ctx.shadowBlur = isPlaying ? 8 + this.beatEnergy * 25 : 0;
		ctx.stroke();
		ctx.restore();

		// 7. Crisp Core Line
		ctx.save();
		buildWavePath();
		ctx.strokeStyle = strokeGradient;
		ctx.lineWidth = 1.5;
		ctx.shadowColor = primary;
		ctx.shadowBlur = isPlaying ? 4 : 0;
		ctx.stroke();
		ctx.restore();

		ctx.restore();
	}
}
// make the line shorter
// make it more visible the highs and lows
