import {makeAutoObservable} from 'mobx';
import Cookies from 'js-cookie';

interface IUserStore {
	isAuth: boolean;
	name: string;
}

class Store implements IUserStore {
	isAuth = !!Cookies.get('token');

	name = Cookies.get('name') || '';

	constructor() {
		makeAutoObservable(this);
	}

	setIsAuth = (isAuth: boolean) => {
		this.isAuth = isAuth;
	};

	setName = (name: string) => {
		this.name = name;
	};
}

export const UserStore = new Store();
