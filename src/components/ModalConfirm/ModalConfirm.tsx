import {observer} from 'mobx-react-lite';
import {FC, useEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';

import {Button} from '@/components/Button/Button';
import {FieldCheckbox} from '@/components/FieldCheckbox/FieldCheckbox';
import {Svg} from '@/components/Svg/Svg';
import {useBem} from '@/hooks/useBem';
import './modal-confirm.scss';

interface ModalProps {
	isOpen: boolean;
	onClose: () => void;
	title?: string;
	themeBtn?: 'blue-light' | 'red' | 'blue';
	handleBtn: (checkboxValue?: boolean) => void | Promise<void>;
	textBtn: string;
	textBtnCancel?: string;
	text: string;
	checkboxText?: string;
	checkboxId?: string;
}

export const ModalConfirm: FC<ModalProps> = observer(
	({
		isOpen,
		onClose,
		title,
		themeBtn = 'blue-light',
		handleBtn,
		textBtn,
		textBtnCancel = 'Отмена',
		text,
		checkboxText,
		checkboxId = 'modal-checkbox',
	}) => {
		const [block, element] = useBem('modal-confirm');
		const modalRef = useRef<HTMLDivElement>(null);
		const closeButtonRef = useRef<HTMLButtonElement>(null);
		const [checkboxValue, setCheckboxValue] = useState(false);

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

		const handleBtnClick = async () => {
			// Вызываем handleBtn и передаем значение checkbox (если используется)
			try {
				const result = checkboxText ? handleBtn(checkboxValue) : handleBtn();
				// Если handleBtn возвращает Promise, ждем его завершения
				if (result instanceof Promise) {
					await result;
					// Закрываем модалку только после успешного выполнения
					onClose();
				} else {
					// Если handleBtn не async, закрываем модалку сразу
					onClose();
				}
			} catch (error) {
				// При ошибке не закрываем модалку, чтобы пользователь мог попробовать снова
				console.error('Ошибка при выполнении действия:', error);
			}
		};

		// Сброс состояния checkbox при открытии модалки
		useEffect(() => {
			if (isOpen) {
				setCheckboxValue(false);
			}
		}, [isOpen]);

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

		const modalContent = (
			<section className={block({isOpen})}>
				<div className={element('window')} ref={modalRef}>
					{title && (
						<div className={element('header')}>
							<h2 className={element('title')}>{title}</h2>
						</div>
					)}
					<div className={element('content')}>
						<p className={element('text')}>{text}</p>
						{checkboxText && (
							<div className={element('checkbox-wrapper')}>
								<FieldCheckbox id={checkboxId} text={checkboxText} checked={checkboxValue} setChecked={setCheckboxValue} />
							</div>
						)}
						<div className={element('btns-wrapper')}>
							<Button className={element('btn')} onClick={onClose} type="button">
								{textBtnCancel}
							</Button>
							<Button theme={themeBtn} className={element('btn')} onClick={handleBtnClick} type="button">
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

		// Рендерим модалку в document.body через Portal, чтобы она всегда была на верхнем уровне
		return createPortal(modalContent, document.body);
	}
);
