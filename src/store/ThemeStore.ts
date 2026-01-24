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
}

export const ThemeStore = new Store();
