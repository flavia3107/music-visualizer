// --- 1. Setup Canvas ---
const canvas = document.getElementById('mainCanvas');
const ctx = canvas.getContext('2d');

let width, height, centerX, centerY;

function adjustCanvasSize() {
	width = canvas.width = window.innerWidth;
	height = canvas.height = window.innerHeight;
	centerX = width / 2;
	centerY = height / 2;
}

window.addEventListener('resize', adjustCanvasSize);
adjustCanvasSize(); // Initial call


// --- 2. Define the Visualization Parameters (Identical to Image) ---
const config = {
	// Colors based on HSL for easy shifting
	color1: { h: 195, s: 100, l: 50 }, // Cyber Cyan (#00f3ff)
	color2: { h: 330, s: 100, l: 50 }, // Neon Pink (#ff007f)
	color3: { h: 45, s: 100, l: 50 },  // Solar Gold (#ffcc00)

	particleCount: 150,
	barCount: 128, // How many bars in the circle
	innerRadius: 120, // Size of the empty center
	minBarHeight: 5,
	maxBarHeight: 100
};


// --- 3. Particle System (For the background dust) ---
class Particle {
	constructor() {
		this.reset();
	}
	reset() {
		this.x = Math.random() * width;
		this.y = Math.random() * height;
		this.size = Math.random() * 2 + 0.5;
		this.speedX = (Math.random() - 0.5) * 0.5;
		this.speedY = (Math.random() - 0.5) * 0.5;
		this.life = Math.random() * 0.5 + 0.5; // Opacity
	}
	update(audioIntensity) {
		this.x += this.speedX * (1 + audioIntensity * 2);
		this.y += this.speedY * (1 + audioIntensity * 2);

		// Wrap around screen
		if (this.x < 0) this.x = width;
		if (this.x > width) this.x = 0;
		if (this.y < 0) this.y = height;
		if (this.y > height) this.y = 0;
	}
	draw(ctx, color) {
		ctx.globalAlpha = this.life;
		ctx.fillStyle = color;
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
		ctx.fill();
		ctx.globalAlpha = 1; // Reset
	}
}

const particles = [];
for (let i = 0; i < config.particleCount; i++) {
	particles.push(new Particle());
}


// --- 4. Simulated Audio Data (Replace this with real Web Audio API) ---
let simRotation = 0;
function getSimulatedAudioData(bufferLength) {
	const data = new Uint8Array(bufferLength);
	for (let i = 0; i < bufferLength; i++) {
		// Create a wave pattern that pulses
		const base = Math.sin(i * 0.1 + simRotation * 2) * 50 + 50;
		const pulse = Math.sin(simRotation * 5) * 30;
		data[i] = Math.max(0, base + pulse + (Math.random() * 10));
	}
	simRotation += 0.01;
	return data;
}


// --- 5. The Main Draw Loop ---
function draw() {
	requestAnimationFrame(draw);

	// A. Get Data (Using simulated data for now)
	const audioData = getSimulatedAudioData(config.barCount);
	// Simple intensity calculation based on the first few bars (bass)
	const intensity = audioData[0] / 255;


	// C. Draw Radial Visualization
	ctx.save();
	ctx.translate(centerX, centerY);
	// ctx.rotate(simRotation * 0.2); // Optional: Slow rotation of the whole viz

	for (let i = 0; i < config.barCount; i++) {
		// Calculate the angle for this bar (0 to 360 degrees)
		const angle = (i / config.barCount) * Math.PI * 2;

		// Convert audio data to bar height
		const value = audioData[i];
		const barHeight = config.minBarHeight + (value / 255) * config.maxBarHeight;

		// Calculate start and end points using trigonometry
		const startX = Math.cos(angle) * config.innerRadius;
		const startY = Math.sin(angle) * config.innerRadius;
		const endX = Math.cos(angle) * (config.innerRadius + barHeight);
		const endY = Math.sin(angle) * (config.innerRadius + barHeight);

		// Define the color gradient for this bar (Cyan -> Pink)
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

	// D. Draw Inner Circles (The pink/blue concentric rings)
	const pulseRadius = config.innerRadius * (0.8 + intensity * 0.2);

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

	ctx.restore(); // Restore center coordinates
}

// Start the loop
draw();