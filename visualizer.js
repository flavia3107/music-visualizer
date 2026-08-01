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

// Strict 3-Color Palette
const COLOR_BLUE = 'hsl(195, 100%, 50%)'; // Electric Blue
const COLOR_PINK = 'hsl(320, 100%, 55%)'; // Hot Pink
const COLOR_YELLOW = 'hsl(50, 100%, 50%)';  // Bright Yellow

const config = {
	barCount: 160,
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

// 8 Rings defined by precise relative radii spacing matching your design image
// 1 & 2 close -> 3 spaced out -> 4 spaced -> 5 & 6 very close -> 7 close to outer line
const RING_SPACING_FACTORS = [0.20, 0.26, 0.46, 0.60, 0.75, 0.80, 0.93];

function createTriColorGradient(radius) {
	// Linear gradient spanning Left (-R) to Right (+R)
	// Left = Electric Blue | Center = Hot Pink | Right = Yellow
	const grad = ctx.createLinearGradient(-radius, 0, radius, 0);
	grad.addColorStop(0.0, COLOR_BLUE);
	grad.addColorStop(0.48, COLOR_PINK);
	grad.addColorStop(1.0, COLOR_YELLOW);
	return grad;
}

// Solid 3-color map for individual bars based on position around circle
function getBarSolidColor(progress) {
	// Angle in degrees (0 = Right / Yellow side, 180 = Left / Blue side)
	const angleDeg = progress * 360;

	// Right side (315° to 45°) -> Yellow
	if (angleDeg >= 315 || angleDeg < 45) {
		return COLOR_YELLOW;
	}
	// Left side (135° to 225°) -> Electric Blue
	else if (angleDeg >= 135 && angleDeg < 225) {
		return COLOR_BLUE;
	}
	// Top & Bottom regions (Blends) -> Hot Pink
	else {
		return COLOR_PINK;
	}
}

function draw() {
	requestAnimationFrame(draw);

	const rect = canvas.getBoundingClientRect();
	ctx.clearRect(0, 0, rect.width, rect.height);

	const audioData = getSimulatedAudioData(config.barCount);
	const intensity = audioData[0] / 255;

	// 1. DYNAMIC SCALING: Fill ~92% of the container
	const minDimension = Math.min(rect.width, rect.height);
	const maxOuterRadius = minDimension * 0.46; // Radius = 46% (Diameter = 92%)

	const dynamicInnerRadius = maxOuterRadius * 0.72;
	const dynamicMaxBarHeight = maxOuterRadius * 0.28;
	const dynamicMinBarHeight = config.minBarHeight;

	ctx.save();
	ctx.translate(centerX, centerY);

	// 2. Draw Concentric Inner Circles with Custom Spacing
	RING_SPACING_FACTORS.forEach((factor, index) => {
		const baseRadius = dynamicInnerRadius * factor;
		const currentRadius = baseRadius * (0.97 + intensity * 0.05);

		ctx.strokeStyle = createTriColorGradient(currentRadius);
		// Vary line weights like the reference image
		ctx.lineWidth = (index === 0 || index === 2 || index === 4) ? 3 : 1.5;

		ctx.beginPath();
		ctx.arc(0, 0, currentRadius, 0, Math.PI * 2);
		ctx.stroke();
	});

	// 3. Draw Outer Radial Audio Bars with Single 3-Color Sections
	for (let i = 0; i < config.barCount; i++) {
		const progress = i / config.barCount;
		const angle = progress * Math.PI * 2;
		const value = audioData[i];

		const barHeight = dynamicMinBarHeight + (value / 255) * dynamicMaxBarHeight;

		const startX = Math.cos(angle) * dynamicInnerRadius;
		const startY = Math.sin(angle) * dynamicInnerRadius;
		const endX = Math.cos(angle) * (dynamicInnerRadius + barHeight);
		const endY = Math.sin(angle) * (dynamicInnerRadius + barHeight);

		ctx.strokeStyle = getBarSolidColor(progress);
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