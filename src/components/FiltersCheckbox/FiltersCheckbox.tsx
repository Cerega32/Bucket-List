import {FC, useEffect, useRef, useState} from 'react';

import {useBem} from '@/hooks/useBem';
import './filters-checkbox.scss';

import {pluralize} from '@/utils/text/pluralize';

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
	onFinish: (selectedCategories: string[]) => void;
	multipleSelectedText?: Array<string>;
	multipleThreshold?: number;
}

export const FiltersCheckbox: FC<FiltersCheckboxProps> = (props) => {
	const {head, icon = 'filter', items, onFinish, multipleSelectedText = ['Выбрано несколько'], multipleThreshold = 2} = props;

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

	const handleClickHead = () => {
		const allFalse = Object.keys(activeItems).reduce((acc, key) => ({...acc, [key]: {value: false, name: activeItems[key].name}}), {});
		setActiveItems(allFalse);
		setActiveHead(true);
	};

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
				if (appliedFilters.length > multipleThreshold && multipleSelectedText) {
					setTitle(`Выбрано ${pluralize(appliedFilters.length, multipleSelectedText)}`);
				} else {
					setTitle(appliedFilters.map((filter) => filter[1].name).join(', '));
				}
				setActiveHead(false);

				const selectedCategories = appliedFilters.map((filter) => filter[0]);
				onFinish(selectedCategories);
			} else {
				setTitle(head.name);
				setActiveHead(true);
				onFinish([]);
			}
		}
	}, [isOpen, activeItems]);

	useEffect(() => {
		setActiveItems(
			items.reduce((acc, item) => {
				const currentState = activeItems[item.code] ? activeItems[item.code].value : false;

				return {
					...acc,
					[item.code]: {
						value: currentState,
						name: item.name,
					},
				};
			}, {})
		);
	}, [items]);

	return (
		<div className={block()} ref={selectRef}>
			<button type="button" className={element('option')} onClick={toggleDropdown} aria-label="Выберите">
				<Svg icon={icon} />
				<span className={element('option-text')}>{title}</span>
			</button>
			{isOpen && (
				<ul className={element('list')}>
					<li className={element('head', {active: activeHead})} onClick={handleClickHead} role="button" tabIndex={0}>
						{head.name}
					</li>
					<Line margin="8px 0" />
					{items.map((item) => (
						<li key={item.code} className={element('item', {selected: activeItems[item.code]?.value})}>
							<FieldCheckbox
								className={element('checkbox')}
								text={item.name}
								id={item.code}
								checked={activeItems[item.code]?.value || false}
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
