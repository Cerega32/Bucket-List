import {makeAutoObservable} from 'mobx';

import type {CompareFriendData} from '@/components/CompareFriendModal/CompareFriendModal';
import type {RegularGoalSettings} from '@/components/SetRegularGoalModal/SetRegularGoalModal';
import type {IComment} from '@/typings/comments';
import type {ILocation, IShortGoal} from '@/typings/goal';
import type {IGoalProgress} from '@/utils/api/goals';
import type {GoalWithLocation} from '@/utils/mapApi';

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

/** Пропсы модалок через ModalStore — набор полей зависит от window. */
export interface IModalProps {
	title?: string;
	initialEmail?: string;
	goalId?: number;
	goalTitle?: string;
	goalFolders?: IModalFolder[];
	onFolderSelected?: (folder: IModalFolder) => void;
	onSuccess?: () => void;
	defaultListId?: string | null;
	currentProgress?: IGoalProgress;
	onProgressUpdate?: (progress: IGoalProgress) => void | Promise<void>;
	onGoalCompleted?: () => void;
	goals?: IShortGoal[] | GoalWithLocation[];
	listCode?: string;
	onSave?: (settings: RegularGoalSettings) => void | Promise<void>;
	initialSettings?: Partial<RegularGoalSettings>;
	comparisonData?: CompareFriendData | null;
	isComparing?: boolean;
	commentId?: number;
	editComment?: IComment;
	goalListId?: number;
	onReviewAdded?: () => void;
	onReviewRemoved?: () => void;
	location?: ILocation;
	userVisitedLocation?: boolean;
	onLocationSelect?: (location: Partial<ILocation>) => void;
	initialLocation?: Partial<ILocation>;
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
