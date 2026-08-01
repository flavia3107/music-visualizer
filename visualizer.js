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

const config = {
	color1: { h: 195, s: 100, l: 50 }, // Electric Blue
	color2: { h: 330, s: 100, l: 50 }, // Pink
	color3: { h: 45, s: 100, l: 50 },  // Yellow
	barCount: 128,
	minBarHeight: 5
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

// Helper to create circle stroke styles with custom color schemes
function getRingStrokeStyle(index, totalRings, radius) {
	switch (index) {
		// Full Blue
		case 0:
		case 1:
			return `hsl(${config.color1.h}, 100%, 50%)`;

		// Half Electric Blue & Half Pink
		case 2:
		case 3: {
			const grad = ctx.createLinearGradient(-radius, 0, radius, 0);
			grad.addColorStop(0, `hsl(${config.color1.h}, 100%, 50%)`); // Blue
			grad.addColorStop(1, `hsl(${config.color2.h}, 100%, 50%)`); // Pink
			return grad;
		}

		// Full Pink
		case 4:
		case 5:
			return `hsl(${config.color2.h}, 100%, 50%)`;

		// Half Pink & Half Yellow
		case 6:
		case 7: {
			const grad = ctx.createLinearGradient(-radius, 0, radius, 0);
			grad.addColorStop(0, `hsl(${config.color2.h}, 100%, 50%)`); // Pink
			grad.addColorStop(1, `hsl(${config.color3.h}, 100%, 50%)`); // Yellow
			return grad;
		}

		default:
			return `hsl(${config.color1.h}, 100%, 50%)`;
	}
}

// Helper to get a single solid color for an individual bar based on its angle
function getBarSolidColor(progress) {
	// progress is 0.0 to 1.0 around the circle
	let h;
	if (progress < 0.5) {
		// Transition from Electric Blue (195) to Pink (330)
		const t = progress / 0.5;
		h = config.color1.h + (config.color2.h - config.color1.h) * t;
	} else {
		// Transition from Pink (330) to Yellow (45)
		const t = (progress - 0.5) / 0.5;
		// 330 deg to 405 deg (45 + 360) for smooth hue wheel interpolation
		const targetHue = config.color3.h < config.color2.h ? config.color3.h + 360 : config.color3.h;
		h = (config.color2.h + (targetHue - config.color2.h) * t) % 360;
	}
	return `hsl(${h}, 100%, 50%)`;
}

function draw() {
	requestAnimationFrame(draw);

	const rect = canvas.getBoundingClientRect();
	ctx.clearRect(0, 0, rect.width, rect.height);

	const audioData = getSimulatedAudioData(config.barCount);
	const intensity = audioData[0] / 255;

	// 1. DYNAMIC SCALING: Fill ~95% of the container box
	const minDimension = Math.min(rect.width, rect.height);
	const maxOuterRadius = minDimension * 0.475;

	const dynamicInnerRadius = maxOuterRadius * 0.70;
	const dynamicMaxBarHeight = maxOuterRadius * 0.30;
	const dynamicMinBarHeight = config.minBarHeight || 5;

	ctx.save();
	ctx.translate(centerX, centerY);

	// 2. Draw 8 Concentric Inner Circles with DIFFERENT / EXPONENTIAL SPACING
	const numRings = 8;

	for (let r = 1; r <= numRings; r++) {
		// Non-uniform spacing: power function creates tighter spacing near center, wider towards edge
		const normalizedRatio = Math.pow(r / numRings, 1.4);
		const baseRadius = dynamicInnerRadius * normalizedRatio;

		// Apply audio pulse animation
		const currentRadius = baseRadius * (0.96 + intensity * 0.08);

		ctx.strokeStyle = getRingStrokeStyle(r - 1, numRings, currentRadius);
		ctx.lineWidth = r % 2 === 0 ? 3 : 1.5;
		ctx.beginPath();
		ctx.arc(0, 0, currentRadius, 0, Math.PI * 2);
		ctx.stroke();
	}

	// 3. Draw Outer Radial Audio Bars with SINGLE SOLID COLOR per bar
	for (let i = 0; i < config.barCount; i++) {
		const progress = i / config.barCount;
		const angle = progress * Math.PI * 2;
		const value = audioData[i];

		const barHeight = dynamicMinBarHeight + (value / 255) * dynamicMaxBarHeight;

		const startX = Math.cos(angle) * dynamicInnerRadius;
		const startY = Math.sin(angle) * dynamicInnerRadius;
		const endX = Math.cos(angle) * (dynamicInnerRadius + barHeight);
		const endY = Math.sin(angle) * (dynamicInnerRadius + barHeight);

		// Assign one solid HSL color per bar
		ctx.strokeStyle = getBarSolidColor(progress);
		ctx.lineWidth = Math.max(2, (dynamicInnerRadius * Math.PI * 2) / config.barCount / 1.5);
		ctx.lineCap = 'round';
		ctx.beginPath();
		ctx.moveTo(startX, startY);
		ctx.lineTo(endX, endY);
		ctx.stroke();
	}

	ctx.restore();
}

draw();s