import { THEME_CONFIG } from '../config/themes.js';

export class ThemeManager {
	constructor(visualizerManager) {
		this.visualizerManager = visualizerManager;
		this.container = document.querySelector('.theme-container');
		this.activeThemeId = THEME_CONFIG[0].id;
		this.init();
	}

	generateRandomPalette() {
		const baseHue1 = Math.floor(Math.random() * 360);
		const baseHue2 = (baseHue1 + 120 + Math.floor(Math.random() * 60)) % 360;
		const baseHue3 = (baseHue1 + 240 + Math.floor(Math.random() * 60)) % 360;

		return {
			primary: `hsla(${baseHue1}, 100%, 50%, 1)`,
			mutedPrimary: `hsla(${baseHue1}, 45%, 45%, 0.7)`,
			secondary: `hsla(${baseHue2}, 100%, 55%, 1)`,
			mutedSecondary: `hsla(${baseHue2}, 45%, 50%, 0.7)`,
			accent: `hsla(${baseHue3}, 100%, 50%, 1)`,
			transparent: 'hsla(0, 0%, 0%, 0)'
		};
	}

	renderThemes() {
		if (!this.container) return;

		const heading = this.container.querySelector('h2');
		const headingHTML = heading ? heading.outerHTML : '<h2>Color Themes</h2>';

		const itemsHTML = THEME_CONFIG.map(theme => {
			const isActive = theme.id === this.activeThemeId;

			let borderGradient = '';
			let circleStyle = '';
			let glowColor1 = '';
			let glowColor2 = '';

			if (theme.isRandom) {
				const rainbowGradient = `conic-gradient(#ff0000, #ff7f00, #ffff00, #00ff00, #5ebdff, #c87dff, #9400d3, #ff0097)`;
				borderGradient = rainbowGradient;
				circleStyle = `background: ${rainbowGradient};`;
				glowColor1 = '#00ffff';
				glowColor2 = '#ff00ff';
			} else {
				// SMOOTH GRADIENT (No 50% hard stops)
				const smoothGradient = `linear-gradient(135deg, ${theme.uiColors[0]}, ${theme.uiColors[1]})`;
				borderGradient = smoothGradient;
				circleStyle = `background: ${smoothGradient};`;
				glowColor1 = theme.uiColors[0];
				glowColor2 = theme.uiColors[1];
			}

			return `
				<div class="theme-item element ${isActive ? 'active' : ''}" 
					 data-theme-id="${theme.id}"
					 style="--theme-border-gradient: ${borderGradient}; 
							--glow-color-1: ${glowColor1}; 
							--glow-color-2: ${glowColor2};">
					<div class="theme-info">
						<span class="theme-name">${theme.name}</span>
						<span class="theme-status">${isActive ? 'Active' : ''}</span>
					</div>
					<div class="theme-circle ${theme.isRandom ? 'random-circle' : ''}" style="${circleStyle}"></div>
				</div>
			`;
		}).join('');

		this.container.innerHTML = headingHTML + itemsHTML;
	}
	init() {
		if (!this.container) return;

		this.renderThemes();

		// Event listener attached to parent container (delegates click to whole .theme-item div)
		this.container.addEventListener('click', (event) => {
			const item = event.target.closest('.theme-item');
			if (!item) return;

			const themeId = item.dataset.themeId;
			const themeObj = THEME_CONFIG.find(t => t.id === themeId);

			if (!themeObj) return;

			// Reset active state & status text across all items
			this.container.querySelectorAll('.theme-item').forEach(el => {
				el.classList.remove('active');
				const statusEl = el.querySelector('.theme-status');
				if (statusEl) statusEl.textContent = '';
			});

			// Activate clicked item
			item.classList.add('active');
			const activeStatusEl = item.querySelector('.theme-status');
			if (activeStatusEl) activeStatusEl.textContent = 'Active';

			this.activeThemeId = themeId;

			// Apply theme palette to visualizer
			if (themeObj.isRandom) {
				const randomPalette = this.generateRandomPalette();
				this.visualizerManager.setPalette(randomPalette);
			} else if (themeObj.palette) {
				this.visualizerManager.setPalette(themeObj.palette);
			}
		});
	}
}