import {FC, ReactNode, useEffect, useRef} from 'react';
import {createPortal} from 'react-dom';

import {useBem} from '@/shared/lib/hooks/useBem';
import {Button} from '@/shared/ui/Button/Button';
import {Svg} from '@/shared/ui/Svg/Svg';

import '@/shared/ui/Modal/modal.scss';

interface ModalProps {
	className?: string;
	children: ReactNode;
	isOpen: boolean;
	onClose: () => void;
	title?: string;
	size?: 'small' | 'medium' | 'large' | 'fullscreen';
	/** Доп. BEM-модификаторы блока `window` — используются `widgets/modal-root/Modal` для type/fullscreen окон-роутера */
	windowModifiers?: Record<string, boolean | string | undefined>;
	/** Доп. BEM-модификаторы кнопки закрытия */
	closeButtonModifiers?: Record<string, boolean | string | undefined>;
}

/** Универсальная модалка: portal + focus trap + блокировка скролла фона. Используется напрямую фичами/виджетами,
 * а для роутинга модалок по `ModalStore.window` — через `widgets/modal-root/Modal`. */
export const Modal: FC<ModalProps> = (props) => {
	const {className, children, isOpen, onClose, title, size, windowModifiers, closeButtonModifiers} = props;
	const [block, element] = useBem('modal', className);

	// Ссылки на первый и последний фокусируемые элементы
	const modalRef = useRef<HTMLDivElement>(null);
	const closeButtonRef = useRef<HTMLButtonElement>(null);

	const closeWindow = () => {
		onClose();
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

	function findScrollParent(node: HTMLElement | null, boundary: HTMLElement): HTMLElement | null {
		let current = node;
		while (current && current !== boundary) {
			const {overflowY} = getComputedStyle(current);
			if (/(auto|scroll|overlay)/.test(overflowY) && current.scrollHeight > current.clientHeight) {
				return current;
			}
			current = current.parentElement;
		}
		return current && current !== boundary ? current : null;
	}

	// Блокировка прокрутки фона при открытой модалке (полоса прокрутки остаётся видимой)
	useEffect(() => {
		if (!isOpen) return;

		const modal = modalRef.current;

		const preventBackgroundScroll = (e: WheelEvent | TouchEvent) => {
			const target = e.target as Node;
			// Не мешаем нативным взаимодействиям со слайдерами (input[type="range"]) на тач-устройствах.
			if (e instanceof TouchEvent) {
				const targetElement = target instanceof HTMLElement ? target : null;
				if (targetElement?.closest('input[type="range"], [role="slider"]')) {
					return;
				}
			}
			// Вне модалки — всегда блокируем
			if (!modal?.contains(target)) {
				e.preventDefault();
				return;
			}
			// Внутри модалки — блокируем только scroll chaining (колёсико у границы)
			const el = findScrollParent(e.target as HTMLElement, modal);
			if (!el) {
				e.preventDefault();
				return;
			}
			if (e instanceof WheelEvent) {
				const {scrollTop, scrollHeight, clientHeight} = el;
				const atTop = scrollTop <= 0;
				const atBottom = scrollTop + clientHeight >= scrollHeight;
				if ((atTop && e.deltaY < 0) || (atBottom && e.deltaY > 0)) {
					e.preventDefault();
				}
			}
			// touchmove: overscroll-behavior: contain в CSS не даёт скроллу уйти на body
		};

		document.addEventListener('wheel', preventBackgroundScroll, {passive: false});
		document.addEventListener('touchmove', preventBackgroundScroll, {passive: false});

		return () => {
			document.removeEventListener('wheel', preventBackgroundScroll);
			document.removeEventListener('touchmove', preventBackgroundScroll);
		};
	}, [isOpen]);

	useEffect(() => {
		if (!isOpen) return;

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

		return () => {
			document.removeEventListener('keyup', handleKeyUp);
			document.removeEventListener('keydown', handleTabKey);
		};
	}, [isOpen]);

	if (!isOpen) return null;

	const modalElement = (
		<section className={block({isOpen})}>
			<div className={element('window', {...(size ? {[size]: true} : {}), ...windowModifiers})} ref={modalRef}>
				{title && (
					<div className={element('header')}>
						<h2 className={element('title')}>{title}</h2>
					</div>
				)}
				<div className={element('content')}>{children}</div>
				<Button
					theme="blue-light"
					className={element('close', closeButtonModifiers)}
					onClick={closeWindow}
					refInner={closeButtonRef}
				>
					<Svg icon="cross" />
				</Button>
			</div>
			<button aria-label="Закрыть окно" type="button" className={element('base')} onClick={closeWindow} />
		</section>
	);

	// Рендерим модалку в document.body через Portal, чтобы она всегда была на верхнем уровне
	return createPortal(modalElement, document.body);
};
