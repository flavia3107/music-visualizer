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

// Base Color Palettes
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

// 8 Ring Spacing multipliers (Inner to Outer)
const RING_SPACING_FACTORS = [0.18, 0.24, 0.38, 0.50, 0.64, 0.74, 0.84, 0.95];

// Map exact specified color themes to each ring index (1 to 8)
function getRingGradient(ringNumber, radius) {
	const grad = ctx.createLinearGradient(-radius, 0, radius, 0);

	switch (ringNumber) {
		// 1 - half electric blue half pink
		case 1:
			grad.addColorStop(0.00, COLOR_BLUE);
			grad.addColorStop(0.50, COLOR_BLUE);
			grad.addColorStop(0.5001, COLOR_PINK);
			grad.addColorStop(1.00, COLOR_PINK);
			break;

		// 2 - half dull electric blue - half dull pink
		case 2:
			grad.addColorStop(0.00, COLOR_DULL_BLUE);
			grad.addColorStop(0.50, COLOR_DULL_BLUE);
			grad.addColorStop(0.5001, COLOR_DULL_PINK);
			grad.addColorStop(1.00, COLOR_DULL_PINK);
			break;

		// 3 - half pink half yellow
		case 3:
			grad.addColorStop(0.00, COLOR_PINK);
			grad.addColorStop(0.50, COLOR_PINK);
			grad.addColorStop(0.5001, COLOR_YELLOW);
			grad.addColorStop(1.00, COLOR_YELLOW);
			break;

		// 4 - half dull pink half dull blue
		case 4:
			grad.addColorStop(0.00, COLOR_DULL_PINK);
			grad.addColorStop(0.50, COLOR_DULL_PINK);
			grad.addColorStop(0.5001, COLOR_DULL_BLUE);
			grad.addColorStop(1.00, COLOR_DULL_BLUE);
			break;

		// 5 - half hot pink half electric blue
		case 5:
			grad.addColorStop(0.00, COLOR_PINK);
			grad.addColorStop(0.50, COLOR_PINK);
			grad.addColorStop(0.5001, COLOR_BLUE);
			grad.addColorStop(1.00, COLOR_BLUE);
			break;

		// 6 - half dull blue half transparent
		case 6:
			grad.addColorStop(0.00, COLOR_DULL_BLUE);
			grad.addColorStop(0.50, COLOR_DULL_BLUE);
			grad.addColorStop(0.5001, COLOR_TRANSPARENT);
			grad.addColorStop(1.00, COLOR_TRANSPARENT);
			break;

		// 7 - half electric blue half dull pink
		case 7:
			grad.addColorStop(0.00, COLOR_BLUE);
			grad.addColorStop(0.50, COLOR_BLUE);
			grad.addColorStop(0.5001, COLOR_DULL_PINK);
			grad.addColorStop(1.00, COLOR_DULL_PINK);
			break;

		// 8 - half electric blue, half bright yellow (single unified yellow section)
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
// Outer Bars: Clean sharp sectores matching overall theme
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

	// Scale ~92% of container
	const minDimension = Math.min(rect.width, rect.height);
	const maxOuterRadius = minDimension * 0.46;

	const dynamicInnerRadius = maxOuterRadius * 0.72;
	const dynamicMaxBarHeight = maxOuterRadius * 0.28;
	const dynamicMinBarHeight = config.minBarHeight;

	ctx.save();
	ctx.translate(centerX, centerY);

	// 1. Draw 8 Concentric Circles with exact requested color rules
	RING_SPACING_FACTORS.forEach((factor, index) => {
		const ringNumber = index + 1; // 1 through 8
		const baseRadius = dynamicInnerRadius * factor;
		const currentRadius = baseRadius * (0.97 + intensity * 0.05);

		ctx.strokeStyle = getRingGradient(ringNumber, currentRadius);
		ctx.lineWidth = (ringNumber % 2 === 1) ? 3 : 1.5; // Alternating stroke width

		ctx.beginPath();
		ctx.arc(0, 0, currentRadius, 0, Math.PI * 2);
		ctx.stroke();
	});

	// 2. Draw Outer Bars
	for (let i = 0; i < config.barCount; i++) {
		const progress = i / config.barCount;
		const angle = progress * Math.PI * 2;
		const value = audioData[i];

		const barHeight = dynamicMinBarHeight + (value / 255) * dynamicMaxBarHeight;

		const startX = Math.cos(angle) * dynamicInnerRadius;
		const startY = Math.sin(angle) * dynamicInnerRadius;
		const endX = Math.cos(angle) * (dynamicInnerRadius + barHeight);
		const endY = Math.sin(angle) * (dynamicInnerRadius + barHeight);

		ctx.strokeStyle = getPureBarColor(progress);
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