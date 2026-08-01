// --- 1. Setup Canvas ---
const canvas = document.getElementById('mainCanvas');
const ctx = canvas.getContext('2d');

let width, height, centerX, centerY;

function adjustCanvasSize() {
	const rect = canvas.getBoundingClientRect();
	const dpr = window.devicePixelRatio || 1;

	width = canvas.width = rect.width * dpr;
	height = canvas.height = rect.height * dpr;

	ctx.scale(dpr, dpr);

	centerX = rect.width / 2;
	centerY = rect.height / 2;
}

window.addEventListener('resize', adjustCanvasSize);
adjustCanvasSize();

// Base Color Palettes (with neon-optimized HSL values)
const COLOR_BLUE = 'hsla(195, 100%, 50%, 1)';    // Electric Blue
const COLOR_DULL_BLUE = 'hsla(195, 45%, 45%, 0.7)';   // Dull Electric Blue
const COLOR_PINK = 'hsla(320, 100%, 55%, 1)';    // Hot Pink
const COLOR_DULL_PINK = 'hsla(320, 45%, 50%, 0.7)';   // Dull Pink
const COLOR_YELLOW = 'hsla(50, 100%, 50%, 1)';     // Bright Yellow
const COLOR_TRANSPARENT = 'hsla(0, 0%, 0%, 0)';        // Transparent

const config = {
	barCount: 140,
	minBarHeight: 4
};

let simRotation = 0;
function getSimulatedAudioData(bufferLength) {
	const data = new Uint8Array(bufferLength);
	for (let i = 0; i < bufferLength; i++) {
		const base = Math.sin(i * 0.08 + simRotation * 2) * 50 + 50;
		const pulse = Math.sin(simRotation * 4) * 35;
		data[i] = Math.max(0, base + pulse + (Math.random() * 15));
	}
	simRotation += 0.01;
	return data;
}

const RING_SPACING_FACTORS = [0.18, 0.24, 0.38, 0.50, 0.64, 0.74, 0.84, 0.95];

function getRingGradient(ringNumber, radius) {
	const grad = ctx.createLinearGradient(-radius, 0, radius, 0);

	switch (ringNumber) {
		case 1:
			grad.addColorStop(0.00, COLOR_BLUE);
			grad.addColorStop(0.50, COLOR_BLUE);
			grad.addColorStop(0.5001, COLOR_PINK);
			grad.addColorStop(1.00, COLOR_PINK);
			break;
		case 2:
			grad.addColorStop(0.00, COLOR_DULL_BLUE);
			grad.addColorStop(0.50, COLOR_DULL_BLUE);
			grad.addColorStop(0.5001, COLOR_DULL_PINK);
			grad.addColorStop(1.00, COLOR_DULL_PINK);
			break;
		case 3:
			grad.addColorStop(0.00, COLOR_PINK);
			grad.addColorStop(0.50, COLOR_PINK);
			grad.addColorStop(0.5001, COLOR_YELLOW);
			grad.addColorStop(1.00, COLOR_YELLOW);
			break;
		case 4:
			grad.addColorStop(0.00, COLOR_DULL_PINK);
			grad.addColorStop(0.50, COLOR_DULL_PINK);
			grad.addColorStop(0.5001, COLOR_DULL_BLUE);
			grad.addColorStop(1.00, COLOR_DULL_BLUE);
			break;
		case 5:
			grad.addColorStop(0.00, COLOR_PINK);
			grad.addColorStop(0.50, COLOR_PINK);
			grad.addColorStop(0.5001, COLOR_BLUE);
			grad.addColorStop(1.00, COLOR_BLUE);
			break;
		case 6:
			grad.addColorStop(0.00, COLOR_DULL_BLUE);
			grad.addColorStop(0.50, COLOR_DULL_BLUE);
			grad.addColorStop(0.5001, COLOR_TRANSPARENT);
			grad.addColorStop(1.00, COLOR_TRANSPARENT);
			break;
		case 7:
			grad.addColorStop(0.00, COLOR_BLUE);
			grad.addColorStop(0.50, COLOR_BLUE);
			grad.addColorStop(0.5001, COLOR_DULL_PINK);
			grad.addColorStop(1.00, COLOR_DULL_PINK);
			break;
		case 8:
			grad.addColorStop(0.00, COLOR_BLUE);
			grad.addColorStop(0.50, COLOR_BLUE);
			grad.addColorStop(0.5001, COLOR_YELLOW);
			grad.addColorStop(1.00, COLOR_YELLOW);
			break;
		default:
			grad.addColorStop(0, COLOR_BLUE);
			grad.addColorStop(1, COLOR_PINK);
	}

	return grad;
}

function getPureBarColor(progress) {
	if (progress < 0.33) {
		return COLOR_BLUE;
	} else if (progress < 0.66) {
		return COLOR_PINK;
	} else {
		return COLOR_YELLOW;
	}
}

function draw() {
	requestAnimationFrame(draw);

	const rect = canvas.getBoundingClientRect();
	ctx.clearRect(0, 0, rect.width, rect.height);

	const audioData = getSimulatedAudioData(config.barCount);
	const intensity = audioData[0] / 255;

	const minDimension = Math.min(rect.width, rect.height);
	const maxOuterRadius = minDimension * 0.46;

	const dynamicInnerRadius = maxOuterRadius * 0.72;
	const dynamicMaxBarHeight = maxOuterRadius * 0.28;
	const dynamicMinBarHeight = config.minBarHeight;

	ctx.save();
	ctx.translate(centerX, centerY);

	// --- NEON GLOW CONFIGURATION ---
	// Sets the glow color to white/cyan tint and controls blur radius
	ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
	ctx.shadowBlur = 15;
	ctx.shadowOffsetX = 0;
	ctx.shadowOffsetY = 0;

	// 1. Draw 8 Concentric Circles with Neon Glow
	RING_SPACING_FACTORS.forEach((factor, index) => {
		const ringNumber = index + 1;
		const baseRadius = dynamicInnerRadius * factor;
		const currentRadius = baseRadius * (0.97 + intensity * 0.05);

		ctx.strokeStyle = getRingGradient(ringNumber, currentRadius);
		ctx.lineWidth = (ringNumber % 2 === 1) ? 3 : 1.5;

		// Dynamic shadow blur reacting slightly to audio pulse
		ctx.shadowBlur = 10 + (intensity * 12);

		ctx.beginPath();
		ctx.arc(0, 0, currentRadius, 0, Math.PI * 2);
		ctx.stroke();
	});

	// 2. Draw Outer Bars with Sector-Matched Neon Glow
	for (let i = 0; i < config.barCount; i++) {
		const progress = i / config.barCount;
		const angle = progress * Math.PI * 2;
		const value = audioData[i];

		const barHeight = dynamicMinBarHeight + (value / 255) * dynamicMaxBarHeight;

		const startX = Math.cos(angle) * dynamicInnerRadius;
		const startY = Math.sin(angle) * dynamicInnerRadius;
		const endX = Math.cos(angle) * (dynamicInnerRadius + barHeight);
		const endY = Math.sin(angle) * (dynamicInnerRadius + barHeight);

		const color = getPureBarColor(progress);
		ctx.strokeStyle = color;

		// Match glow color directly to the bar color for stronger neon pop
		ctx.shadowColor = color;
		ctx.shadowBlur = 8 + ((value / 255) * 10);

		ctx.lineWidth = Math.max(2.5, (dynamicInnerRadius * Math.PI * 2) / config.barCount / 1.4);
		ctx.lineCap = 'round';
		ctx.beginPath();
		ctx.moveTo(startX, startY);
		ctx.lineTo(endX, endY);
		ctx.stroke();
	}

	ctx.restore();
}

draw();