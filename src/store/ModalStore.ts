import {makeAutoObservable} from 'mobx';

type IWindow = 'login' | 'registration' | 'change-password' | 'add-review' | 'delete-goal' | 'confirm-execution-all-goal';

export type IFuncModal = () => boolean | void | Promise<boolean | void>;

interface IModalStore {
	isOpen: boolean;
	window: IWindow;
	funcModal: IFuncModal;
}

class Store implements IModalStore {
	isOpen = false;

	window: IWindow = 'login';

	funcModal: () => void = () => {};

	constructor() {
		makeAutoObservable(this);
	}

	setIsOpen = (value: boolean) => {
		this.isOpen = value;
	};

	setWindow = (value: IWindow) => {
		this.window = value;
	};

	setFuncModal = (func: IFuncModal) => {
		this.funcModal = func;
	};
}

export const ModalStore = new Store();
