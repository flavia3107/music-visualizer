export class SpectralPeakVisualizer {
	constructor() {
		this.smoothedData = new Float32Array(0);
		this.beatEnergy = 0;
	}

	draw(ctx, data = new Uint8Array(0), bounds = {}, colors = {}) {
		if (!ctx || !bounds.width || !bounds.height) return;

		const { width, height } = bounds;
		const paddingX = width * 0.05; // Margins on left and right
		const drawWidth = width - (paddingX * 2);
		const baselineY = height * 0.92; // Bottom baseline offset
		const maxWaveHeight = height * 0.75;

		ctx.save();
		ctx.clearRect(0, 0, width, height);

		const numPoints = 48; // Fewer points for smooth, organic peaks
		if (this.smoothedData.length !== numPoints) {
			this.smoothedData = new Float32Array(numPoints);
		}

		const hasData = data && data.length > 0;

		if (hasData) {
			const activeBins = Math.floor(data.length * 0.75);

			for (let i = 0; i < numPoints; i++) {
				const normalizedX = i / (numPoints - 1);

				// Logarithmic frequency sampling (enhances highs and mid response)
				const logIndex = Math.pow(normalizedX, 1.2) * (activeBins - 1);
				const idxLower = Math.floor(logIndex);
				const idxUpper = Math.min(idxLower + 1, activeBins - 1);
				const frac = logIndex - idxLower;
				const rawVal = (data[idxLower] * (1 - frac) + data[idxUpper] * frac) / 255;

				// Dynamic curve calculation
				let targetAmp = Math.pow(rawVal, 1.8);

				// Highs boost
				if (normalizedX > 0.6) {
					targetAmp *= 1.25;
				}

				// Smooth attack and decay
				const rate = targetAmp > this.smoothedData[i] ? 0.45 : 0.2;
				this.smoothedData[i] += (targetAmp - this.smoothedData[i]) * rate;
			}
		} else {
			for (let i = 0; i < numPoints; i++) {
				this.smoothedData[i] *= 0.85;
			}
		}

		const step = drawWidth / (numPoints - 1);
		const wavePoints = [];

		// Generate coordinates anchored to baseline
		for (let i = 0; i < numPoints; i++) {
			const x = paddingX + i * step;
			const amp = Math.min(1.0, Math.max(0.02, this.smoothedData[i]));
			const y = baselineY - (amp * maxWaveHeight);
			wavePoints.push({ x, y });
		}

		// 1. Rainbow Stroke Gradient (Left to Right)
		const strokeGradient = ctx.createLinearGradient(paddingX, 0, paddingX + drawWidth, 0);
		strokeGradient.addColorStop(0.00, colors.orange || '#ff7e5f');
		strokeGradient.addColorStop(0.20, colors.yellow || '#feb47b');
		strokeGradient.addColorStop(0.38, colors.green || '#41e296');
		strokeGradient.addColorStop(0.55, colors.cyan || '#00d2ff');
		strokeGradient.addColorStop(0.75, colors.blue || '#3a7bd5');
		strokeGradient.addColorStop(0.88, colors.purple || '#9b51e0');
		strokeGradient.addColorStop(1.00, colors.magenta || '#ff416c');

		// 2. Vertical Rainbow Fill Gradient (Top color opacity down to baseline)
		const fillGradient = ctx.createLinearGradient(0, baselineY - maxWaveHeight, 0, baselineY);
		fillGradient.addColorStop(0.00, 'rgba(255, 255, 255, 0.35)');
		fillGradient.addColorStop(0.50, 'rgba(65, 226, 150, 0.18)');
		fillGradient.addColorStop(1.00, 'rgba(10, 15, 30, 0.02)');

		// Helper path builder for smooth curve
		const buildCurvePath = () => {
			ctx.beginPath();
			ctx.moveTo(wavePoints[0].x, wavePoints[0].y);
			for (let i = 0; i < wavePoints.length - 1; i++) {
				const xc = (wavePoints[i].x + wavePoints[i + 1].x) / 2;
				const yc = (wavePoints[i].y + wavePoints[i + 1].y) / 2;
				ctx.quadraticCurveTo(wavePoints[i].x, wavePoints[i].y, xc, yc);
			}
			ctx.lineTo(wavePoints[wavePoints.length - 1].x, wavePoints[wavePoints.length - 1].y);
		};

		// Render Filled Area
		ctx.save();
		buildCurvePath();
		ctx.lineTo(paddingX + drawWidth, baselineY);
		ctx.lineTo(paddingX, baselineY);
		ctx.closePath();

		// Layer solid background fill + horizontal color tinting
		ctx.fillStyle = fillGradient;
		ctx.fill();
		ctx.fillStyle = strokeGradient;
		ctx.globalCompositeOperation = 'source-atop';
		ctx.globalAlpha = 0.45;
		ctx.fillRect(0, 0, width, height);
		ctx.restore();

		// Render Outer Glow Line
		ctx.save();
		buildCurvePath();
		ctx.strokeStyle = strokeGradient;
		ctx.lineWidth = 4;
		ctx.shadowColor = 'rgba(255, 255, 255, 0.4)';
		ctx.shadowBlur = 12;
		ctx.stroke();
		ctx.restore();

		// Render Sharp Inner Line
		ctx.save();
		buildCurvePath();
		ctx.strokeStyle = strokeGradient;
		ctx.lineWidth = 2.5;
		ctx.stroke();
		ctx.restore();

		ctx.restore();
	}
}