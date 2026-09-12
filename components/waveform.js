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
		const mutedPrimary = colors.mutedPrimary || 'hsla(195, 45%, 45%, 0.25)';
		const mutedSecondary = colors.mutedSecondary || 'hsla(320, 45%, 50%, 0.25)';

		ctx.save();
		ctx.clearRect(0, 0, width, height);

		ctx.save();
		ctx.globalCompositeOperation = 'source-over';
		ctx.beginPath();
		ctx.moveTo(0, centerY);
		ctx.lineTo(width, centerY);
		ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
		ctx.lineWidth = 0.75;
		ctx.setLineDash([3, 3]);
		ctx.stroke();
		ctx.restore();

		const strokeGradient = ctx.createLinearGradient(0, 0, width, 0);
		strokeGradient.addColorStop(0.0, primary);
		strokeGradient.addColorStop(0.4, primary);
		strokeGradient.addColorStop(0.6, secondary);
		strokeGradient.addColorStop(1.0, secondary);

		const fillGradient = ctx.createLinearGradient(0, 0, width, 0);
		fillGradient.addColorStop(0.0, mutedPrimary);
		fillGradient.addColorStop(0.4, mutedPrimary);
		fillGradient.addColorStop(0.6, mutedSecondary);
		fillGradient.addColorStop(1.0, mutedSecondary);

		const hasData = data && data.length > 0;
		const numPoints = 80;

		if (this.smoothedData.length !== numPoints) this.smoothedData = new Float32Array(numPoints);

		let instantBass = 0;
		if (hasData) {
			const bassBins = Math.max(1, Math.floor(data.length * 0.15));
			let bassSum = 0;
			for (let i = 0; i < bassBins; i++) bassSum += data[i];
			instantBass = (bassSum / bassBins) / 255;

			const activeBins = Math.floor(data.length * 0.65);
			for (let i = 0; i < numPoints; i++) {
				const normalizedX = i / (numPoints - 1);
				const floatIndex = normalizedX * (activeBins - 1);
				const idxLower = Math.floor(floatIndex);
				const idxUpper = Math.min(idxLower + 1, activeBins - 1);
				const frac = floatIndex - idxLower;
				const val = (data[idxLower] * (1 - frac) + data[idxUpper] * frac) / 255;
				const targetAmp = Math.pow(val, 1.6);
				this.smoothedData[i] += (targetAmp - this.smoothedData[i]) * 0.35;
			}
		} else {
			for (let i = 0; i < numPoints; i++)
				this.smoothedData[i] *= 0.85;
		}

		if (instantBass > this.beatEnergy) this.beatEnergy = instantBass;
		else this.beatEnergy += (instantBass - this.beatEnergy) * 0.15;

		const isPlaying = hasData && this.beatEnergy > 0.01;
		const step = width / (numPoints - 1);
		const wavePoints = [];

		for (let i = 0; i < numPoints; i++) {
			const x = i * step;
			const normalizedX = i / (numPoints - 1);
			const direction = (i % 2 === 0) ? -1 : 1;
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

		if (isPlaying) {
			ctx.save();
			ctx.globalCompositeOperation = 'screen';
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

		ctx.globalCompositeOperation = 'screen';

		ctx.save();
		buildWavePath();
		ctx.strokeStyle = strokeGradient;
		ctx.lineWidth = 5;
		ctx.shadowColor = secondary;
		ctx.shadowBlur = isPlaying ? 20 + this.beatEnergy * 20 : 12;
		ctx.stroke();
		ctx.restore();

		ctx.save();
		buildWavePath();
		ctx.strokeStyle = strokeGradient;
		ctx.lineWidth = 3;
		ctx.stroke();
		ctx.restore();

		ctx.save();
		buildWavePath();
		ctx.strokeStyle = strokeGradient;
		ctx.lineWidth = 1.25;
		ctx.shadowColor = primary;
		ctx.shadowBlur = 4;
		ctx.stroke();
		ctx.restore();

		ctx.restore();
	}
}