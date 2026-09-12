export const RING_GRADIENT_STOPS = {
	1: [[0.00, 'primary'], [0.50, 'primary'], [0.5001, 'secondary'], [1.00, 'secondary']],
	2: [[0.00, 'mutedPrimary'], [0.50, 'mutedPrimary'], [0.5001, 'mutedSecondary'], [1.00, 'mutedSecondary']],
	3: [[0.00, 'secondary'], [0.50, 'secondary'], [0.5001, 'accent'], [1.00, 'accent']],
	4: [[0.00, 'mutedSecondary'], [0.50, 'mutedSecondary'], [0.5001, 'mutedPrimary'], [1.00, 'mutedPrimary']],
	5: [[0.00, 'secondary'], [0.50, 'secondary'], [0.5001, 'primary'], [1.00, 'primary']],
	6: [[0.00, 'mutedPrimary'], [0.50, 'mutedPrimary'], [0.5001, 'transparent'], [1.00, 'transparent']],
	7: [[0.00, 'primary'], [0.50, 'primary'], [0.5001, 'mutedSecondary'], [1.00, 'mutedSecondary']],
	8: [[0.00, 'primary'], [0.35, 'primary'], [0.45, 'secondary'], [0.55, 'secondary'], [0.65, 'accent'], [1.00, 'accent']],
};

export const VIZUALIZATION_MODES = [
	{ id: 'Radial Bars', title: 'Radial Bars', icon: 'images/bars.png', active: true },
	{ id: 'Waveform Curve', title: 'Waveform Curve', icon: 'images/wave.png', active: false },
	{ id: 'Spectral Peak', title: 'Spectral Peak', icon: 'images/spectral.png', active: false },
	{ id: 'Particle Flow', title: 'Particle Flow', icon: 'images/particles.png', active: false }
];