import Cookies from 'js-cookie';
import {observer} from 'mobx-react-lite';
import {FC, ReactNode} from 'react';
import {createPortal} from 'react-dom';

import {IGoalProgress} from '@/entities/goal/api/goals';
import {GoalWithLocation} from '@/entities/goal/api/mapApi';
import {ILocation, IShortGoal} from '@/entities/goal/model/types';
import {getUser} from '@/entities/user/api/getUser';
import {UserStore} from '@/entities/user/model/UserStore';
import {AddReview} from '@/features/add-review/AddReview';
import {ChangePassword} from '@/features/change-password/ChangePassword';
import {CompareFriendData, CompareFriendModal} from '@/features/compare-friend/CompareFriendModal';
import {ConfirmExecutionAllGoal} from '@/features/confirm-execution-all-goal/ConfirmExecutionAllGoal';
import {CreateTodoListForm} from '@/features/create-todo-list/CreateTodoListForm';
import {CreateTodoTaskForm} from '@/features/create-todo-task/CreateTodoTaskForm';
import {DeleteGoal} from '@/features/delete-goal/DeleteGoal';
import {DeleteList} from '@/features/delete-goal-list/DeleteList';
import {DeleteReview} from '@/features/delete-review/DeleteReview';
import {FolderSelector} from '@/features/folder-selector/FolderSelector';
import {ForgotPassword} from '@/features/forgot-password/ForgotPassword';
import LocationPicker from '@/features/location-picker/LocationPicker';
import {Login} from '@/features/login/Login';
import {ProgressUpdateModal} from '@/features/progress-update/ProgressUpdateModal';
import {RandomGoalPicker} from '@/features/random-goal-picker/RandomGoalPicker';
import {Registration} from '@/features/registration/Registration';
import {ReportComment} from '@/features/report-comment/ReportComment';
import {RegularGoalSettings, SetRegularGoalModal} from '@/features/set-regular-goal/SetRegularGoalModal';
import {trackProductEvent} from '@/shared/lib/analytics/trackProductEvent';
import {ModalStore} from '@/shared/model/ModalStore';
import {Modal as ModalPrimitive} from '@/shared/ui/Modal/Modal';
import {GoalMap} from '@/widgets/goal-map/GoalMap';
import {GoalMapMulti} from '@/widgets/goal-map/GoalMapMulti';

interface ModalProps {
	className?: string;
	children?: ReactNode;
	isOpen?: boolean;
	onClose?: () => void;
	title?: string;
	size?: 'small' | 'medium' | 'large' | 'fullscreen';
}

/** Модалка-роутер: рендерится один раз в `Layout` и по `ModalStore.window` подставляет нужную фичу-модалку
 * в универсальную обёртку `shared/ui/Modal/Modal`. Пропсы `ModalStore.modalProps`, завязанные на доменные типы,
 * типизированы в сторе как `unknown` — здесь делаем точечные `as X` касты при чтении. */
export const Modal: FC<ModalProps> = observer((props) => {
	const {className, children, isOpen: externalIsOpen, onClose: externalOnClose, title, size} = props;
	const {isOpen: storeIsOpen, setIsOpen, window, setWindow, funcModal, modalProps, setModalProps} = ModalStore;
	const {setIsAuth, setName, setAvatar, setUserInfo, userInfo} = UserStore;

	// Используем внешние пропсы если они переданы, иначе из store
	const isOpen = externalIsOpen !== undefined ? externalIsOpen : storeIsOpen;
	const onClose = externalOnClose || (() => setIsOpen(false));

	const closeWindow = () => {
		onClose();
	};

	const openRegistration = () => {
		trackProductEvent('reg_open', 'login_modal');
		setWindow('registration');
	};

	const openLogin = () => {
		setWindow('login');
	};

	const openForgotPassword = (email?: string) => {
		setModalProps({initialEmail: email ?? ''});
		setWindow('forgot-password');
	};

	const successAuth = (data: {name?: string; email_confirmed?: boolean; email?: string}) => {
		Cookies.set('name', data.name || '');
		closeWindow();
		setName(data.name || '');
		setIsAuth(true);
		setAvatar(Cookies.get('avatar') || '');
		if (data.email_confirmed !== undefined) {
			UserStore.setEmailConfirmed(data.email_confirmed);
		}
		if (data.email) {
			UserStore.setEmail(data.email);
		}
		setUserInfo({
			...userInfo,
			email: data.email || userInfo.email,
			firstName: data.name || userInfo.firstName,
			name: data.name || userInfo.name,
			...(data.email_confirmed !== undefined && {isEmailConfirmed: data.email_confirmed}),
		});
		// Загружаем полный профиль и триггерим обновление данных на страницах
		getUser();
	};

	// Определяем нужен ли скролл для текущего типа окна
	if (!isOpen) return null;

	const currentProgress = modalProps?.currentProgress as IGoalProgress | undefined;
	const onProgressUpdate = modalProps?.onProgressUpdate as ((progress: IGoalProgress) => void | Promise<void>) | undefined;
	const onSave = modalProps?.onSave as ((settings: RegularGoalSettings) => void | Promise<void>) | undefined;
	const initialSettings = modalProps?.initialSettings as Partial<RegularGoalSettings> | undefined;
	const comparisonData = modalProps?.comparisonData as CompareFriendData | null | undefined;
	const location = modalProps?.location as ILocation | undefined;
	const onLocationSelect = modalProps?.onLocationSelect as ((location: Partial<ILocation>) => void) | undefined;
	const initialLocation = modalProps?.initialLocation as Partial<ILocation> | undefined;

	// Если переданы children, используем их вместо стандартного контента
	const modalContent = children || (
		<>
			{window === 'login' && (
				<Login openRegistration={openRegistration} openForgotPassword={openForgotPassword} successLogin={successAuth} />
			)}
			{window === 'registration' && <Registration successRegistration={successAuth} />}
			{window === 'forgot-password' && <ForgotPassword onBack={openLogin} initialEmail={modalProps?.initialEmail} />}
			{window === 'change-password' && <ChangePassword closeModal={closeWindow} />}
			{window === 'add-review' && <AddReview closeModal={closeWindow} />}
			{window === 'delete-goal' && <DeleteGoal closeModal={closeWindow} funcModal={funcModal} />}
			{window === 'delete-list' && <DeleteList closeModal={closeWindow} funcModal={funcModal} />}
			{window === 'delete-review' && <DeleteReview closeModal={closeWindow} funcModal={funcModal} />}
			{window === 'confirm-execution-all-goal' && <ConfirmExecutionAllGoal closeModal={closeWindow} funcModal={funcModal} />}
			{window === 'goal-map' && location && <GoalMap location={location} userVisitedLocation={!!modalProps?.userVisitedLocation} />}
			{window === 'goal-map-multi' && Array.isArray(modalProps?.goals) && (
				<GoalMapMulti goals={modalProps.goals as GoalWithLocation[]} />
			)}
			{window === 'goal-map-add' && onLocationSelect && (
				<LocationPicker closeModal={closeWindow} onLocationSelect={onLocationSelect} initialLocation={initialLocation} />
			)}
			{window === 'folder-selector' && modalProps?.goalId != null && modalProps.goalTitle != null && (
				<FolderSelector
					goalId={modalProps.goalId}
					goalTitle={modalProps.goalTitle}
					goalFolders={modalProps.goalFolders}
					onFolderSelected={(folder) => {
						modalProps.onFolderSelected?.(folder);
						closeWindow();
					}}
					showCreateButton
				/>
			)}
			{window === 'create-todo-list' && (
				<CreateTodoListForm
					onSuccess={() => {
						closeWindow();
						modalProps?.onSuccess?.();
					}}
					onCancel={closeWindow}
				/>
			)}
			{window === 'create-todo-task' && (
				<CreateTodoTaskForm
					defaultListId={modalProps?.defaultListId}
					onSuccess={() => {
						closeWindow();
						modalProps?.onSuccess?.();
					}}
					onCancel={closeWindow}
				/>
			)}
			{window === 'progress-update' && modalProps?.goalId != null && modalProps.goalTitle != null && currentProgress && (
				<ProgressUpdateModal
					key={`${modalProps.goalId}-${currentProgress.id ?? 'new'}`}
					goalId={modalProps.goalId}
					goalTitle={modalProps.goalTitle}
					currentProgress={currentProgress}
					onProgressUpdate={onProgressUpdate ?? (() => undefined)}
					onGoalCompleted={modalProps.onGoalCompleted}
					onClose={closeWindow}
				/>
			)}
			{window === 'random-goal-picker' && (
				<RandomGoalPicker goals={(modalProps?.goals as IShortGoal[]) || []} listCode={modalProps?.listCode} onClose={closeWindow} />
			)}
			{window === 'set-regular-goal' && (
				<SetRegularGoalModal
					onSave={async (settings) => {
						await onSave?.(settings);
					}}
					onCancel={closeWindow}
					initialSettings={initialSettings}
				/>
			)}
			{window === 'compare-friend' && <CompareFriendModal data={comparisonData} isLoading={!!modalProps?.isComparing} />}
			{window === 'report-comment' && modalProps?.commentId && (
				<ReportComment commentId={modalProps.commentId} closeModal={closeWindow} />
			)}
		</>
	);

	// Окно «Прогресс цели»
	if (!children && window === 'progress-update') {
		return createPortal(
			<ModalPrimitive isOpen={isOpen} onClose={closeWindow} className="progress-update-modal" size="medium">
				<ProgressUpdateModal
					key={`${modalProps?.goalId}-${currentProgress?.id ?? 'new'}`}
					goalId={modalProps?.goalId ?? 0}
					goalTitle={modalProps?.goalTitle ?? ''}
					currentProgress={
						currentProgress ?? {
							progressPercentage: 0,
							dailyNotes: '',
							isWorkingToday: true,
							id: 0,
							goal: 0,
							goalTitle: '',
							goalCategory: '',
							goalCategoryNameEn: '',
							goalImage: '',
							goalCode: '',
							lastUpdated: '',
							createdAt: '',
							recentEntries: [],
						}
					}
					onProgressUpdate={onProgressUpdate ?? (() => {})}
					onGoalCompleted={modalProps?.onGoalCompleted}
					onClose={closeWindow}
				/>
			</ModalPrimitive>,
			document.body
		);
	}

	const effectiveSize = size || (window === 'compare-friend' ? 'large' : undefined);
	const windowModifiers: Record<string, boolean | string | undefined> = {
		fullscreen: window === 'goal-map' || window === 'goal-map-multi' || window === 'goal-map-add',
	};

	if (!children) {
		windowModifiers['type'] = window;
	}

	return (
		<ModalPrimitive
			isOpen={isOpen}
			onClose={closeWindow}
			className={className}
			title={title || modalProps?.title}
			size={effectiveSize}
			windowModifiers={windowModifiers}
			closeButtonModifiers={{map: window === 'goal-map' || window === 'goal-map-multi'}}
		>
			{modalContent}
		</ModalPrimitive>
	);
});
