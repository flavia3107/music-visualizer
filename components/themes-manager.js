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

		const itemsHTML = THEME_CONFIG.map(theme => {
			const isActive = theme.id === this.activeThemeId;
			let circleStyle = '';
			if (theme.isRandom) {
				circleStyle = `background: conic-gradient(#ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3, #ff0000);`;
			} else {
				circleStyle = `background: linear-gradient(90deg, ${theme.uiColors[0]} 50%, ${theme.uiColors[1]} 50%);`;
			}

			return `
				<div class="theme-item element ${isActive ? 'active' : ''}" data-theme-id="${theme.id}">
					<div class="theme-info">
						<span class="theme-name">${theme.name}</span>
						<span class="theme-status">${isActive ? 'Active' : ''}</span>
					</div>
					<div class="theme-circle ${theme.isRandom ? 'random-circle' : ''}" style="${circleStyle}"></div>
				</div>
			`;
		}).join('');
		this.container.innerHTML += itemsHTML;
	}

	init() {
		if (!this.container) return;

		this.renderThemes();
		this.container.addEventListener('click', (event) => {
			const item = event.target.closest('.theme-item');
			if (!item) return;

			const themeId = item.dataset.themeId;
			const themeObj = THEME_CONFIG.find(t => t.id === themeId);

			if (!themeObj) return;

			this.container.querySelectorAll('.theme-item').forEach(el => el.classList.remove('active'));
			item.classList.add('active');
			this.activeThemeId = themeId;

			if (themeObj.isRandom) {
				const randomPalette = this.generateRandomPalette();
				this.visualizerManager.setPalette(randomPalette);
			} else if (themeObj.palette) this.visualizerManager.setPalette(themeObj.palette);
		});
	}
}