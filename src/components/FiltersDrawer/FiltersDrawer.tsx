import {FC, useCallback, useEffect, useRef, useState} from 'react';

import {useBem} from '@/hooks/useBem';
import useScreenSize from '@/hooks/useScreenSize';

import {FilterOption, FilterSelect} from './FilterSelect';
import {Button} from '../Button/Button';
import {ModalPhone} from '../ModalPhone/ModalPhone';
import './filters-drawer.scss';

export interface FilterGroup {
	key: string;
	label: string;
	options: FilterOption[];
	multiple?: boolean;
	allLabel?: string;
}

interface FiltersDrawerProps {
	filters: FilterGroup[];
	values: Record<string, string[]>;
	onChange: (key: string, selected: string[]) => void;
	onReset: () => void;
	totalCount?: number;
	className?: string;
}

function useDrawerBackgroundScrollLock(isOpen: boolean, drawerRef: React.RefObject<HTMLDivElement | null>) {
	useEffect(() => {
		if (!isOpen) return;

		const preventBackgroundScroll = (e: WheelEvent | TouchEvent) => {
			const boundary = drawerRef.current;
			if (!boundary) return;

			const target = e.target as Node;
			if (!boundary.contains(target)) {
				e.preventDefault();
				return;
			}

			let el: HTMLElement | null = e.target as HTMLElement;
			while (el && el !== boundary) {
				const {overflowY} = getComputedStyle(el);
				if (/(auto|scroll|overlay)/.test(overflowY) && el.scrollHeight > el.clientHeight) {
					if (e instanceof WheelEvent) {
						const {scrollTop, scrollHeight, clientHeight} = el;
						const atTop = scrollTop <= 0;
						const atBottom = scrollTop + clientHeight >= scrollHeight;
						if ((atTop && e.deltaY < 0) || (atBottom && e.deltaY > 0)) {
							e.preventDefault();
						}
					}
					return;
				}
				el = el.parentElement;
			}
			e.preventDefault();
		};

		document.addEventListener('wheel', preventBackgroundScroll, {passive: false});
		document.addEventListener('touchmove', preventBackgroundScroll, {passive: false});

		return () => {
			document.removeEventListener('wheel', preventBackgroundScroll);
			document.removeEventListener('touchmove', preventBackgroundScroll);
		};
	}, [isOpen, drawerRef]);
}

export const FiltersDrawer: FC<FiltersDrawerProps> = (props) => {
	const {filters, values, onChange, onReset, totalCount, className} = props;
	const [block, element] = useBem('filters-drawer', className);
	const {isScreenMobile} = useScreenSize();
	const [isOpen, setIsOpen] = useState(false);
	const [openSelectKey, setOpenSelectKey] = useState<string | null>(null);
	const drawerRef = useRef<HTMLDivElement>(null);

	const activeFiltersCount = Object.values(values).reduce((count, selected) => count + selected.length, 0);

	const handleClose = useCallback(() => {
		setIsOpen(false);
		setOpenSelectKey(null);
	}, []);

	const handleOpen = useCallback(() => {
		setIsOpen(true);
	}, []);

	const handleReset = useCallback(() => {
		onReset();
	}, [onReset]);

	const handleSelectToggle = useCallback((key: string) => {
		setOpenSelectKey((prev) => (prev === key ? null : key));
	}, []);

	useEffect(() => {
		if (isScreenMobile || !isOpen) return;

		const handler = (e: MouseEvent) => {
			if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
				handleClose();
			}
		};
		document.addEventListener('mousedown', handler);
		return () => document.removeEventListener('mousedown', handler);
	}, [isOpen, isScreenMobile, handleClose]);

	useEffect(() => {
		if (!isOpen || isScreenMobile) return;

		const handler = (e: KeyboardEvent) => {
			if (e.key === 'Escape') handleClose();
		};
		document.addEventListener('keyup', handler);
		return () => document.removeEventListener('keyup', handler);
	}, [isOpen, isScreenMobile, handleClose]);

	useDrawerBackgroundScrollLock(isOpen && !isScreenMobile, drawerRef);

	const filterSections = (
		<div className={element('sections')}>
			{filters.map((filter) => (
				<FilterSelect
					key={filter.key}
					label={filter.label}
					options={filter.options}
					selected={values[filter.key] || []}
					onChange={(selected) => onChange(filter.key, selected)}
					multiple={filter.multiple}
					allLabel={filter.allLabel}
					isOpen={openSelectKey === filter.key}
					onToggle={() => handleSelectToggle(filter.key)}
				/>
			))}
		</div>
	);

	const actionsBar = (
		<div className={element('actions')}>
			<Button type="button" theme="blue-light" size="medium" className={element('reset-btn')} onClick={handleReset}>
				Сбросить все
			</Button>
			<Button type="button" theme="blue" size="medium" className={element('apply-btn')} onClick={handleClose}>
				{totalCount !== undefined ? `Показать: ${totalCount}` : 'Показать'}
			</Button>
		</div>
	);

	const triggerButton = (
		<Button
			icon="filter"
			type="button"
			theme="blue-light"
			size="medium"
			className={element('trigger', {active: activeFiltersCount > 0})}
			onClick={handleOpen}
		>
			<span className={element('trigger-text')}>{activeFiltersCount > 0 ? `Фильтры: ${activeFiltersCount}` : 'Фильтры'}</span>
		</Button>
	);

	if (isScreenMobile) {
		return (
			<div className={block()}>
				{triggerButton}
				<ModalPhone isOpen={isOpen} onClose={handleClose} title="Фильтры">
					<div className={element('mobile-content')}>
						{filterSections}
						{actionsBar}
					</div>
				</ModalPhone>
			</div>
		);
	}

	return (
		<div className={block()}>
			{triggerButton}
			{isOpen && (
				<>
					<div className={element('overlay')} />
					<div className={element('drawer')} ref={drawerRef}>
						<div className={element('header')}>
							<h2 className={element('title')}>Фильтры</h2>
							<Button type="button-close" onClick={handleClose} aria-label="Закрыть" />
						</div>
						<div className={element('body')}>{filterSections}</div>
						{actionsBar}
					</div>
				</>
			)}
		</div>
	);
};

export type {FilterOption};
