// --- 1. Setup Canvas ---
const canvas = document.getElementById('mainCanvas');
const ctx = canvas.getContext('2d');

let width, height, centerX, centerY;

function adjustCanvasSize() {
	// Measure the actual visible size of the canvas container element
	const rect = canvas.getBoundingClientRect();

	// Use the container's rendered dimensions (or fall back to parent element)
	width = canvas.width = rect.width || canvas.parentElement.clientWidth;
	height = canvas.height = rect.height || canvas.parentElement.clientHeight;

	// Center coordinates inside the actual visible area
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

	// 1. DYNAMIC SCALING: Base scale on height so it fills the vertical space
	const minDimension = Math.min(width, height);

	// Set max radius to ~46% of height (leaving 4% margin so bars don't clip the edges)
	const maxTotalRadius = minDimension * 0.46;

	// Scale up inner circle to 65% of max radius
	const dynamicInnerRadius = maxTotalRadius * 0.65;
	const dynamicMaxBarHeight = maxTotalRadius * 0.35;
	const dynamicMinBarHeight = config.minBarHeight || 5;

	ctx.save();
	ctx.translate(centerX, centerY);

	// 2. Draw Radial Audio Bars
	for (let i = 0; i < config.barCount; i++) {
		const angle = (i / config.barCount) * Math.PI * 2;
		const value = audioData[i];

		const barHeight = dynamicMinBarHeight + (value / 255) * dynamicMaxBarHeight;

		const startX = Math.cos(angle) * dynamicInnerRadius;
		const startY = Math.sin(angle) * dynamicInnerRadius;
		const endX = Math.cos(angle) * (dynamicInnerRadius + barHeight);
		const endY = Math.sin(angle) * (dynamicInnerRadius + barHeight);

		const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
		gradient.addColorStop(0, `hsl(${config.color1.h}, ${config.color1.s}%, ${config.color1.l}%)`);
		gradient.addColorStop(1, `hsl(${config.color2.h}, ${config.color2.s}%, ${config.color2.l}%)`);

		ctx.strokeStyle = gradient;
		ctx.lineWidth = Math.max(3, (dynamicInnerRadius * Math.PI * 2) / config.barCount / 1.3);
		ctx.lineCap = 'round';
		ctx.beginPath();
		ctx.moveTo(startX, startY);
		ctx.lineTo(endX, endY);
		ctx.stroke();
	}

	// 3. Draw Pulsing Inner Concentric Rings
	const pulseRadius = dynamicInnerRadius * (0.85 + intensity * 0.15);

	// Outer pink ring
	ctx.strokeStyle = `hsl(${config.color2.h}, 100%, 50%)`;
	ctx.lineWidth = 3;
	ctx.beginPath();
	ctx.arc(0, 0, pulseRadius * 0.92, 0, Math.PI * 2);
	ctx.stroke();

	// Inner blue ring
	ctx.strokeStyle = `hsl(${config.color1.h}, 100%, 50%)`;
	ctx.lineWidth = 5;
	ctx.beginPath();
	ctx.arc(0, 0, pulseRadius * 0.82, 0, Math.PI * 2);
	ctx.stroke();

	ctx.restore();
}
draw();