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
		(event: Event) => {
			const target = event.target as HTMLElement;
			if (target.tagName === 'A' || target.closest('a')) {
				// Даем небольшую задержку для завершения навигации
				setTimeout(() => {
					closeWindow();
				}, 100);
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

	// Обработчик свайпа вниз для закрытия модалки
	const handleTouchStart = useCallback(
		(e: TouchEvent) => {
			const touch = e.touches[0];
			const startY = touch.clientY;
			const startTime = Date.now();

			const handleTouchMove = (moveEvent: TouchEvent) => {
				const currentTouch = moveEvent.touches[0];
				const currentY = currentTouch.clientY;
				const deltaY = currentY - startY;
				const deltaTime = Date.now() - startTime;

				// Если свайп вниз больше 100px и быстрый (меньше 300ms)
				if (deltaY > 100 && deltaTime < 300 && modalRef.current) {
					// Проверяем, что контент прокручен в самый верх
					const content = modalRef.current.querySelector('.modal-phone__content');
					if (content && content.scrollTop === 0) {
						closeWindow();
					}
				}
			};

			const handleTouchEnd = () => {
				document.removeEventListener('touchmove', handleTouchMove);
				document.removeEventListener('touchend', handleTouchEnd);
			};

			document.addEventListener('touchmove', handleTouchMove, {passive: true});
			document.addEventListener('touchend', handleTouchEnd);
		},
		[closeWindow]
	);

	useEffect(() => {
		if (isOpen) {
			document.addEventListener('keyup', handleKeyUp);
			document.addEventListener('touchstart', handleTouchStart, {passive: true});

			// Добавляем обработчик кликов по ссылкам
			if (modalRef.current) {
				modalRef.current.addEventListener('click', handleLinkClick);
			}

			// Отключаем прокрутку body при открытии модального окна
			document.body.style.overflow = 'hidden';

			// Устанавливаем фокус на кнопку закрытия
			setTimeout(() => {
				if (closeButtonRef.current) {
					closeButtonRef.current.focus();
				}
			}, 100);
		} else {
			document.removeEventListener('keyup', handleKeyUp);
			document.removeEventListener('touchstart', handleTouchStart);

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
			document.removeEventListener('touchstart', handleTouchStart);
		};
	}, [isOpen, handleKeyUp, handleTouchStart, handleLinkClick]);

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
