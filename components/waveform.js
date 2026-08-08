export class WaveformCurveVisualizer {
	constructor() {
		this.phase = 0;

		// Neon Colors
		this.NEON_BLUE = 'rgb(0, 230, 255)';
		this.NEON_PINK = 'rgb(255, 0, 180)';
		this.NEON_PURPLE = 'rgb(170, 0, 255)';

		this.FILL_BLUE = 'rgba(0, 230, 255, 0.25)';
		this.FILL_PINK = 'rgba(255, 0, 180, 0.25)';
		this.FILL_PURPLE = 'rgba(170, 0, 255, 0.25)';
	}

	draw(ctx, rect) {
		const width = rect.width;
		const height = rect.height;
		const centerY = height / 2;

		ctx.clearRect(0, 0, width, height);
		ctx.globalCompositeOperation = 'lighter';

		// 1. Center Axis
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
		strokeGradient.addColorStop(0.0, this.NEON_BLUE);
		strokeGradient.addColorStop(0.46, this.NEON_BLUE);
		strokeGradient.addColorStop(0.50, this.NEON_PURPLE);
		strokeGradient.addColorStop(0.54, this.NEON_PINK);
		strokeGradient.addColorStop(1.0, this.NEON_PINK);

		const fillGradient = ctx.createLinearGradient(0, 0, width, 0);
		fillGradient.addColorStop(0.0, this.FILL_BLUE);
		fillGradient.addColorStop(0.46, this.FILL_BLUE);
		fillGradient.addColorStop(0.50, this.FILL_PURPLE);
		fillGradient.addColorStop(0.54, this.FILL_PINK);
		fillGradient.addColorStop(1.0, this.FILL_PINK);

		this.phase += 0.03;
		const amplitude = height * 0.35;
		const frequency = 2.5;
		const points = 200;
		const step = width / (points - 1);

		const wavePoints = [];

		for (let i = 0; i < points; i++) {
			const x = i * step;
			const normalizedX = i / (points - 1);

			const sinPart = Math.sin(normalizedX * Math.PI * 2 * frequency + this.phase);
			const cosPart = Math.cos(normalizedX * Math.PI * frequency - this.phase * 0.5) * 0.3;
			const envelope = Math.sin(normalizedX * Math.PI);

			const y = centerY + (sinPart + cosPart) * amplitude * envelope;
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

		// 3. Translucent Area Fill
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

		// 4. Glow Pass
		ctx.save();
		buildWavePath();
		ctx.strokeStyle = strokeGradient;
		ctx.lineWidth = 3;
		ctx.shadowColor = this.NEON_PINK;
		ctx.shadowBlur = 18;
		ctx.stroke();
		ctx.restore();

		// 5. Crisp Core Line
		ctx.save();
		buildWavePath();
		ctx.strokeStyle = strokeGradient;
		ctx.lineWidth = 1.2;
		ctx.shadowColor = this.NEON_BLUE;
		ctx.shadowBlur = 6;
		ctx.stroke();
		ctx.restore();

		ctx.globalCompositeOperation = 'source-over';
	}
}