import {makeAutoObservable} from 'mobx';

type IHeaderTheme = 'white' | 'transparent';

interface IThemeStore {
	header: IHeaderTheme;
}

class Store implements IThemeStore {
	header: IHeaderTheme = 'transparent';

	page = 'isMainPage';

	constructor() {
		makeAutoObservable(this);
	}

	setHeader = (theme: IHeaderTheme) => {
		this.header = theme;
	};

	setPage = (page: string) => {
		this.page = page;
	};
}

export const ThemeStore = new Store();
