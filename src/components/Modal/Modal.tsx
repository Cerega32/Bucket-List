import Cookies from 'js-cookie';
import {observer} from 'mobx-react-lite';
import {FC, useEffect, useRef} from 'react';

import {Button} from '@/components/Button/Button';
import {Login} from '@/components/Login/Login';
import {Registration} from '@/components/Registration/Registration';
import {useBem} from '@/hooks/useBem';
import {ModalStore} from '@/store/ModalStore';
import {UserStore} from '@/store/UserStore';

import {AddReview} from '../AddReview/AddReview';
import {ChangePassword} from '../ChangePassword/ChangePassword';
import {ConfirmExecutionAllGoal} from '../ConfirmExecutionAllGoal/ConfirmExecutionAllGoal';
import {DeleteGoal} from '../DeleteGoal/DeleteGoal';
import {Svg} from '../Svg/Svg';
import './modal.scss';

interface ModalProps {
	className?: string;
}

export const Modal: FC<ModalProps> = observer((props) => {
	const {className} = props;
	const [block, element] = useBem('modal', className);
	const {isOpen, setIsOpen, window, setWindow, funcModal} = ModalStore;
	const {setIsAuth, setName, setAvatar} = UserStore;

	// Ссылки на первый и последний фокусируемые элементы
	const modalRef = useRef<HTMLDivElement>(null);
	const closeButtonRef = useRef<HTMLButtonElement>(null);

	const closeWindow = () => {
		setIsOpen(false);
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
		} else {
			document.removeEventListener('keyup', handleKeyUp);
			document.removeEventListener('keydown', handleTabKey);
		}
		return () => {
			document.removeEventListener('keyup', handleKeyUp);
			document.removeEventListener('keydown', handleTabKey);
		}; // eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isOpen, setIsOpen]);

	if (!isOpen) return null;

	return (
		<section className={block({isOpen})}>
			<div className={element('window', {type: window})} ref={modalRef}>
				{window === 'login' && <Login openRegistration={openRegistration} successLogin={successAuth} />}
				{window === 'registration' && <Registration openLogin={openLogin} successRegistration={successAuth} />}
				{window === 'change-password' && <ChangePassword closeModal={closeWindow} />}
				{window === 'add-review' && <AddReview closeModal={closeWindow} />}
				{window === 'delete-goal' && <DeleteGoal closeModal={closeWindow} funcModal={funcModal} />}
				{window === 'delete-list' && <DeleteGoal closeModal={closeWindow} funcModal={funcModal} />}
				{window === 'confirm-execution-all-goal' && <ConfirmExecutionAllGoal closeModal={closeWindow} funcModal={funcModal} />}
				<Button theme="blue-light" className={element('close')} onClick={closeWindow} refInner={closeButtonRef}>
					<Svg icon="cross" />
				</Button>
			</div>
			<button aria-label="Закрыть окно" type="button" className={element('base')} onClick={closeWindow} />
		</section>
	);
});
