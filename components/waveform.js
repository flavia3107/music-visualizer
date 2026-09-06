export class WaveformCurveVisualizer {
	constructor() {
		this.phase = 0;
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

		ctx.beginPath();
		ctx.moveTo(0, centerY);
		ctx.lineTo(width, centerY);
		ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
		ctx.lineWidth = 0.75;
		ctx.setLineDash([3, 3]);
		ctx.stroke();
		ctx.setLineDash([]);

		const strokeGradient = ctx.createLinearGradient(0, 0, width, 0);
		strokeGradient.addColorStop(0.0, primary);
		strokeGradient.addColorStop(0.5, accent);
		strokeGradient.addColorStop(1.0, secondary);

		const fillGradient = ctx.createLinearGradient(0, 0, width, 0);
		fillGradient.addColorStop(0.0, mutedPrimary);
		fillGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)');
		fillGradient.addColorStop(1.0, mutedSecondary);

		const hasData = data && data.length > 0;
		let audioEnergy = 0;

		if (hasData) {
			const sum = data.reduce((acc, val) => acc + val, 0);
			audioEnergy = (sum / data.length) / 255;
		}

		this.phase += hasData ? 0.02 + audioEnergy * 0.04 : 0;

		const dynamicAmplitude = height * 0.35 * audioEnergy;
		const frequency = 2.5;
		const points = 200;
		const step = width / (points - 1);

		const wavePoints = [];

		for (let i = 0; i < points; i++) {
			const x = i * step;
			const normalizedX = i / (points - 1);
			const dataIndex = Math.floor(normalizedX * (data.length - 1));
			const pointAudioFactor = hasData ? (data[dataIndex] / 255) : 0;
			const sinPart = Math.sin(normalizedX * Math.PI * 2 * frequency + this.phase);
			const cosPart = Math.cos(normalizedX * Math.PI * frequency - this.phase * 0.5) * 0.3;
			const envelope = Math.sin(normalizedX * Math.PI); // Envelope to taper ends gracefully
			const y = centerY + (sinPart + cosPart) * dynamicAmplitude * envelope * pointAudioFactor;
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

		ctx.save();
		buildWavePath();
		ctx.strokeStyle = strokeGradient;
		ctx.lineWidth = 3;
		ctx.shadowColor = secondary;
		ctx.shadowBlur = 12 + audioEnergy * 10;
		ctx.stroke();
		ctx.restore();

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