import {makeAutoObservable} from 'mobx';

type IWindow =
	| 'login'
	| 'registration'
	| 'forgot-password'
	| 'change-password'
	| 'add-review'
	| 'delete-goal'
	| 'delete-list'
	| 'confirm-execution-all-goal'
	| 'goal-map'
	| 'goal-map-multi'
	| 'goal-map-add'
	| 'create-todo-list'
	| 'create-todo-task'
	| 'folder-selector'
	| 'progress-update'
	| 'random-goal-picker'
	| 'set-regular-goal';

export type IFuncModal = () => boolean | void | Promise<boolean | void>;

interface IModalStore {
	isOpen: boolean;
	window: IWindow;
	funcModal: IFuncModal;
}

class Store implements IModalStore {
	isOpen = false;

	window: IWindow = 'login';

	modalProps: any;

	// eslint-disable-next-line class-methods-use-this
	funcModal: IFuncModal = () => undefined;

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

	setModalProps = (props: any) => {
		this.modalProps = props;
	};
}

export const ModalStore = new Store();
