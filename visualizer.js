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

// 3 Core Hues: Blue (~195°), Pink (~320°), Yellow (~50°)
const HUE_BLUE = 195;
const HUE_PINK = 320;
const HUE_YELLOW = 50;

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

// 7 Ring Spacing multipliers (2 close, space, 2 close, 1 near edge)
const RING_SPACING_FACTORS = [0.20, 0.26, 0.46, 0.60, 0.75, 0.80, 0.93];

// Dynamic Ring Gradients with varied angles and color stop variations
function createDynamicRingGradient(index, totalRings, radius) {
	// Offset angle per ring so gradient lines don't stack uniformly
	const angleOffset = (index / totalRings) * (Math.PI / 2) - Math.PI / 4;

	const x0 = Math.cos(angleOffset) * -radius;
	const y0 = Math.sin(angleOffset) * -radius;
	const x1 = Math.cos(angleOffset) * radius;
	const y1 = Math.sin(angleOffset) * radius;

	const grad = ctx.createLinearGradient(x0, y0, x1, y1);

	// Vary color combinations depending on the ring depth
	if (index % 3 === 0) {
		// Inner/Alternate Rings: Blue -> Pink -> Yellow
		grad.addColorStop(0.0, `hsl(${HUE_BLUE}, 100%, 50%)`);
		grad.addColorStop(0.5, `hsl(${HUE_PINK}, 100%, 55%)`);
		grad.addColorStop(1.0, `hsl(${HUE_YELLOW}, 100%, 50%)`);
	} else if (index % 3 === 1) {
		// Shifted focus: Pink -> Blue -> Yellow
		grad.addColorStop(0.0, `hsl(${HUE_PINK}, 100%, 55%)`);
		grad.addColorStop(0.4, `hsl(${HUE_BLUE}, 100%, 50%)`);
		grad.addColorStop(1.0, `hsl(${HUE_YELLOW}, 100%, 50%)`);
	} else {
		// Outer focused: Blue -> Yellow -> Pink
		grad.addColorStop(0.0, `hsl(${HUE_BLUE}, 100%, 50%)`);
		grad.addColorStop(0.6, `hsl(${HUE_YELLOW}, 100%, 50%)`);
		grad.addColorStop(1.0, `hsl(${HUE_PINK}, 100%, 55%)`);
	}
	return grad;
}

// Smoothly blend solid bar colors across the perimeter (Blue -> Pink -> Yellow sweep)
function getBarSolidColor(progress) {
	let hue;
	// Map progress (0 to 1) smoothly across Blue (195) -> Pink (320) -> Yellow (410deg / 50deg)
	if (progress < 0.35) {
		// Sweep Blue to Pink
		const t = progress / 0.35;
		hue = HUE_BLUE + (HUE_PINK - HUE_BLUE) * t;
	} else if (progress < 0.70) {
		// Sweep Pink to Yellow
		const t = (progress - 0.35) / 0.35;
		hue = HUE_PINK + (410 - HUE_PINK) * t; // 410 = 360 + 50 (Yellow)
	} else {
		// Sweep Yellow back to Blue
		const t = (progress - 0.70) / 0.30;
		hue = 410 + (555 - 410) * t; // 555 = 360 + 195 (Blue)
	}

	return `hsl(${hue % 360}, 100%, 50%)`;
}

function draw() {
	requestAnimationFrame(draw);

	const rect = canvas.getBoundingClientRect();
	ctx.clearRect(0, 0, rect.width, rect.height);

	const audioData = getSimulatedAudioData(config.barCount);
	const intensity = audioData[0] / 255;

	// 1. Fill ~92% of the container
	const minDimension = Math.min(rect.width, rect.height);
	const maxOuterRadius = minDimension * 0.46;

	const dynamicInnerRadius = maxOuterRadius * 0.72;
	const dynamicMaxBarHeight = maxOuterRadius * 0.28;
	const dynamicMinBarHeight = config.minBarHeight;

	ctx.save();
	ctx.translate(centerX, centerY);

	// 2. Draw Inner Circles with Custom Spacing & Dynamic Angled Gradients
	RING_SPACING_FACTORS.forEach((factor, index) => {
		const baseRadius = dynamicInnerRadius * factor;
		const currentRadius = baseRadius * (0.97 + intensity * 0.05);

		ctx.strokeStyle = createDynamicRingGradient(index, RING_SPACING_FACTORS.length, currentRadius);
		ctx.lineWidth = (index === 0 || index === 2 || index === 4) ? 3 : 1.5;

		ctx.beginPath();
		ctx.arc(0, 0, currentRadius, 0, Math.PI * 2);
		ctx.stroke();
	});

	// 3. Draw Outer Bars with Smooth Color Transitions
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