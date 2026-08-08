const canvas = document.getElementById('waveformCanvas');
const ctx = canvas.getContext('2d');

// Colors matching the UI theme
const COLOR_BLUE = 'hsla(195, 100%, 50%, 1)';
const COLOR_PURPLE = 'hsla(270, 95%, 60%, 1)';
const COLOR_PINK = 'hsla(320, 100%, 55%, 1)';

let phase = 0;

export function drawWaveformCurveUI() {
	const width = canvas.width;
	const height = canvas.height;
	const centerY = height / 2;

	ctx.clearRect(0, 0, width, height);

	// Create horizontal gradient (Cyan/Blue -> Purple -> Pink)
	const gradient = ctx.createLinearGradient(0, 0, width, 0);
	gradient.addColorStop(0, COLOR_BLUE);
	gradient.addColorStop(0.5, COLOR_PURPLE);
	gradient.addColorStop(1, COLOR_PINK);

	phase += 0.04; // Animation speed

	// Render primary and secondary layered wave curves
	renderSingleWave(ctx, width, centerY, phase, gradient, 1.0, 3.5);
	renderSingleWave(ctx, width, centerY, phase + 1.2, gradient, 0.7, 2.0);

	requestAnimationFrame(drawWaveformCurveUI);
}

function renderSingleWave(ctx, width, centerY, wavePhase, strokeStyle, ampMultiplier, lineWidth) {
	const points = 80;
	const step = width / (points - 1);

	ctx.save();
	ctx.beginPath();

	for (let i = 0; i < points; i++) {
		const x = i * step;
		const normalizedX = i / points;

		// Windowing envelope so the wave smoothly tapers down to 0 at left/right edges
		const envelope = Math.sin(normalizedX * Math.PI);

		// Combined sine frequencies for fluid, double-crested curves like the preview
		const sine1 = Math.sin(normalizedX * Math.PI * 2.5 + wavePhase);
		const sine2 = Math.cos(normalizedX * Math.PI * 4 - wavePhase * 0.7) * 0.4;

		const y = centerY + (sine1 + sine2) * 45 * ampMultiplier * envelope;

		if (i === 0) {
			ctx.moveTo(x, y);
		} else {
			const prevX = (i - 1) * step;
			const xc = (prevX + x) / 2;
			const yc = y; // Smooth interpolation point
			ctx.quadraticCurveTo(prevX, y, xc, yc);
		}
	}

	ctx.strokeStyle = strokeStyle;
	ctx.lineWidth = lineWidth;
	ctx.shadowColor = COLOR_PURPLE;
	ctx.shadowBlur = 15; // Strong neon glow
	ctx.lineCap = 'round';
	ctx.stroke();
	ctx.restore();
}

