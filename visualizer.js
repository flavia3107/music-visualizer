// --- 1. Setup Canvas ---
const canvas = document.getElementById('mainCanvas');
const ctx = canvas.getContext('2d');

let width, height, centerX, centerY;

function adjustCanvasSize() {
	// Convert rem to pixels based on the root font-size (16px default)
	const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);

	const minWidthPx = 30 * rootFontSize;  // 30rem in pixels
	const minHeightPx = 50 * rootFontSize; // 50rem in pixels

	// Ensure dimensions never drop below window size OR the min-rem thresholds
	width = canvas.width = Math.max(window.innerWidth, minWidthPx);
	height = canvas.height = Math.max(window.innerHeight, minHeightPx);

	// Recalculate center coordinates based on the computed canvas dimensions
	centerX = width / 2;
	centerY = height / 2;
}

window.addEventListener('resize', adjustCanvasSize);
adjustCanvasSize();

const config = {
	color1: { h: 195, s: 100, l: 50 },
	color2: { h: 330, s: 100, l: 50 },
	color3: { h: 45, s: 100, l: 50 },
	barCount: 128,
	innerRadius: 120,
	minBarHeight: 5,
	maxBarHeight: 100
};

let simRotation = 0;
function getSimulatedAudioData(bufferLength) {
	const data = new Uint8Array(bufferLength);
	for (let i = 0; i < bufferLength; i++) {
		const base = Math.sin(i * 0.1 + simRotation * 2) * 50 + 50;
		const pulse = Math.sin(simRotation * 5) * 30;
		data[i] = Math.max(0, base + pulse + (Math.random() * 10));
	}
	simRotation += 0.01;
	return data;
}

function draw() {
	requestAnimationFrame(draw);
	ctx.clearRect(0, 0, width, height);

	const audioData = getSimulatedAudioData(config.barCount);
	const intensity = audioData[0] / 255;

	// 1. DYNAMIC SCALING: Fill ~75-80% of the smaller canvas dimension
	const minDimension = Math.min(width, height);

	// Set responsive dimensions based on viewport size
	const dynamicInnerRadius = minDimension * 0.25; // Center circle base size
	const dynamicMaxBarHeight = minDimension * 0.15; // Max bar stretch
	const dynamicMinBarHeight = config.minBarHeight || 5;

	ctx.save();
	ctx.translate(centerX, centerY);

	// 2. Draw Radial Audio Bars
	for (let i = 0; i < config.barCount; i++) {
		const angle = (i / config.barCount) * Math.PI * 2;
		const value = audioData[i];

		// Calculate dynamic height based on audio input
		const barHeight = dynamicMinBarHeight + (value / 255) * dynamicMaxBarHeight;

		// Calculate start and end points using trigonometry
		const startX = Math.cos(angle) * dynamicInnerRadius;
		const startY = Math.sin(angle) * dynamicInnerRadius;
		const endX = Math.cos(angle) * (dynamicInnerRadius + barHeight);
		const endY = Math.sin(angle) * (dynamicInnerRadius + barHeight);

		// Define linear gradient for each bar
		const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
		gradient.addColorStop(0, `hsl(${config.color1.h}, ${config.color1.s}%, ${config.color1.l}%)`);
		gradient.addColorStop(1, `hsl(${config.color2.h}, ${config.color2.s}%, ${config.color2.l}%)`);

		// Draw the line
		ctx.strokeStyle = gradient;
		ctx.lineWidth = 3;
		ctx.lineCap = 'round';
		ctx.beginPath();
		ctx.moveTo(startX, startY);
		ctx.lineTo(endX, endY);
		ctx.stroke();
	}

	// 3. Draw Pulsing Inner Concentric Rings
	const pulseRadius = dynamicInnerRadius * (0.8 + intensity * 0.2);

	// Pink inner ring
	ctx.strokeStyle = `hsl(${config.color2.h}, 100%, 50%)`;
	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.arc(0, 0, pulseRadius * 0.9, 0, Math.PI * 2);
	ctx.stroke();

	// Blue inner ring
	ctx.strokeStyle = `hsl(${config.color1.h}, 100%, 50%)`;
	ctx.lineWidth = 4;
	ctx.beginPath();
	ctx.arc(0, 0, pulseRadius * 0.8, 0, Math.PI * 2);
	ctx.stroke();

	ctx.restore();
}
draw();