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
	searchInControl?: boolean;
	error?: boolean;
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
	searchInControl = false,
	error = false,
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
	const selectRef = useRef<HTMLDivElement | null>(null);
	const optionsRef = useRef<(HTMLLIElement | null)[]>([]);
	const [search, setSearch] = useState('');

	const [block, element] = useBem('select', className);

	const visibleOptions = options
		.map((option, index) => ({option, index}))
		.filter(({option}) => (!searchInControl || search.trim() === '' ? true : option.name.toLowerCase().includes(search.toLowerCase())));

	const toggleDropdown = () => {
		if (disabled) return;

		const nextIsOpen = !isOpen;
		setIsOpen(nextIsOpen);
		if (nextIsOpen) {
			setSearch('');
			if (typeof activeOption === 'number') {
				setHighlightedIndex(activeOption);
			} else {
				setHighlightedIndex(0);
			}
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
			if (activeOption !== null) {
				const currentVisibleIndex = visibleOptions.findIndex(({index}) => index === activeOption);
				setHighlightedIndex(currentVisibleIndex >= 0 ? currentVisibleIndex : 0);
			} else {
				setHighlightedIndex(0);
			}
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
					const max = visibleOptions.length;
					if (!max) return null;
					const newIndex = prevIndex === null ? 0 : (prevIndex + 1) % max;
					const originalIndex = visibleOptions[newIndex].index;
					optionsRef.current[originalIndex]?.scrollIntoView({block: 'nearest'});
					return newIndex;
				});
				break;
			case 'ArrowUp':
				event.preventDefault();
				setHighlightedIndex((prevIndex) => {
					const max = visibleOptions.length;
					if (!max) return null;
					const newIndex = prevIndex === null || prevIndex === 0 ? max - 1 : prevIndex - 1;
					const originalIndex = visibleOptions[newIndex].index;
					optionsRef.current[originalIndex]?.scrollIntoView({block: 'nearest'});
					return newIndex;
				});
				break;
			case 'Enter':
			case ' ':
				event.preventDefault();
				if (highlightedIndex !== null && visibleOptions[highlightedIndex]) {
					handleOptionClick(visibleOptions[highlightedIndex].index);
				}
				break;
			default:
				break;
		}
	};

	// Обработчик для элемента выбора (делегирует общую клавиатурную логику)
	const handleSelectKeyDown = (event: React.KeyboardEvent) => {
		if (disabled) return;
		handleKeyDown(event);
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
		<div className={block({filter, disabled, error})} ref={selectRef}>
			{text && <p className={element('text')}>{text}</p>}
			{searchInControl && isOpen ? (
				<div className={element('option', {isOpen, placeholder: typeof activeOption !== 'number', disabled})}>
					{filter && <Svg icon="sort" />}
					<input
						type="text"
						className={element('option-input')}
						value={search}
						onKeyDown={handleSelectKeyDown}
						onChange={(e) => setSearch(e.target.value)}
						placeholder={typeof activeOption === 'number' ? options[activeOption]?.name : placeholder}
						onClick={(e) => e.stopPropagation()}
					/>
					{!filter && <Svg icon="arrow--right" className={element('option-icon')} />}
				</div>
			) : (
				<button
					type="button"
					className={element('option', {isOpen, placeholder: typeof activeOption !== 'number', disabled})}
					onClick={toggleDropdown}
					onKeyDown={handleSelectKeyDown}
					aria-haspopup="listbox"
					aria-expanded={isOpen}
					aria-controls={isOpen ? 'select-options-list' : undefined}
					aria-label={typeof activeOption === 'number' ? `Выбрано: ${options[activeOption]?.name}` : placeholder}
					disabled={disabled}
				>
					{filter ? (
						<>
							<Svg icon="sort" />
							<span className={element('option-text')}>
								{typeof activeOption === 'number' ? options[activeOption]?.name : placeholder}
							</span>
						</>
					) : (
						<>
							<span className={element('option-text')}>
								{typeof activeOption === 'number' ? options[activeOption]?.name : placeholder}
							</span>
							<Svg icon="arrow--right" className={element('option-icon')} />
						</>
					)}
				</button>
			)}
			{isOpen && !disabled && (
				<ul id="select-options-list" className={element('list')} role="listbox" aria-label="Доступные опции">
					{visibleOptions.map(({option, index}, i) => (
						<li
							key={option.value}
							ref={(el) => {
								optionsRef.current[index] = el;
							}}
							className={element('item', {
								active: activeOption === index,
								highlighted: highlightedIndex === i,
							})}
							onClick={() => handleOptionClick(index)}
							onKeyDown={(e) => handleOptionKeyDown(e, index)}
							role="option"
							aria-selected={activeOption === index}
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
