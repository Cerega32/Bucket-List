import {IGoalProgress} from '@/entities/goal/api/goals';
import {GoalWithLocation} from '@/entities/goal/api/mapApi';
import {IGoal, ILocation, IRegularGoalConfig, IShortGoal} from '@/entities/goal/model/types';

export interface AsideProps {
	className?: string;
	title: string;
	image: string | null | undefined;
	added: boolean;
	code: string;
	done: boolean;
	goalId?: number;
	userFolders?: Array<{id: number; name: string; color: string; icon: string}>;
	regularConfig?: IRegularGoalConfig;
}

export interface AsideGoalProps extends AsideProps {
	updateGoal: (code: string, operation: 'add' | 'delete' | 'mark' | 'partial' | 'start', done?: boolean) => Promise<void | boolean>;
	isList?: never;
	openAddReview: () => void;
	hasMyComment?: boolean;
	editGoal?: (() => void) | undefined;
	canEdit?: boolean;
	location?: ILocation;
	onGoalCompleted?: () => void; // Новый колбэк для уведомления о завершении цели
	onHistoryRefresh?: () => void; // Колбэк для обновления истории выполнения
	onGoalUpdate?: (updatedGoal?: IGoal | Partial<IGoal>) => void; // Колбэк для обновления цели
	/** Прогресс из ответа GET цели; если передан (включая null), отдельный запрос к /progress/ не делается */
	userProgress?: IGoalProgress | null;
	page?: string; // Текущая страница (для определения, находимся ли мы на странице истории)
	list?: never;
}

export interface AsideListsProps extends AsideProps {
	updateGoal: (code: string, operation: 'add' | 'delete' | 'mark-all') => Promise<void | boolean>;
	isList: true;
	openAddReview?: () => void;
	hasMyComment?: boolean;
	editGoal?: never;
	canEdit?: boolean;
	location?: GoalWithLocation[];
	list?: IShortGoal[];
	listCode?: string;
	hasScratchMap?: boolean;
	onGoalCompleted?: never;
	onHistoryRefresh?: never;
	page?: never;
}
