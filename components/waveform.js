export class WaveformCurveVisualizer {
	constructor() {
		this.phase = 0;
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

		// 3. Audio & Beat Energy Detection
		const hasData = data && data.length > 0;
		let instantBass = 0;

		if (hasData) {
			// Sample kick/bass frequencies (~10% of spectrum)
			const bassBins = Math.max(1, Math.floor(data.length * 0.1));
			let bassSum = 0;
			for (let i = 0; i < bassBins; i++) {
				bassSum += data[i];
			}
			instantBass = (bassSum / bassBins) / 255;
		}

		// Fast Attack (instant reaction to beat), Slow Decay (smooth fade out)
		if (instantBass > this.beatEnergy) {
			this.beatEnergy = instantBass; // Snap immediately to kick drum beat
		} else {
			this.beatEnergy += (instantBass - this.beatEnergy) * 0.15; // Smooth release
		}

		const isPlaying = hasData && this.beatEnergy > 0.01;

		// Advance phase dynamically: baseline speed + burst on beats
		if (isPlaying) {
			this.phase += 0.02 + this.beatEnergy * 0.06;
		}

		const points = 120;
		const step = width / (points - 1);
		const wavePoints = [];

		// Focus frequency sampling on active audible spectrum (lower ~70%)
		const activeBins = hasData ? Math.floor(data.length * 0.7) : 0;

		for (let i = 0; i < points; i++) {
			const x = i * step;
			const normalizedX = i / (points - 1);

			if (isPlaying && activeBins > 0) {
				// Map position along wave directly to frequency data bin
				const dataIndex = Math.floor(normalizedX * (activeBins - 1));
				const frequencyAmp = data[dataIndex] / 255;

				// Taper curve ends gracefully at canvas left/right borders
				const envelope = Math.sin(normalizedX * Math.PI);

				// Single clean sine wave modulated directly by live audio frequency
				const sineWave = Math.sin(normalizedX * Math.PI * 4 + this.phase);

				// Combine base sine movement with live beat/frequency reaction
				const displacement = sineWave * (height * 0.35) * (frequencyAmp * 0.7 + this.beatEnergy * 0.3);

				const y = centerY + displacement * envelope;
				wavePoints.push({ x, y });
			} else {
				wavePoints.push({ x, y: centerY });
			}
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

		// 4. Translucent Area Fill
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

		// 5. Glow Pass (Pulses intensely on beats)
		ctx.save();
		buildWavePath();
		ctx.strokeStyle = strokeGradient;
		ctx.lineWidth = 3;
		ctx.shadowColor = secondary;
		ctx.shadowBlur = isPlaying ? 8 + this.beatEnergy * 25 : 0;
		ctx.stroke();
		ctx.restore();

		// 6. Crisp Core Line
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