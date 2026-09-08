export class SpectralPeakVisualizer {
	constructor() {
		this.smoothedData = new Float32Array(0);
		this.beatEnergy = 0;
	}

	draw(ctx, data = new Uint8Array(0), bounds = {}, colors = {}) {
		if (!ctx || !bounds.width || !bounds.height) return;

		const { width, height } = bounds;
		const paddingX = width * 0.05;
		const drawWidth = width - (paddingX * 2);
		const baselineY = height * 0.92;
		const maxWaveHeight = height * 0.75;

		ctx.save();
		ctx.clearRect(0, 0, width, height);

		// 1. Resolve Dynamic Theme Colors
		let themePalette = [];

		if (Array.isArray(colors.palette) && colors.palette.length > 0) {
			// Uses theme palette array if provided (e.g. ['#ff0055', '#00e5ff', '#7000ff'])
			themePalette = colors.palette;
		} else {
			// Collects individual color keys or falls back to standard defaults
			const colorList = [
				colors.primary,
				colors.secondary,
				colors.accent,
				colors.highlight,
				colors.muted
			].filter(Boolean);

			themePalette = colorList.length >= 2
				? colorList
				: ['#ff7e5f', '#feb47b', '#41e296', '#00d2ff', '#3a7bd5', '#9b51e0', '#ff416c'];
		}

		const numPoints = 48;
		if (this.smoothedData.length !== numPoints) {
			this.smoothedData = new Float32Array(numPoints);
		}

		const hasData = data && data.length > 0;

		if (hasData) {
			const activeBins = Math.floor(data.length * 0.75);

			for (let i = 0; i < numPoints; i++) {
				const normalizedX = i / (numPoints - 1);

				// Logarithmic frequency sampling
				const logIndex = Math.pow(normalizedX, 1.2) * (activeBins - 1);
				const idxLower = Math.floor(logIndex);
				const idxUpper = Math.min(idxLower + 1, activeBins - 1);
				const frac = logIndex - idxLower;
				const rawVal = (data[idxLower] * (1 - frac) + data[idxUpper] * frac) / 255;

				let targetAmp = Math.pow(rawVal, 1.8);

				if (normalizedX > 0.6) {
					targetAmp *= 1.25;
				}

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

		for (let i = 0; i < numPoints; i++) {
			const x = paddingX + i * step;
			const amp = Math.min(1.0, Math.max(0.02, this.smoothedData[i]));
			const y = baselineY - (amp * maxWaveHeight);
			wavePoints.push({ x, y });
		}

		// 2. Build Dynamic Linear Horizontal Gradient from Theme Colors
		const strokeGradient = ctx.createLinearGradient(paddingX, 0, paddingX + drawWidth, 0);
		const stopStep = 1 / (themePalette.length - 1 || 1);

		themePalette.forEach((color, index) => {
			const stop = Math.min(1.0, index * stopStep);
			strokeGradient.addColorStop(stop, color);
		});

		// 3. Build Vertical Fade Gradient
		const fillGradient = ctx.createLinearGradient(0, baselineY - maxWaveHeight, 0, baselineY);
		fillGradient.addColorStop(0.00, 'rgba(255, 255, 255, 0.35)');
		fillGradient.addColorStop(0.60, 'rgba(255, 255, 255, 0.10)');
		fillGradient.addColorStop(1.00, 'rgba(0, 0, 0, 0.00)');

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

		// Render Shaded Area with Dynamic Theme Tint
		ctx.save();
		buildCurvePath();
		ctx.lineTo(paddingX + drawWidth, baselineY);
		ctx.lineTo(paddingX, baselineY);
		ctx.closePath();

		ctx.fillStyle = fillGradient;
		ctx.fill();

		// Composite horizontal theme colors onto the fill mask
		ctx.fillStyle = strokeGradient;
		ctx.globalCompositeOperation = 'source-atop';
		ctx.globalAlpha = 0.5;
		ctx.fillRect(0, 0, width, height);
		ctx.restore();

		// Outer Glow Line using Primary Theme Colors
		ctx.save();
		buildCurvePath();
		ctx.strokeStyle = strokeGradient;
		ctx.lineWidth = 4;
		ctx.shadowColor = themePalette[0] || 'rgba(255, 255, 255, 0.5)';
		ctx.shadowBlur = 10;
		ctx.stroke();
		ctx.restore();

		// Crisp Inner Line
		ctx.save();
		buildCurvePath();
		ctx.strokeStyle = strokeGradient;
		ctx.lineWidth = 2.5;
		ctx.stroke();
		ctx.restore();

		ctx.restore();
	}
}