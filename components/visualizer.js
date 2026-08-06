import { Particle } from './particle.js';

// --- 1. Setup Canvas ---
const canvas = document.getElementById('mainCanvas');
const ctx = canvas.getContext('2d');
const COLOR_BLUE = 'hsla(195, 100%, 50%, 1)';
const COLOR_DULL_BLUE = 'hsla(195, 45%, 45%, 0.7)';
const COLOR_PINK = 'hsla(320, 100%, 55%, 1)';
const COLOR_DULL_PINK = 'hsla(320, 45%, 50%, 0.7)';
const COLOR_YELLOW = 'hsla(45, 100%, 50%, 1)';
const COLOR_TRANSPARENT = 'hsla(0, 0%, 0%, 0)';
const config = { barCount: 160, minBarHeight: 0 };
const RING_SPACING_FACTORS = [0.18, 0.24, 0.38, 0.50, 0.64, 0.74, 0.84, 0.95];
const particles = [];

let simRotation = 0;
let width, height, centerX, centerY;

function _getSimulatedAudioData(bufferLength) {
	const raw = new Uint8Array(bufferLength);
	for (let i = 0; i < bufferLength; i++) {
		const norm = i / bufferLength;
		const wave1 = Math.sin(norm * Math.PI * 4 + simRotation * 2) * 50;
		const wave2 = Math.cos(norm * Math.PI * 2 - simRotation * 1.5) * 40;
		const peak = Math.exp(-Math.pow((norm - 0.25) * 6, 2)) * 120;
		const val = Math.max(0, wave1 + wave2 + peak + (Math.random() * 8));
		raw[i] = Math.min(255, val);
	}
	simRotation += 0.012;

	const smoothed = new Uint8Array(bufferLength);
	for (let i = 0; i < bufferLength; i++) {
		const prev = raw[(i - 1 + bufferLength) % bufferLength];
		const curr = raw[i];
		const next = raw[(i + 1) % bufferLength];
		smoothed[i] = (prev * 0.25) + (curr * 0.5) + (next * 0.25);
	}

	return smoothed;
}

function _getRingGradient(ringNumber, radius) {
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

function _getPureBarColor(angle) {
	const cosVal = Math.cos(angle);
	const sinVal = Math.sin(angle);

	if (Math.abs(sinVal) > 0.82) {
		return COLOR_PINK;
	}

	return cosVal < 0 ? COLOR_BLUE : COLOR_YELLOW;
}

export function draw() {
	requestAnimationFrame(draw);

	const rect = canvas.getBoundingClientRect();
	ctx.clearRect(0, 0, rect.width, rect.height);

	const audioData = _getSimulatedAudioData(config.barCount);
	const intensity = audioData[0] / 255;
	const minDimension = Math.min(rect.width, rect.height);
	const maxOuterRadius = minDimension * 0.44;
	const ring8Factor = RING_SPACING_FACTORS[RING_SPACING_FACTORS.length - 1];
	const baseInnerRadius = maxOuterRadius * 0.72;
	const dynamicRing8Radius = baseInnerRadius * ring8Factor * (0.97 + intensity * 0.05);
	const dynamicMaxBarHeight = maxOuterRadius * 0.35;
	const dynamicMinBarHeight = config.minBarHeight;

	ctx.save();
	ctx.translate(centerX, centerY);

	RING_SPACING_FACTORS.forEach((factor, index) => {
		const ringNumber = index + 1;
		const baseRadius = baseInnerRadius * factor;
		const currentRadius = baseRadius * (0.97 + intensity * 0.05);

		ctx.strokeStyle = _getRingGradient(ringNumber, currentRadius);
		ctx.lineWidth = (ringNumber % 2 === 1) ? 3 : 1.5;

		if ([1, 3, 5, 8].includes(ringNumber)) {
			ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';
			ctx.shadowBlur = 8 + (intensity * 10);
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
			ctx.shadowBlur = 8 + (intensity * 10);
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

	const circum = dynamicRing8Radius * Math.PI * 2;
	const barWidth = Math.max(1.8, (circum / config.barCount) * 0.55);

	for (let i = 0; i < config.barCount; i++) {
		const value = audioData[i];
		if (value < 2) continue;

		const progress = i / config.barCount;
		const angle = progress * Math.PI * 2;
		const barHeight = dynamicMinBarHeight + (value / 255) * dynamicMaxBarHeight;
		const startX = Math.cos(angle) * dynamicRing8Radius;
		const startY = Math.sin(angle) * dynamicRing8Radius;
		const endX = Math.cos(angle) * (dynamicRing8Radius + barHeight);
		const endY = Math.sin(angle) * (dynamicRing8Radius + barHeight);
		const color = _getPureBarColor(angle);
		ctx.strokeStyle = color;

		// Smooth glow
		ctx.shadowColor = color;
		ctx.shadowBlur = 4 + ((value / 255) * 6);
		ctx.lineWidth = barWidth;
		ctx.lineCap = 'round';
		ctx.beginPath();
		ctx.moveTo(startX, startY);
		ctx.lineTo(endX, endY);
		ctx.stroke();

		if (value > 60 && Math.random() < 0.25) particles.push(new Particle(endX, endY, angle, color));

	}

	// 3. Update & Draw Particles
	for (let i = particles.length - 1; i >= 0; i--) {
		const p = particles[i];
		p.update();
		if (p.alpha <= 0) particles.splice(i, 1);
		else p.draw(ctx);
	}

	ctx.restore();
}

export function adjustCanvasSize() {
	const rect = canvas.getBoundingClientRect();
	const dpr = window.devicePixelRatio || 1;

	width = canvas.width = rect.width * dpr;
	height = canvas.height = rect.height * dpr;

	ctx.scale(dpr, dpr);

	centerX = rect.width / 2;
	centerY = rect.height / 2;
}


/* ==========================================================================
   MUSIC VISUALIZER - FEATURE ROADMAP & TODO
   ==========================================================================

   Planned Core Features:
   1. Audio Input: Upload local audio files or fetch track via URL
   2. Audio Visualization: Render real-time graphics reacting to audio frequencies
   3. Playlist Management: Upload, store, and manage a queue/list of songs
   4. Media Controls: Play, pause, skip next/previous, volume, track seeking
   5. Visualizer Modes: Implement 4 distinct visualizer presets (e.g., Frequency Bars, Oscilloscope Waveform, Circular Spectrum, Particle Field)
   6. Custom Themes: Color palettes/themes for visualizer and UI background
   7. Immersive Display: Fullscreen mode toggle

   Technical Features to Add:
   - Web Audio API Setup: AudioContext, AnalyserNode, MediaElementAudioSourceNode
   - CORS & Audio CORS Handling: Set crossOrigin = "anonymous" for external audio URLs
   - Responsive Canvas Engine: Window resize listener & devicePixelRatio handling for crisp graphics
   - Audio Metadata & Track Info: Display song title, artist, duration, current time
   - Interactive Visualizer Controls: Sensitivity/gain slider, FFT size adjustment (smoothing)
   - Performance Optimization: requestAnimationFrame loop cleanup on pause/stop to save CPU/GPU resources
   - Drag & Drop Interface: Allow dropping audio files directly onto the visualizer canvas
   ========================================================================== */