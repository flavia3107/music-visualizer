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
		const centerX = width / 2;
		const halfWidth = drawWidth / 2;
		const baselineY = height * 0.92;
		const maxWaveHeight = height * 0.75;

		ctx.save();
		ctx.clearRect(0, 0, width, height);

		// 1. Dynamic Theme Colors Setup
		let themePalette = [];

		if (Array.isArray(colors.palette) && colors.palette.length > 0) {
			themePalette = colors.palette;
		} else {
			const colorList = [
				colors.primary,
				colors.secondary,
				colors.accent,
				colors.highlight,
				colors.muted
			].filter(Boolean);

			themePalette = colorList.length >= 2
				? colorList
				: ['#ff416c', '#9b51e0', '#00d2ff', '#41e296', '#feb47b'];
		}

		const numHalfPoints = 28; // Points per side
		const numTotalPoints = numHalfPoints * 2 - 1; // Includes single center point

		if (this.smoothedData.length !== numHalfPoints) {
			this.smoothedData = new Float32Array(numHalfPoints);
		}

		const hasData = data && data.length > 0;

		if (hasData) {
			const activeBins = Math.floor(data.length * 0.75);

			for (let i = 0; i < numHalfPoints; i++) {
				// 0.0 at center, 1.0 at outer edges
				const normalizedDistance = i / (numHalfPoints - 1);

				// Logarithmic frequency sampling starting from center (bass) outwards (treble)
				const logIndex = Math.pow(normalizedDistance, 1.2) * (activeBins - 1);
				const idxLower = Math.floor(logIndex);
				const idxUpper = Math.min(idxLower + 1, activeBins - 1);
				const frac = logIndex - idxLower;
				const rawVal = (data[idxLower] * (1 - frac) + data[idxUpper] * frac) / 255;

				let targetAmp = Math.pow(rawVal, 1.8);

				if (normalizedDistance > 0.6) {
					targetAmp *= 1.25;
				}

				const rate = targetAmp > this.smoothedData[i] ? 0.45 : 0.2;
				this.smoothedData[i] += (targetAmp - this.smoothedData[i]) * rate;
			}
		} else {
			for (let i = 0; i < numHalfPoints; i++) {
				this.smoothedData[i] *= 0.85;
			}
		}

		// 2. Build Symmetrical Point Array (Left to Right)
		const wavePoints = new Array(numTotalPoints);
		const step = halfWidth / (numHalfPoints - 1);

		for (let i = 0; i < numHalfPoints; i++) {
			const amp = Math.min(1.0, Math.max(0.02, this.smoothedData[i]));
			const y = baselineY - (amp * maxWaveHeight);
			const xOffset = i * step;

			// Center index in the total array
			const centerIdx = numHalfPoints - 1;

			// Right side point
			wavePoints[centerIdx + i] = { x: centerX + xOffset, y };
			// Left side point (mirrored)
			wavePoints[centerIdx - i] = { x: centerX - xOffset, y };
		}

		// 3. Build Mirrored Gradient (Outer Left -> Center -> Outer Right)
		const strokeGradient = ctx.createLinearGradient(paddingX, 0, paddingX + drawWidth, 0);
		const stopsCount = themePalette.length;

		// Outer Left to Center
		themePalette.forEach((color, idx) => {
			const stop = (idx / (stopsCount - 1)) * 0.5;
			strokeGradient.addColorStop(stop, color);
		});

		// Center to Outer Right (Mirrored)
		for (let idx = stopsCount - 2; idx >= 0; idx--) {
			const normalizedIdx = (stopsCount - 1 - idx) / (stopsCount - 1);
			const stop = 0.5 + (normalizedIdx * 0.5);
			strokeGradient.addColorStop(Math.min(1.0, stop), themePalette[idx]);
		}

		// 4. Vertical Fade Gradient
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

		// Render Shaded Area
		ctx.save();
		buildCurvePath();
		ctx.lineTo(centerX + halfWidth, baselineY);
		ctx.lineTo(centerX - halfWidth, baselineY);
		ctx.closePath();

		ctx.fillStyle = fillGradient;
		ctx.fill();

		// Overlay horizontal palette tint onto fill
		ctx.fillStyle = strokeGradient;
		ctx.globalCompositeOperation = 'source-atop';
		ctx.globalAlpha = 0.5;
		ctx.fillRect(0, 0, width, height);
		ctx.restore();

		// Render Outer Glow Line
		ctx.save();
		buildCurvePath();
		ctx.strokeStyle = strokeGradient;
		ctx.lineWidth = 4;
		ctx.shadowColor = themePalette[0] || 'rgba(255, 255, 255, 0.5)';
		ctx.shadowBlur = 10;
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