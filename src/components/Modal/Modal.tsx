import Cookies from 'js-cookie';
import {observer} from 'mobx-react-lite';
import {FC, ReactNode, useEffect, useRef} from 'react';

import {Button} from '@/components/Button/Button';
import {Login} from '@/components/Login/Login';
import {Registration} from '@/components/Registration/Registration';
import {useBem} from '@/hooks/useBem';
import {ModalStore} from '@/store/ModalStore';
import {UserStore} from '@/store/UserStore';

import {AddReview} from '../AddReview/AddReview';
import {ChangePassword} from '../ChangePassword/ChangePassword';
import {ConfirmExecutionAllGoal} from '../ConfirmExecutionAllGoal/ConfirmExecutionAllGoal';
import {CreateTodoListForm} from '../CreateTodoListForm/CreateTodoListForm';
import {CreateTodoTaskForm} from '../CreateTodoTaskForm/CreateTodoTaskForm';
import {DeleteGoal} from '../DeleteGoal/DeleteGoal';
import {FolderSelector} from '../FolderSelector/FolderSelector';
import {GoalMap} from '../GoalMap/GoalMap';
import {GoalMapMulti} from '../GoalMap/GoalMapMulti';
import LocationPicker from '../LocationPicker/LocationPicker';
import {ProgressUpdateModal} from '../ProgressUpdateModal/ProgressUpdateModal';
import {RandomGoalPicker} from '../RandomGoalPicker/RandomGoalPicker';
import {Svg} from '../Svg/Svg';

import './modal.scss';

interface ModalProps {
	className?: string;
	children?: ReactNode;
	isOpen?: boolean;
	onClose?: () => void;
	title?: string;
}

export const Modal: FC<ModalProps> = observer((props) => {
	const {className, children, isOpen: externalIsOpen, onClose: externalOnClose, title} = props;
	const [block, element] = useBem('modal', className);
	const {isOpen: storeIsOpen, setIsOpen, window, setWindow, funcModal, modalProps} = ModalStore;
	const {setIsAuth, setName, setAvatar} = UserStore;

	// Используем внешние пропсы если они переданы, иначе из store
	const isOpen = externalIsOpen !== undefined ? externalIsOpen : storeIsOpen;
	const onClose = externalOnClose || (() => setIsOpen(false));

	// Ссылки на первый и последний фокусируемые элементы
	const modalRef = useRef<HTMLDivElement>(null);
	const closeButtonRef = useRef<HTMLButtonElement>(null);

	const closeWindow = () => {
		onClose();
	};

	const openRegistration = () => {
		setWindow('registration');
	};

	const openLogin = () => {
		setWindow('login');
	};

	const successAuth = (data: {name: string}) => {
		Cookies.set('name', data.name || '');
		closeWindow();
		setName(data.name || '');
		setIsAuth(true);
		setAvatar(Cookies.get('avatar') || '');
	};

	const handleKeyUp = (e: KeyboardEvent) => {
		if (e.key === 'Escape') {
			closeWindow();
		}
	};

	// Обработчик для ловушки фокуса
	const handleTabKey = (e: KeyboardEvent) => {
		if (e.key !== 'Tab') return;

		if (!modalRef.current) return;

		// Получаем все фокусируемые элементы внутри модалки
		const focusableElements = modalRef.current.querySelectorAll(
			'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
		);

		if (focusableElements.length === 0) return;

		const firstElement = focusableElements[0] as HTMLElement;
		const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

		// Если нажат Shift+Tab и фокус на первом элементе - переходим к последнему
		if (e.shiftKey && document.activeElement === firstElement) {
			e.preventDefault();
			lastElement.focus();
		}

		// Если нажат Tab и фокус на последнем элементе - переходим к первому
		else if (!e.shiftKey && document.activeElement === lastElement) {
			e.preventDefault();
			firstElement.focus();
		}
	};

	useEffect(() => {
		if (isOpen) {
			document.addEventListener('keyup', handleKeyUp);
			document.addEventListener('keydown', handleTabKey);

			// Устанавливаем начальный фокус на первый элемент
			setTimeout(() => {
				if (modalRef.current) {
					const focusableElements = modalRef.current.querySelectorAll(
						'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
					);
					if (focusableElements.length > 0) {
						(focusableElements[0] as HTMLElement).focus();
					} else if (closeButtonRef.current) {
						closeButtonRef.current.focus();
					}
				}
			}, 50);

			// Отключаем прокрутку body при открытии модального окна
			// document.body.style.overflow = 'hidden';
		} else {
			document.removeEventListener('keyup', handleKeyUp);
			document.removeEventListener('keydown', handleTabKey);

			// Включаем прокрутку body при закрытии модального окна
			// document.body.style.overflow = '';
		}

		// Cleanup при размонтировании компонента
		return () => {
			document.body.style.overflow = '';
		};
	}, [isOpen]);

	// Определяем нужен ли скролл для текущего типа окна
	if (!isOpen) return null;

	// Если переданы children, используем их вместо стандартного контента
	const modalContent = children || (
		<>
			{window === 'login' && <Login openRegistration={openRegistration} successLogin={successAuth} />}
			{window === 'registration' && <Registration openLogin={openLogin} successRegistration={successAuth} />}
			{window === 'change-password' && <ChangePassword closeModal={closeWindow} />}
			{window === 'add-review' && <AddReview closeModal={closeWindow} />}
			{window === 'delete-goal' && <DeleteGoal closeModal={closeWindow} funcModal={funcModal} />}
			{window === 'delete-list' && <DeleteGoal closeModal={closeWindow} funcModal={funcModal} />}
			{window === 'confirm-execution-all-goal' && <ConfirmExecutionAllGoal closeModal={closeWindow} funcModal={funcModal} />}
			{window === 'goal-map' && <GoalMap {...modalProps} />}
			{window === 'goal-map-multi' && <GoalMapMulti {...modalProps} />}
			{window === 'goal-map-add' && <LocationPicker closeModal={closeWindow} {...modalProps} />}
			{window === 'folder-selector' && (
				<FolderSelector
					goalId={modalProps?.goalId}
					goalTitle={modalProps?.goalTitle}
					onFolderSelected={(folderId, folderName) => {
						modalProps?.onFolderSelected?.(folderId, folderName);
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
			{window === 'progress-update' && (
				<ProgressUpdateModal
					goalId={modalProps?.goalId}
					goalTitle={modalProps?.goalTitle}
					currentProgress={modalProps?.currentProgress}
					onProgressUpdate={modalProps?.onProgressUpdate}
					onClose={closeWindow}
				/>
			)}
			{window === 'random-goal-picker' && <RandomGoalPicker goals={modalProps?.goals || []} onClose={closeWindow} />}
		</>
	);

	return (
		<section className={block({isOpen})}>
			<div
				className={element('window', {
					type: window,
					fullscreen: window === 'goal-map' || window === 'goal-map-multi' || window === 'goal-map-add',
				})}
				ref={modalRef}
			>
				{title && (
					<div className={element('header')}>
						<h2 className={element('title')}>{title}</h2>
					</div>
				)}
				<div className={element('content')}>{modalContent}</div>
				<Button
					theme="blue-light"
					className={element('close', {map: window === 'goal-map' || window === 'goal-map-multi'})}
					onClick={closeWindow}
					refInner={closeButtonRef}
				>
					<Svg icon="cross" />
				</Button>
			</div>
			<button aria-label="Закрыть окно" type="button" className={element('base')} onClick={closeWindow} />
		</section>
	);
});
