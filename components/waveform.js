const canvas = document.getElementById('waveformCanvas');
const ctx = canvas.getContext('2d');

// Color constants
const COLOR_BLUE = 'hsla(195, 100%, 50%, 1)';
const COLOR_PURPLE = 'hsla(260, 90%, 55%, 1)'; // Transition color
const COLOR_PINK = 'hsla(320, 100%, 55%, 1)';

const COLOR_DULL_BLUE = 'hsla(195, 45%, 45%, 0.3)';
const COLOR_DULL_PURPLE = 'hsla(260, 45%, 50%, 0.3)';
const COLOR_DULL_PINK = 'hsla(320, 45%, 50%, 0.3)';

/**
 * Render Waveform Curve
 * @param {Uint8Array|Array} audioData - Frequency or time-domain data (e.g. from AnalyserNode.getByteFrequencyData)
 */
function drawWaveformCurve(audioData) {
	const width = canvas.width;
	const height = canvas.height;
	const centerY = height / 2;

	ctx.clearRect(0, 0, width, height);

	// 1. Create Gradients (Blue -> Purple -> Pink)
	const strokeGradient = ctx.createLinearGradient(0, 0, width, 0);
	strokeGradient.addColorStop(0, COLOR_BLUE);
	strokeGradient.addColorStop(0.5, COLOR_PURPLE);
	strokeGradient.addColorStop(1, COLOR_PINK);

	const fillGradient = ctx.createLinearGradient(0, 0, width, 0);
	fillGradient.addColorStop(0, COLOR_DULL_BLUE);
	fillGradient.addColorStop(0.5, COLOR_DULL_PURPLE);
	fillGradient.addColorStop(1, COLOR_DULL_PINK);

	if (!audioData || audioData.length === 0) return;

	// 2. Begin Path
	ctx.beginPath();
	ctx.moveTo(0, centerY);

	const sliceWidth = width / (audioData.length - 1);

	// Smooth Bezier curve through data points
	for (let i = 0; i < audioData.length - 1; i++) {
		// Normalize value from 0-255 to amplitude range centered on screen
		const v1 = (audioData[i] / 128.0) - 1.0;
		const v2 = (audioData[i + 1] / 128.0) - 1.0;

		const x1 = i * sliceWidth;
		const y1 = centerY + (v1 * (height / 2.5));

		const x2 = (i + 1) * sliceWidth;
		const y2 = centerY + (v2 * (height / 2.5));

		// Use control points to create smooth quadratic curves
		const xc = (x1 + x2) / 2;
		const yc = (y1 + y2) / 2;

		ctx.quadraticCurveTo(x1, y1, xc, yc);
	}

	// 3. Render Area Fill Underneath
	ctx.save();
	ctx.lineTo(width, height);
	ctx.lineTo(0, height);
	ctx.closePath();
	ctx.fillStyle = fillGradient;
	ctx.fill();
	ctx.restore();

	// 4. Render Top Glowing Curve Line
	ctx.beginPath();
	ctx.moveTo(0, centerY);
	for (let i = 0; i < audioData.length - 1; i++) {
		const v1 = (audioData[i] / 128.0) - 1.0;
		const v2 = (audioData[i + 1] / 128.0) - 1.0;

		const x1 = i * sliceWidth;
		const y1 = centerY + (v1 * (height / 2.5));
		const x2 = (i + 1) * sliceWidth;
		const y2 = centerY + (v2 * (height / 2.5));

		const xc = (x1 + x2) / 2;
		const yc = (y1 + y2) / 2;

		ctx.quadraticCurveTo(x1, y1, xc, yc);
	}

	ctx.strokeStyle = strokeGradient;
	ctx.lineWidth = 3;
	ctx.shadowColor = COLOR_PURPLE;
	ctx.shadowBlur = 12; // Gives a subtle neon glow
	ctx.stroke();
}

// Dummy data generator using animated sine waves
let phase = 0;

function generateDummyData(length = 64) {
	const dummyArray = new Uint8Array(length);
	phase += 0.05; // Controls wave animation speed

	for (let i = 0; i < length; i++) {
		// Combine multiple sine waves for a natural dynamic motion
		const wave1 = Math.sin(i * 0.15 + phase);
		const wave2 = Math.cos(i * 0.08 - phase * 0.5) * 0.5;
		const normalized = (wave1 + wave2) / 1.5; // Scale to ~ -1 to 1

		// Map range (-1 to 1) to Uint8 byte range (0 to 255, centered at 128)
		dummyArray[i] = Math.floor(128 + normalized * 80);
	}

	return dummyArray;
}

export function animateDummyWaveform() {
	const fakeAudioData = generateDummyData(64);
	drawWaveformCurve(fakeAudioData);
	requestAnimationFrame(animateDummyWaveform);
}

