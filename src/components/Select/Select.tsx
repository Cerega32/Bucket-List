import {FC, useEffect, useRef, useState} from 'react';

import {useBem} from '@/hooks/useBem';
import './select.scss';

import {Svg} from '../Svg/Svg';

export interface OptionSelect {
	name: string;
	value: string;
}

interface SelectProps {
	options: OptionSelect[];
	activeOption: number | null;
	onSelect: (active: number) => void;
	text?: string;
	className?: string;
	filter?: boolean;
	placeholder?: string;
	disabled?: boolean;
}

const Select: FC<SelectProps> = ({
	options,
	activeOption,
	onSelect,
	text,
	className,
	filter,
	placeholder = 'Сделайте выбор',
	disabled = false,
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
	const selectRef = useRef<HTMLDivElement | null>(null);
	const optionsRef = useRef<(HTMLLIElement | null)[]>([]);

	const [block, element] = useBem('select', className);

	const toggleDropdown = () => {
		if (disabled) return;

		setIsOpen(!isOpen);
		if (!isOpen && typeof activeOption === 'number') {
			setHighlightedIndex(activeOption);
		}
	};

	const handleClickOutside = (event: MouseEvent) => {
		if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
			setIsOpen(false);
		}
	};

	const handleOptionClick = (active: number) => {
		if (disabled) return;

		onSelect(active);
		setIsOpen(false);
	};

	const handleKeyDown = (event: React.KeyboardEvent) => {
		if (disabled) return;

		if (!isOpen && (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown')) {
			event.preventDefault();
			setIsOpen(true);
			setHighlightedIndex(activeOption !== null ? activeOption : 0);
			return;
		}

		if (!isOpen) return;

		switch (event.key) {
			case 'Escape':
				event.preventDefault();
				setIsOpen(false);
				break;
			case 'ArrowDown':
				event.preventDefault();
				setHighlightedIndex((prevIndex) => {
					const newIndex = prevIndex === null ? 0 : (prevIndex + 1) % options.length;
					optionsRef.current[newIndex]?.scrollIntoView({block: 'nearest'});
					return newIndex;
				});
				break;
			case 'ArrowUp':
				event.preventDefault();
				setHighlightedIndex((prevIndex) => {
					const newIndex = prevIndex === null || prevIndex === 0 ? options.length - 1 : prevIndex - 1;
					optionsRef.current[newIndex]?.scrollIntoView({block: 'nearest'});
					return newIndex;
				});
				break;
			case 'Enter':
			case ' ':
				event.preventDefault();
				if (highlightedIndex !== null) {
					handleOptionClick(highlightedIndex);
				}
				break;
			default:
				break;
		}
	};

	// Обработчик для элемента выбора
	const handleSelectKeyDown = (event: React.KeyboardEvent) => {
		if (disabled) return;

		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			toggleDropdown();
		}
	};

	// Обработчик для элементов списка
	const handleOptionKeyDown = (event: React.KeyboardEvent, index: number) => {
		if (disabled) return;

		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handleOptionClick(index);
		}
	};

	useEffect(() => {
		document.addEventListener('mousedown', handleClickOutside);

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, []);

	// Сбрасываем optionsRef при изменении количества опций
	useEffect(() => {
		optionsRef.current = optionsRef.current.slice(0, options.length);
	}, [options.length]);

	return (
		<div
			className={block({filter, disabled})}
			ref={selectRef}
			onKeyDown={handleKeyDown}
			role="combobox"
			aria-haspopup="listbox"
			aria-expanded={isOpen}
			aria-controls={isOpen ? 'select-options-list' : undefined}
			aria-label={text || 'Выпадающий список'}
			tabIndex={disabled ? -1 : 0}
			aria-disabled={disabled}
		>
			{text && <p className={element('text')}>{text}</p>}
			<button
				type="button"
				className={element('option', {isOpen, placeholder: typeof activeOption !== 'number', disabled})}
				onClick={toggleDropdown}
				onKeyDown={handleSelectKeyDown}
				aria-label={typeof activeOption === 'number' ? `Выбрано: ${options[activeOption]?.name}` : placeholder}
				disabled={disabled}
			>
				<Svg icon={filter ? 'sort' : 'arrow--right'} />
				{typeof activeOption === 'number' ? options[activeOption]?.name : placeholder}
			</button>
			{isOpen && !disabled && (
				<ul id="select-options-list" className={element('list')} role="listbox" aria-label="Доступные опции">
					{options.map((option, i) => (
						<li
							key={option.value}
							ref={(el) => {
								optionsRef.current[i] = el;
							}}
							className={element('item', {
								active: activeOption === i,
								highlighted: highlightedIndex === i,
							})}
							onClick={() => handleOptionClick(i)}
							onKeyDown={(e) => handleOptionKeyDown(e, i)}
							role="option"
							aria-selected={activeOption === i}
							tabIndex={0}
						>
							{option.name}
						</li>
					))}
				</ul>
			)}
		</div>
	);
};

export default Select;
