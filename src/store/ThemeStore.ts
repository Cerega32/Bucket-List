import {makeAutoObservable} from 'mobx';

type IHeaderTheme = 'white' | 'transparent';

interface IThemeStore {
	header: IHeaderTheme;
}

class Store implements IThemeStore {
	header: IHeaderTheme = 'transparent';

	footer = true;

	page = 'isMainPage';

	full = true;

	/** Внешнее управление compact-состоянием хедера (например, со страницы цели) */
	preHeaderHiddenOverride: boolean | null = null;

	constructor() {
		makeAutoObservable(this);
	}

	setHeader = (theme: IHeaderTheme) => {
		this.header = theme;
	};

	setPage = (page: string) => {
		this.page = page;
	};

	setFull = (full: boolean) => {
		this.full = full;
	};

	setFooter = (footer: boolean) => {
		this.footer = footer;
	};

	setPreHeaderHiddenOverride = (value: boolean | null) => {
		this.preHeaderHiddenOverride = value;
	};
}

export const ThemeStore = new Store();
