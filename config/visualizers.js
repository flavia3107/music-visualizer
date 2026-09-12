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
	{
		id: 'radial-bars',
		title: 'Radial Bars',
		icon: 'path/to/radial-bars.svg', // or URL / inline SVG
		active: true
	},
	{
		id: 'waveform-curve',
		title: 'Waveform Curve',
		icon: 'path/to/waveform-curve.svg',
		active: false
	},
	{
		id: 'spectral-peak',
		title: 'Spectral Peak',
		icon: 'path/to/spectral-peak.svg',
		active: false
	},
	{
		id: 'particle-flow',
		title: 'Particle Flow',
		icon: 'path/to/particle-flow.svg',
		active: false
	}
];