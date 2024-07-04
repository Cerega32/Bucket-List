import {makeAutoObservable} from 'mobx';

type IWindow = 'login' | 'registration' | 'change-password' | 'add-review' | 'delete-goal' | 'confirm-execution-all-goal';

interface IModalStore {
	isOpen: boolean;
	window: IWindow;
}

class Store implements IModalStore {
	isOpen = true;

	window: IWindow = 'confirm-execution-all-goal';

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
