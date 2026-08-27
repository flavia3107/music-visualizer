import { COLOR_THEMES } from '../config/themes.js';

export class ThemeManager {
	constructor(visualizerManager, options = {}) {
		this.visualizerManager = visualizerManager;
		this.containerSelector = options.containerSelector || '.theme-container .theme-item';
		this.themeItems = document.querySelectorAll(this.containerSelector);

		this.init();
	}

	generateRandomPalette() {
		const baseHue1 = Math.floor(Math.random() * 360);
		const baseHue2 = (baseHue1 + 120 + Math.floor(Math.random() * 60)) % 360;
		const baseHue3 = (baseHue1 + 240 + Math.floor(Math.random() * 60)) % 360;

		return {
			blue: `hsla(${baseHue1}, 100%, 50%, 1)`,
			dullBlue: `hsla(${baseHue1}, 45%, 45%, 0.7)`,
			pink: `hsla(${baseHue2}, 100%, 55%, 1)`,
			dullPink: `hsla(${baseHue2}, 45%, 50%, 0.7)`,
			yellow: `hsla(${baseHue3}, 100%, 50%, 1)`,
			transparent: 'hsla(0, 0%, 0%, 0)'
		};
	}

	init() {
		this.themeItems.forEach(item => {
			item.addEventListener('click', () => {
				const themeName = item.textContent.trim();

				this.themeItems.forEach(el => el.classList.remove('active'));
				item.classList.add('active');

				if (themeName === 'Random Theme') {
					const randomPalette = this.generateRandomPalette();
					this.visualizerManager.setPalette(randomPalette);
				} else if (COLOR_THEMES[themeName]) {
					this.visualizerManager.setPalette(COLOR_THEMES[themeName]);
				}
			});
		});
	}
}