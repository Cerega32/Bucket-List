import {observer} from 'mobx-react-lite';
import {FC, useEffect, useRef} from 'react';

import {Button} from '@/components/Button/Button';
import {Svg} from '@/components/Svg/Svg';
import {useBem} from '@/hooks/useBem';
import './modal-confirm.scss';

interface ModalProps {
	isOpen: boolean;
	onClose: () => void;
	title?: string;
	themeBtn?: 'blue-light' | 'red' | 'blue';
	handleBtn: () => void;
	textBtn: string;
	text: string;
}

export const ModalConfirm: FC<ModalProps> = observer(({isOpen, onClose, title, themeBtn = 'blue-light', handleBtn, textBtn, text}) => {
	const [block, element] = useBem('modal-confirm');
	const modalRef = useRef<HTMLDivElement>(null);
	const closeButtonRef = useRef<HTMLButtonElement>(null);

	// Закрытие модалки по Escape
	const handleKeyUp = (e: KeyboardEvent) => {
		if (e.key === 'Escape') onClose();
	};

	// Ловушка фокуса
	const handleTabKey = (e: KeyboardEvent) => {
		if (e.key !== 'Tab' || !modalRef.current) return;

		const focusableElements = modalRef.current.querySelectorAll(
			'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
		);
		if (focusableElements.length === 0) return;

		const firstElement = focusableElements[0] as HTMLElement;
		const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

		if (e.shiftKey && document.activeElement === firstElement) {
			e.preventDefault();
			lastElement.focus();
		} else if (!e.shiftKey && document.activeElement === lastElement) {
			e.preventDefault();
			firstElement.focus();
		}
	};

	useEffect(() => {
		if (isOpen) {
			document.addEventListener('keyup', handleKeyUp);
			document.addEventListener('keydown', handleTabKey);
			document.body.style.overflow = 'hidden';

			// Установка фокуса на первый элемент
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
		}

		return () => {
			document.removeEventListener('keyup', handleKeyUp);
			document.removeEventListener('keydown', handleTabKey);
			document.body.style.overflow = '';
		};
	}, [isOpen]);

	if (!isOpen) return null;

	return (
		<section className={block({isOpen})}>
			<div className={element('window')} ref={modalRef}>
				{title && (
					<div className={element('header')}>
						<h2 className={element('title')}>{title}</h2>
					</div>
				)}
				<div className={element('content')}>
					<p className={element('text')}>{text}</p>
					<div className={element('btns-wrapper')}>
						<Button theme="blue-light" className={element('btn')} onClick={onClose} type="button">
							Отмена
						</Button>
						<Button theme={themeBtn} className={element('btn')} onClick={handleBtn} type="button">
							{textBtn}
						</Button>
					</div>
				</div>
				<Button theme="blue-light" className={element('close')} onClick={onClose} refInner={closeButtonRef}>
					<Svg icon="cross" />
				</Button>
			</div>
			<button aria-label="Закрыть окно" type="button" className={element('base')} onClick={onClose} />
		</section>
	);
});
