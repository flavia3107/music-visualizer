export class WaveformCurveVisualizer {
	constructor() {
		this.phase = 0;
		this.bassEnergy = 0;
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

		// 3. Extract Kick/Bass Energy (Lower ~10% of frequency bins)
		const hasData = data && data.length > 0;
		let targetBass = 0;

		if (hasData) {
			const bassBins = Math.max(1, Math.floor(data.length * 0.12));
			let bassSum = 0;
			for (let i = 0; i < bassBins; i++) {
				bassSum += data[i];
			}
			targetBass = (bassSum / bassBins) / 255;
		}

		// Smooth physics interpolation (exponential decay on beats)
		this.bassEnergy += (targetBass - this.bassEnergy) * 0.2;

		// Drive phase speed and amplitude from beat intensity
		this.phase += 0.03 + this.bassEnergy * 0.08;

		const baseAmplitude = height * 0.05;
		const beatAmplitude = height * 0.35 * this.bassEnergy;
		const currentAmplitude = baseAmplitude + beatAmplitude;

		const points = 150;
		const step = width / (points - 1);
		const wavePoints = [];

		for (let i = 0; i < points; i++) {
			const x = i * step;
			const normalizedX = i / (points - 1);

			// Layer multiple harmonically linked sines for a natural, fluid curve
			const sin1 = Math.sin(normalizedX * Math.PI * 3 + this.phase);
			const sin2 = Math.sin(normalizedX * Math.PI * 6 - this.phase * 1.4) * 0.3;
			const sin3 = Math.cos(normalizedX * Math.PI * 1.5 + this.phase * 0.7) * 0.2;

			const envelope = Math.sin(normalizedX * Math.PI); // Window tapering at edges

			const y = centerY + (sin1 + sin2 + sin3) * currentAmplitude * envelope;
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

		// 4. Translucent Area Fill
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

		// 5. Glow Pass
		ctx.save();
		buildWavePath();
		ctx.strokeStyle = strokeGradient;
		ctx.lineWidth = 3;
		ctx.shadowColor = secondary;
		ctx.shadowBlur = 10 + this.bassEnergy * 20;
		ctx.stroke();
		ctx.restore();

		// 6. Crisp Core Line
		ctx.save();
		buildWavePath();
		ctx.strokeStyle = strokeGradient;
		ctx.lineWidth = 1.2;
		ctx.shadowColor = primary;
		ctx.shadowBlur = 4;
		ctx.stroke();
		ctx.restore();

		ctx.restore();
	}
}