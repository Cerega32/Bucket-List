import React, {useState, useRef, useEffect, FC} from 'react';

import './select.scss';
import {Svg} from '../Svg/Svg';

import {useBem} from '@/hooks/useBem';

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
}

const Select: FC<SelectProps> = ({options, activeOption, onSelect, text, className, filter, placeholder = 'Сделайте выбор'}) => {
	const [isOpen, setIsOpen] = useState(false);
	const selectRef = useRef<HTMLDivElement | null>(null);

	const [block, element] = useBem('select', className);

	const toggleDropdown = () => {
		setIsOpen(!isOpen);
	};

	const handleClickOutside = (event: MouseEvent) => {
		if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
			setIsOpen(false);
		}
	};

	const handleOptionClick = (active: number) => {
		onSelect(active);
		setIsOpen(false);
	};

	useEffect(() => {
		document.addEventListener('mousedown', handleClickOutside);

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, []);

	return (
		<div className={block({filter})} ref={selectRef}>
			{text && <p className={element('text')}>{text}</p>}
			<div
				className={element('option', {isOpen, placeholder: typeof activeOption !== 'number'})}
				onClick={toggleDropdown}
				onKeyUp={toggleDropdown}
				role="button"
				tabIndex={0}
			>
				<Svg icon={filter ? 'sort' : 'arrow--right'} />
				{typeof activeOption === 'number' ? options[activeOption].name : placeholder}
			</div>
			{isOpen && (
				<ul className={element('list')}>
					{options.map((option, i) => (
						<li
							key={option.value}
							className={element('item', {active: activeOption === i})}
							onClick={() => handleOptionClick(i)}
							onKeyUp={toggleDropdown}
							role="row"
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
