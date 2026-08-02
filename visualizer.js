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
	minBarHeight: 0
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
			// Left = Blue, Center Top/Bottom = Pink, Right = Yellow
			grad.addColorStop(0.00, COLOR_BLUE);
			grad.addColorStop(0.35, COLOR_BLUE);
			grad.addColorStop(0.45, COLOR_PINK);
			grad.addColorStop(0.55, COLOR_PINK);
			grad.addColorStop(0.65, COLOR_YELLOW);
			grad.addColorStop(1.00, COLOR_YELLOW);
			break;
		default:
			grad.addColorStop(0, COLOR_BLUE);
			grad.addColorStop(1, COLOR_PINK);
	}

	return grad;
}

// Aligns bar colors directly with Ring 8's 3-way distribution (Pink top/bottom divider)
function getPureBarColor(angle) {
	const cosVal = Math.cos(angle);
	const sinVal = Math.sin(angle);

	if (Math.abs(sinVal) > 0.85) {
		return COLOR_PINK;
	}

	return cosVal < 0 ? COLOR_BLUE : COLOR_YELLOW;
}

// Helper to convert base hsla string into custom alpha values for light rays
function getRayColorWithAlpha(colorString, alpha) {
	return colorString.replace(/[\d\.]+\)$/g, `${alpha})`);
}

function draw() {
	requestAnimationFrame(draw);

	const rect = canvas.getBoundingClientRect();
	ctx.clearRect(0, 0, rect.width, rect.height);

	const audioData = getSimulatedAudioData(config.barCount);
	const intensity = audioData[0] / 255;

	const minDimension = Math.min(rect.width, rect.height);
	const maxOuterRadius = minDimension * 0.46;

	// Base inner radius factor from Ring 8
	const ring8Factor = RING_SPACING_FACTORS[RING_SPACING_FACTORS.length - 1];
	const baseInnerRadius = maxOuterRadius * 0.72;

	// Shared dynamic radius for Ring 8 and Bars:
	const dynamicRing8Radius = baseInnerRadius * ring8Factor * (0.97 + intensity * 0.05);

	const dynamicMaxBarHeight = maxOuterRadius * 0.28;
	const dynamicMinBarHeight = config.minBarHeight;

	ctx.save();
	ctx.translate(centerX, centerY);

	// 1. Draw 8 Concentric Circles with Selective Neon Glow
	RING_SPACING_FACTORS.forEach((factor, index) => {
		const ringNumber = index + 1;
		const baseRadius = baseInnerRadius * factor;
		const currentRadius = baseRadius * (0.97 + intensity * 0.05);

		ctx.strokeStyle = getRingGradient(ringNumber, currentRadius);
		ctx.lineWidth = (ringNumber % 2 === 1) ? 3 : 1.5;

		if ([1, 3, 5, 8].includes(ringNumber)) {
			ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';
			ctx.shadowBlur = 10 + (intensity * 12);
			ctx.beginPath();
			ctx.arc(0, 0, currentRadius, 0, Math.PI * 2);
			ctx.stroke();
		} else if (ringNumber === 7) {
			ctx.shadowColor = 'transparent';
			ctx.shadowBlur = 0;
			ctx.beginPath();
			ctx.arc(0, 0, currentRadius, 0, Math.PI * 2);
			ctx.stroke();

			ctx.save();
			ctx.beginPath();
			ctx.rect(-currentRadius - 10, -currentRadius - 10, currentRadius + 10, (currentRadius + 10) * 2);
			ctx.clip();

			ctx.shadowColor = COLOR_BLUE;
			ctx.shadowBlur = 10 + (intensity * 12);
			ctx.beginPath();
			ctx.arc(0, 0, currentRadius, 0, Math.PI * 2);
			ctx.stroke();
			ctx.restore();
		} else {
			ctx.shadowColor = 'transparent';
			ctx.shadowBlur = 0;
			ctx.beginPath();
			ctx.arc(0, 0, currentRadius, 0, Math.PI * 2);
			ctx.stroke();
		}
	});

	// 2. Draw Outer Bars styled as Fanning Sun Rays
	const angleStep = (Math.PI * 2) / config.barCount;

	for (let i = 0; i < config.barCount; i++) {
		const value = audioData[i];
		if (value === 0) continue;

		const progress = i / config.barCount;
		const angle = progress * Math.PI * 2;
		const barHeight = dynamicMinBarHeight + (value / 255) * dynamicMaxBarHeight;

		const baseColor = getPureBarColor(angle);

		// Calculate Ray Widths: Narrow at base, wider at outer tip
		const innerRadius = dynamicRing8Radius;
		const outerRadius = dynamicRing8Radius + barHeight;

		// Base width is half the available angle step, fanning out by 2.2x at the tip
		const innerHalfWidth = (angleStep * 0.25);
		const outerHalfWidth = (angleStep * 0.55);

		// Ray Corner Coordinates
		const aInnerLeft = angle - innerHalfWidth;
		const aInnerRight = angle + innerHalfWidth;
		const aOuterLeft = angle - outerHalfWidth;
		const aOuterRight = angle + outerHalfWidth;

		const x1 = Math.cos(aInnerLeft) * innerRadius;
		const y1 = Math.sin(aInnerLeft) * innerRadius;
		const x2 = Math.cos(aOuterLeft) * outerRadius;
		const y2 = Math.sin(aOuterLeft) * outerRadius;
		const x3 = Math.cos(aOuterRight) * outerRadius;
		const y3 = Math.sin(aOuterRight) * outerRadius;
		const x4 = Math.cos(aInnerRight) * innerRadius;
		const y4 = Math.sin(aInnerRight) * innerRadius;

		// Create Radial Linear Gradient for Sun Ray Fade
		const startX = Math.cos(angle) * innerRadius;
		const startY = Math.sin(angle) * innerRadius;
		const endX = Math.cos(angle) * outerRadius;
		const endY = Math.sin(angle) * outerRadius;

		const rayGrad = ctx.createLinearGradient(startX, startY, endX, endY);
		rayGrad.addColorStop(0.0, getRayColorWithAlpha(baseColor, 0.95)); // Bright solid base
		rayGrad.addColorStop(0.7, getRayColorWithAlpha(baseColor, 0.60)); // Soft mid beam
		rayGrad.addColorStop(1.0, getRayColorWithAlpha(baseColor, 0.05)); // Translucent soft tip

		// Pass 1: Outer Fanned Beam (Trapezoid)
		ctx.shadowColor = baseColor;
		ctx.shadowBlur = 10 + ((value / 255) * 12);
		ctx.fillStyle = rayGrad;

		ctx.beginPath();
		ctx.moveTo(x1, y1);
		ctx.lineTo(x2, y2);
		ctx.lineTo(x3, y3);
		ctx.lineTo(x4, y4);
		ctx.closePath();
		ctx.fill();

		// Pass 2: Intense Center Beam Core
		ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';
		ctx.shadowBlur = 6;
		ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(startX, startY);
		ctx.lineTo(endX, endY);
		ctx.stroke();
	}

	ctx.restore();
}

draw();