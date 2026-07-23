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
	| 'set-regular-goal'
	| 'compare-friend'
	| 'delete-review'
	| 'report-comment';

export type IFuncModal = () => boolean | void | Promise<boolean | void>;

export interface IModalFolder {
	id: number;
	name: string;
	color: string;
	icon: string;
}

/**
 * Пропсы модалок через ModalStore — набор полей зависит от window.
 * Поля, завязанные на доменные типы (entities/features), типизированы как `unknown` —
 * стор живёт в shared и не должен знать о конкретных доменах; вызывающая и читающая
 * сторона (виджет `widgets/modal-root/Modal`, конкретные фичи) сами делают `as X` касты.
 */
export interface IModalProps {
	title?: string;
	initialEmail?: string;
	goalId?: number;
	goalTitle?: string;
	goalFolders?: IModalFolder[];
	onFolderSelected?: (folder: IModalFolder) => void;
	onSuccess?: () => void;
	defaultListId?: string | null;
	/** Форма `IGoalProgress` из `entities/goal/api/goals` */
	currentProgress?: unknown;
	/** Форма `(progress: IGoalProgress) => void | Promise<void>` */
	onProgressUpdate?: unknown;
	onGoalCompleted?: () => void;
	/** Форма `IShortGoal[] | GoalWithLocation[]` из `entities/goal` */
	goals?: unknown[];
	listCode?: string;
	/** Форма `(settings: RegularGoalSettings) => void | Promise<void>` из `features/set-regular-goal` */
	onSave?: unknown;
	/** Форма `Partial<RegularGoalSettings>` из `features/set-regular-goal` */
	initialSettings?: unknown;
	/** Форма `CompareFriendData | null` из `features/compare-friend` */
	comparisonData?: unknown;
	isComparing?: boolean;
	commentId?: number;
	/** Форма `IComment` из `entities/comment` */
	editComment?: unknown;
	goalListId?: number;
	onReviewAdded?: () => void;
	onReviewRemoved?: () => void;
	/** Форма `ILocation` из `entities/goal` */
	location?: unknown;
	userVisitedLocation?: boolean;
	/** Форма `(location: Partial<ILocation>) => void` */
	onLocationSelect?: unknown;
	/** Форма `Partial<ILocation>` */
	initialLocation?: unknown;
}

interface IModalStore {
	isOpen: boolean;
	window: IWindow;
	funcModal: IFuncModal;
	modalProps: IModalProps | null;
}

class Store implements IModalStore {
	isOpen = false;

	window: IWindow = 'login';

	modalProps: IModalProps | null = null;

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

	setModalProps = (props: IModalProps | null) => {
		this.modalProps = props;
	};
}

export const ModalStore = new Store();
