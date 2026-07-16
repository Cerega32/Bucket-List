import {FC, useEffect, useRef} from 'react';

import {useBem} from '@/hooks/useBem';

import {FieldCheckbox} from '../FieldCheckbox/FieldCheckbox';
import {Svg} from '../Svg/Svg';

export interface FilterOption {
	name: string;
	code: string;
	children?: FilterOption[];
}

interface FilterSelectProps {
	label: string;
	options: FilterOption[];
	selected: string[];
	onChange: (selected: string[]) => void;
	multiple?: boolean;
	allLabel?: string;
	isOpen: boolean;
	onToggle: () => void;
}

export const FilterSelect: FC<FilterSelectProps> = (props) => {
	const {label, options, selected, onChange, multiple = false, allLabel = 'Все цели', isOpen, onToggle} = props;
	const [block, element] = useBem('filter-select');
	const ref = useRef<HTMLDivElement>(null);

	const displayValue =
		selected.length === 0
			? allLabel
			: multiple && selected.length > 2
			? `Выбрано ${selected.length}`
			: options
					.flatMap((o) => [o, ...(o.children || [])])
					.filter((o) => selected.includes(o.code))
					.map((o) => o.name)
					.join(', ');

	const handleSelect = (code: string) => {
		if (selected.includes(code)) {
			onChange([]);
		} else {
			onChange([code]);
		}
		onToggle(); // close
	};

	const handleSelectAll = () => {
		onChange([]);
		onToggle();
	};

	const getParentState = (option: FilterOption): {checked: boolean; indeterminate: boolean} => {
		const childCodes = option.children?.map((c) => c.code) || [];
		if (childCodes.length === 0) {
			return {checked: selected.includes(option.code), indeterminate: false};
		}
		const selectedCount = childCodes.filter((c) => selected.includes(c)).length;
		return {
			checked: selectedCount === childCodes.length,
			indeterminate: selectedCount > 0 && selectedCount < childCodes.length,
		};
	};

	const handleParentToggle = (option: FilterOption, checked: boolean) => {
		const childCodes = option.children?.map((c) => c.code) || [];
		if (childCodes.length === 0) {
			if (checked) {
				onChange([...new Set([...selected, option.code])]);
			} else {
				onChange(selected.filter((c) => c !== option.code));
			}
			return;
		}
		if (checked) {
			onChange([...new Set([...selected, ...childCodes])]);
		} else {
			const toRemove = new Set(childCodes);
			onChange(selected.filter((c) => !toRemove.has(c)));
		}
	};

	const handleChildToggle = (childCode: string, checked: boolean) => {
		if (checked) {
			onChange([...selected, childCode]);
		} else {
			onChange(selected.filter((c) => c !== childCode));
		}
	};

	useEffect(() => {
		const handler = (e: MouseEvent) => {
			if (ref.current && !ref.current.contains(e.target as Node)) {
				if (isOpen) onToggle();
			}
		};
		document.addEventListener('mousedown', handler);
		return () => document.removeEventListener('mousedown', handler);
	}, [isOpen, onToggle]);

	return (
		<div className={block()} ref={ref}>
			<span className={element('label')}>{label}</span>
			<button type="button" className={element('trigger', {isOpen})} onClick={onToggle}>
				<span className={element('trigger-text')}>{displayValue}</span>
				<Svg icon="arrow" className={element('arrow', {open: isOpen})} width="16px" height="16px" />
			</button>
			{isOpen && (
				<ul className={element('list')} role="listbox">
					{multiple ? (
						options.map((option) => {
							const parentState = getParentState(option);
							return (
								<li key={option.code}>
									<FieldCheckbox
										className={element('checkbox')}
										id={`filter-${option.code}`}
										text={option.name}
										checked={parentState.checked}
										indeterminate={parentState.indeterminate}
										setChecked={(checked) => handleParentToggle(option, checked)}
									/>
									{option.children &&
										option.children.map((child) => (
											<FieldCheckbox
												key={child.code}
												className={element('checkbox', {sub: true})}
												id={`filter-${child.code}`}
												text={child.name}
												checked={selected.includes(child.code)}
												setChecked={(checked) => handleChildToggle(child.code, checked)}
											/>
										))}
								</li>
							);
						})
					) : (
						<>
							<li
								className={element('item', {active: selected.length === 0})}
								onClick={handleSelectAll}
								onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleSelectAll()}
								role="option"
								aria-selected={selected.length === 0}
								tabIndex={0}
							>
								{allLabel}
							</li>
							{options.map((option) => (
								<li
									key={option.code}
									className={element('item', {active: selected.includes(option.code)})}
									onClick={() => handleSelect(option.code)}
									onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleSelect(option.code)}
									role="option"
									aria-selected={selected.includes(option.code)}
									tabIndex={0}
								>
									{option.name}
								</li>
							))}
						</>
					)}
				</ul>
			)}
		</div>
	);
};
