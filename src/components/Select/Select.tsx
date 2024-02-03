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
}

const Select: FC<SelectProps> = ({options, activeOption, onSelect}) => {
	const [isOpen, setIsOpen] = useState(false);
	const selectRef = useRef<HTMLDivElement | null>(null);

	const [block, element] = useBem('select');

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
		<div className={block()} ref={selectRef}>
			<div className={element('option')} onClick={toggleDropdown}>
				<Svg icon="sort" />
				{typeof activeOption === 'number' ? options[activeOption].name : 'Сделайте выбор'}
			</div>
			{isOpen && (
				<ul className={element('list')}>
					{options.map((option, i) => (
						<li
							key={option.value}
							className={element('item', {active: activeOption === i})}
							onClick={() => handleOptionClick(i)}
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
