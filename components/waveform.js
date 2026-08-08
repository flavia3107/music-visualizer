const canvas = document.getElementById('waveformCanvas');
const ctx = canvas.getContext('2d');

// Color Theme
const COLOR_BLUE = 'hsla(195, 100%, 50%, 1)';
const COLOR_PURPLE = 'hsla(270, 95%, 60%, 1)';
const COLOR_PINK = 'hsla(320, 100%, 55%, 1)';

// Transparent Fill Gradient Colors
const FILL_BLUE = 'hsla(195, 100%, 50%, 0.25)';
const FILL_PURPLE = 'hsla(270, 95%, 60%, 0.25)';
const FILL_PINK = 'hsla(320, 100%, 55%, 0.25)';

let phase = 0;

export function drawSinCosWaveform() {
	const width = canvas.width;
	const height = canvas.height;
	const centerY = height / 2;

	ctx.clearRect(0, 0, width, height);

	// 1. Draw Middle Baseline
	ctx.beginPath();
	ctx.moveTo(0, centerY);
	ctx.lineTo(width, centerY);
	ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
	ctx.lineWidth = 1;
	ctx.setLineDash([4, 4]); // Dashed center axis line
	ctx.stroke();
	ctx.setLineDash([]); // Reset line dash

	// 2. Gradients (Stroke & Area Fill)
	const strokeGradient = ctx.createLinearGradient(0, 0, width, 0);
	strokeGradient.addColorStop(0, COLOR_BLUE);
	strokeGradient.addColorStop(0.5, COLOR_PURPLE);
	strokeGradient.addColorStop(1, COLOR_PINK);

	const fillGradient = ctx.createLinearGradient(0, 0, width, 0);
	fillGradient.addColorStop(0, FILL_BLUE);
	fillGradient.addColorStop(0.5, FILL_PURPLE);
	fillGradient.addColorStop(1, FILL_PINK);

	// Wave parameters
	phase += 0.04; // Animation speed
	const amplitude = height * 0.35; // Peak height from center line
	const frequency = 2.5; // Number of full sine/cosine cycles
	const points = 150;
	const step = width / (points - 1);

	// Array to hold wave points for both stroke and fill passes
	const wavePoints = [];

	for (let i = 0; i < points; i++) {
		const x = i * step;
		const normalizedX = i / (points - 1); // 0.0 to 1.0

		// Sin + Cos composite wave equation
		const sinPart = Math.sin(normalizedX * Math.PI * 2 * frequency + phase);
		const cosPart = Math.cos(normalizedX * Math.PI * frequency - phase * 0.5) * 0.3;

		// Windowing taper at edges so wave lands cleanly on center axis
		const envelope = Math.sin(normalizedX * Math.PI);

		const y = centerY + (sinPart + cosPart) * amplitude * envelope;
		wavePoints.push({ x, y });
	}

	// 3. Render Transparent Area Fill (Between Wave and Middle Line)
	ctx.save();
	ctx.beginPath();
	ctx.moveTo(wavePoints[0].x, centerY); // Start on middle line

	for (let i = 0; i < wavePoints.length - 1; i++) {
		const xc = (wavePoints[i].x + wavePoints[i + 1].x) / 2;
		const yc = (wavePoints[i].y + wavePoints[i + 1].y) / 2;
		ctx.quadraticCurveTo(wavePoints[i].x, wavePoints[i].y, xc, yc);
	}

	// Connect to end on middle line
	ctx.lineTo(width, centerY);
	ctx.closePath();

	ctx.fillStyle = fillGradient;
	ctx.fill();
	ctx.restore();

	// 4. Render Top Glowing Sine Wave Line
	ctx.save();
	ctx.beginPath();
	ctx.moveTo(wavePoints[0].x, wavePoints[0].y);

	for (let i = 0; i < wavePoints.length - 1; i++) {
		const xc = (wavePoints[i].x + wavePoints[i + 1].x) / 2;
		const yc = (wavePoints[i].y + wavePoints[i + 1].y) / 2;
		ctx.quadraticCurveTo(wavePoints[i].x, wavePoints[i].y, xc, yc);
	}

	ctx.strokeStyle = strokeGradient;
	ctx.lineWidth = 3;
	ctx.shadowColor = COLOR_PURPLE;
	ctx.shadowBlur = 12; // Neon glow
	ctx.stroke();
	ctx.restore();

	requestAnimationFrame(drawSinCosWaveform);
}

