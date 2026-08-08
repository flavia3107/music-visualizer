const canvas = document.getElementById('waveformCanvas');
const ctx = canvas?.getContext('2d');
// Vibrant Neon Palettes
const NEON_BLUE = 'rgb(0, 230, 255)';       // High-intensity Electric Cyan/Blue
const NEON_PINK = 'rgb(255, 0, 180)';       // High-intensity Hot Neon Pink
const NEON_PURPLE = 'rgb(170, 0, 255)';     // Vivid Magenta/Purple bridge

// Semi-transparent Neon Fills
const FILL_BLUE = 'rgba(0, 230, 255, 0.25)';
const FILL_PINK = 'rgba(255, 0, 180, 0.25)';
const FILL_PURPLE = 'rgba(170, 0, 255, 0.25)';
let phase = 0;

function setupCanvasResolution() {
	const dpr = window.devicePixelRatio || 1;
	const rect = canvas.getBoundingClientRect();

	// Set display size (CSS pixels)
	canvas.style.width = `${rect.width}px`;
	canvas.style.height = `${rect.height}px`;

	// Set actual internal rendering resolution (scaled for screen density)
	canvas.width = rect.width * dpr;
	canvas.height = rect.height * dpr;

	// Scale drawing context to match DPI
	ctx.scale(dpr, dpr);
}

// Run once on setup and on resize
setupCanvasResolution();
window.addEventListener('resize', setupCanvasResolution);


export function drawSinCosWaveform() {
	const rect = canvas.getBoundingClientRect();
	const width = rect.width;
	const height = rect.height;
	const centerY = height / 2;

	ctx.clearRect(0, 0, width, height);

	// Enable Additive Blending for Neon Luminosity
	ctx.globalCompositeOperation = 'lighter';

	// 1. Center Baseline
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
	strokeGradient.addColorStop(0.0, NEON_BLUE);
	strokeGradient.addColorStop(0.46, NEON_BLUE);
	strokeGradient.addColorStop(0.50, NEON_PURPLE);
	strokeGradient.addColorStop(0.54, NEON_PINK);
	strokeGradient.addColorStop(1.0, NEON_PINK);

	const fillGradient = ctx.createLinearGradient(0, 0, width, 0);
	fillGradient.addColorStop(0.0, FILL_BLUE);
	fillGradient.addColorStop(0.46, FILL_BLUE);
	fillGradient.addColorStop(0.50, FILL_PURPLE);
	fillGradient.addColorStop(0.54, FILL_PINK);
	fillGradient.addColorStop(1.0, FILL_PINK);

	phase += 0.03;
	const amplitude = height * 0.35;
	const frequency = 2.5;
	const points = 200;
	const step = width / (points - 1);

	const wavePoints = [];

	for (let i = 0; i < points; i++) {
		const x = i * step;
		const normalizedX = i / (points - 1);

		const sinPart = Math.sin(normalizedX * Math.PI * 2 * frequency + phase);
		const cosPart = Math.cos(normalizedX * Math.PI * frequency - phase * 0.5) * 0.3;
		const envelope = Math.sin(normalizedX * Math.PI);

		const y = centerY + (sinPart + cosPart) * amplitude * envelope;
		wavePoints.push({ x, y });
	}

	// Helper path drawing function
	function buildWavePath() {
		ctx.beginPath();
		ctx.moveTo(wavePoints[0].x, wavePoints[0].y);
		for (let i = 0; i < wavePoints.length - 1; i++) {
			const xc = (wavePoints[i].x + wavePoints[i + 1].x) / 2;
			const yc = (wavePoints[i].y + wavePoints[i + 1].y) / 2;
			ctx.quadraticCurveTo(wavePoints[i].x, wavePoints[i].y, xc, yc);
		}
	}

	// 3. Transparent Area Fill
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

	// 4. Pass 1: Wide Neon Glow Background Pass
	ctx.save();
	buildWavePath();
	ctx.strokeStyle = strokeGradient;
	ctx.lineWidth = 3;
	ctx.shadowColor = NEON_PINK;
	ctx.shadowBlur = 18; // Heavy neon aura
	ctx.stroke();
	ctx.restore();

	// 5. Pass 2: Crisp Bright Core Line
	ctx.save();
	buildWavePath();
	ctx.strokeStyle = strokeGradient;
	ctx.lineWidth = 1.2;
	ctx.shadowColor = NEON_BLUE;
	ctx.shadowBlur = 6;
	ctx.stroke();
	ctx.restore();

	// Reset composite operation for rest of UI
	ctx.globalCompositeOperation = 'source-over';

	requestAnimationFrame(drawSinCosWaveform);
}