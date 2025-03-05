import {FC, useEffect, useRef, useState} from 'react';

import {useBem} from '@/hooks/useBem';
import './filters-checkbox.scss';

import {FieldCheckbox} from '../FieldCheckbox/FieldCheckbox';
import {Line} from '../Line/Line';
import {Svg} from '../Svg/Svg';

interface IFilters {
	name: string;
	code: string;
}

interface FiltersCheckboxProps {
	head: IFilters;
	items: Array<IFilters>;
	icon?: string;
	onFinish: () => void;
}

export const FiltersCheckbox: FC<FiltersCheckboxProps> = (props) => {
	const {head, icon = 'filter', items, onFinish} = props;

	const [isOpen, setIsOpen] = useState(false);
	const [title, setTitle] = useState(head.name);
	const [activeHead, setActiveHead] = useState(true);
	const [activeItems, setActiveItems] = useState<{[key: string]: {value: boolean; name: string}}>(
		items.reduce((acc, item) => ({...acc, [item.code]: {value: false, name: item.name}}), {})
	);
	const selectRef = useRef<HTMLDivElement | null>(null);

	const [block, element] = useBem('filters-checkbox');

	const toggleDropdown = () => {
		setIsOpen(!isOpen);
	};

	const handleClickOutside = (event: MouseEvent) => {
		if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
			setIsOpen(false);
		}
	};

	// const handleClickHead = () => { // TODO
	// 	setActiveItems((prevItems) => {
	// 		prevItems.map((item) => ({...item, value: false})));
	// };

	useEffect(() => {
		document.addEventListener('mousedown', handleClickOutside);

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, []);

	useEffect(() => {
		if (!isOpen) {
			const appliedFilters = Object.entries(activeItems).filter((item) => item[1].value);
			if (appliedFilters.length) {
				setTitle(appliedFilters.map((filter) => filter[1].name).join(', '));
				setActiveHead(false);
			} else {
				setTitle(head.name);
				setActiveHead(true);
			}
			// onFinish();
		}
	}, [isOpen]);

	return (
		<div className={block()} ref={selectRef}>
			<button type="button" className={element('option')} onClick={toggleDropdown} aria-label="Выберите">
				<Svg icon={icon} />
				<span className={element('option-text')}>{title}</span>
			</button>
			{isOpen && (
				<ul className={element('list')}>
					<li className={element('head', {active: activeHead})}>{head.name}</li>
					<Line margin="8px 0" />
					{items.map((item) => (
						<li key={item.code} className={element('item')}>
							<FieldCheckbox
								value={item.code}
								text={item.name}
								id={item.code}
								checked={activeItems[item.code].value}
								setChecked={(value) => {
									setActiveItems({...activeItems, [item.code]: {value, name: item.name}});
								}}
							/>
						</li>
					))}
				</ul>
			)}
		</div>
	);
};
