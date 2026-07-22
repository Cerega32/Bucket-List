import {makeAutoObservable} from 'mobx';

export type IColorMode = 'light' | 'dark';

const STORAGE_KEY = 'color-theme';

const getPreferredMode = (): IColorMode => {
	if (typeof window === 'undefined') return 'light';

	const stored = window.localStorage.getItem(STORAGE_KEY);
	if (stored === 'light' || stored === 'dark') return stored;

	return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const applyMode = (mode: IColorMode) => {
	document.documentElement.setAttribute('data-theme', mode);
	const themeColor = document.querySelector('meta[name="theme-color"]');
	if (themeColor) {
		themeColor.setAttribute('content', mode === 'dark' ? '#0D121A' : '#FFFFFF');
	}
};

class Store {
	mode: IColorMode = getPreferredMode();

	constructor() {
		makeAutoObservable(this);
		applyMode(this.mode);

		window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
			// Следуем системе только пока пользователь сам не выбрал тему
			if (window.localStorage.getItem(STORAGE_KEY)) return;
			this.mode = event.matches ? 'dark' : 'light';
			applyMode(this.mode);
		});
	}

	setMode = (mode: IColorMode) => {
		this.mode = mode;
		applyMode(mode);
		window.localStorage.setItem(STORAGE_KEY, mode);
	};

	toggle = () => {
		this.setMode(this.mode === 'dark' ? 'light' : 'dark');
	};
}

export const ThemeModeStore = new Store();
