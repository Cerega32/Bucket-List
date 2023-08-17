import {makeAutoObservable} from 'mobx';

type IWindow = 'login' | 'registration';

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

	setWindow = (value: 'login' | 'registration') => {
		this.window = value;
	};
}

export const ModalStore = new Store();
