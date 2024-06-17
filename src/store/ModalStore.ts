import {makeAutoObservable} from 'mobx';

type IWindow = 'login' | 'registration' | 'change-password' | 'add-review';

interface IModalStore {
	isOpen: boolean;
	window: IWindow;
}

class Store implements IModalStore {
	isOpen = false;

	window: IWindow = 'login';

	constructor() {
		makeAutoObservable(this);
	}

	setIsOpen = (value: boolean) => {
		this.isOpen = value;
	};

	setWindow = (value: IWindow) => {
		this.window = value;
	};
}

export const ModalStore = new Store();
