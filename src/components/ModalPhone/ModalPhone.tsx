import {observer} from 'mobx-react-lite';
import {FC, ReactNode, useCallback, useEffect, useRef} from 'react';

import {useBem} from '@/hooks/useBem';
import {ModalStore} from '@/store/ModalStore';

import {Button} from '../Button/Button';
import './modal-phone.scss';

interface ModalPhoneProps {
	className?: string;
	children?: ReactNode;
	isOpen?: boolean;
	onClose?: () => void;
	title?: string;
}

export const ModalPhone: FC<ModalPhoneProps> = observer((props) => {
	const {className, children, isOpen: externalIsOpen, onClose: externalOnClose, title} = props;
	const [block, element] = useBem('modal-phone', className);
	const {isOpen: storeIsOpen, setIsOpen} = ModalStore;

	// Используем внешние пропсы если они переданы, иначе из store
	const isOpen = externalIsOpen !== undefined ? externalIsOpen : storeIsOpen;
	const onClose = externalOnClose || (() => setIsOpen(false));

	// Ссылки на элементы модалки
	const modalRef = useRef<HTMLDivElement>(null);
	const closeButtonRef = useRef<HTMLButtonElement>(null);

	const closeWindow = useCallback(() => {
		onClose();
	}, [onClose]);

	// Обработчик кликов по ссылкам для автоматического закрытия модалки
	const handleLinkClick = useCallback(
		(event: MouseEvent) => {
			const target = event.target as HTMLElement;
			const link = target.tagName === 'A' ? (target as HTMLAnchorElement) : (target.closest('a') as HTMLAnchorElement);

			if (link) {
				// Проверяем, не является ли ссылка внешней или с target="_blank"
				const isExternal = link.target === '_blank' || link.hostname !== window.location.hostname;

				// Для внутренних ссылок даем время на навигацию перед закрытием
				if (!isExternal) {
					// Предотвращаем немедленное закрытие, даем время на навигацию
					setTimeout(() => {
						closeWindow();
					}, 150);
				} else {
					// Для внешних ссылок закрываем сразу
					closeWindow();
				}
			}
		},
		[closeWindow]
	);

	const handleKeyUp = useCallback(
		(e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				closeWindow();
			}
		},
		[closeWindow]
	);

	useEffect(() => {
		if (isOpen) {
			document.addEventListener('keyup', handleKeyUp);

			// Добавляем обработчик кликов по ссылкам
			if (modalRef.current) {
				modalRef.current.addEventListener('click', handleLinkClick);
			}

			// Отключаем прокрутку body при открытии модального окна
			document.body.style.overflow = 'hidden';

			// Устанавливаем фокус на кнопку закрытия, если внутри модалки нет элемента с фокусом
			setTimeout(() => {
				if (modalRef.current && !modalRef.current.contains(document.activeElement)) {
					closeButtonRef.current?.focus();
				}
			}, 350);
		} else {
			document.removeEventListener('keyup', handleKeyUp);

			// Удаляем обработчик кликов по ссылкам
			if (modalRef.current) {
				modalRef.current.removeEventListener('click', handleLinkClick);
			}

			// Включаем прокрутку body при закрытии модального окна
			document.body.style.overflow = '';
		}

		// Cleanup при размонтировании компонента
		return () => {
			document.body.style.overflow = '';
			document.removeEventListener('keyup', handleKeyUp);
		};
	}, [isOpen, handleKeyUp, handleLinkClick]);

	// Определяем нужен ли скролл для текущего типа окна
	if (!isOpen) return null;

	return (
		<section className={block({isOpen})}>
			<div className={element('window')} ref={modalRef}>
				<div className={element('header')}>
					{title && <h2 className={element('title')}>{title}</h2>}
					<Button type="button-close" onClick={closeWindow} refInner={closeButtonRef} aria-label="Закрыть окно" />
				</div>
				<div className={element('content')}>{children}</div>
			</div>
		</section>
	);
});
