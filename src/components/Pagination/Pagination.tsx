import {FC, useEffect, useState} from 'react';

import {useBem} from '@/hooks/useBem';
import useScreenSize from '@/hooks/useScreenSize';

import {Button} from '../Button/Button';

import './pagination.scss';

interface PaginationProps {
	className?: string;
	currentPage: number;
	totalPages: number;
	goToPage: (page: number) => Promise<void | boolean>;
}

interface IPage {
	number: number;
	symbol: string | number;
}

// Генерация пагинации без "..." между соседними номерами
const generatePagination = (activePage: number, totalPages: number, visiblePages = 5): Array<IPage> => {
	const pages: Array<IPage> = [];

	const getMiddlePage = (start: number, end: number): number => {
		return Math.ceil((start + end) / 2);
	};

	if (totalPages <= visiblePages) {
		for (let i = 1; i <= totalPages; i += 1) {
			pages.push({number: i, symbol: i});
		}
		return pages;
	}

	const siblingCount = Math.max(1, Math.floor((visiblePages - 3) / 2)); // вокруг активной, без учета 1 и last
	const leftSibling = Math.max(2, activePage - siblingCount);
	const rightSibling = Math.min(totalPages - 1, activePage + siblingCount);

	// первая страница
	pages.push({number: 1, symbol: 1});

	// блок слева от "окна" вокруг активной
	if (leftSibling > 2) {
		// если между 1 и leftSibling только одна страница — показываем её без "..."
		if (leftSibling === 3) {
			pages.push({number: 2, symbol: 2});
		} else {
			const startHidden = 3;
			const endHidden = leftSibling - 1;
			const jumpTo = getMiddlePage(startHidden, endHidden);
			pages.push({number: jumpTo, symbol: '...'});
		}
	} else if (leftSibling === 2) {
		pages.push({number: 2, symbol: 2});
	}

	// центральное "окно"
	for (let i = leftSibling; i <= rightSibling; i += 1) {
		// чтобы не дублировать страницы 1 и last
		if (i !== 1 && i !== totalPages) {
			// избегаем дублей (если leftSibling === 2, страница 2 уже добавлена)
			if (!pages.some((p) => p.number === i)) {
				pages.push({number: i, symbol: i});
			}
		}
	}

	// блок справа от "окна"
	if (rightSibling < totalPages - 1) {
		// если между rightSibling и last только одна страница — показываем её без "..."
		if (rightSibling === totalPages - 2) {
			if (!pages.some((p) => p.number === totalPages - 1)) {
				pages.push({number: totalPages - 1, symbol: totalPages - 1});
			}
		} else {
			const startHidden = rightSibling + 1;
			const endHidden = totalPages - 2;
			const jumpTo = getMiddlePage(startHidden, endHidden);
			pages.push({number: jumpTo, symbol: '...'});
		}
	} else if (rightSibling === totalPages - 1 && !pages.some((p) => p.number === totalPages - 1)) {
		pages.push({number: totalPages - 1, symbol: totalPages - 1});
	}

	// последняя страница
	if (!pages.some((p) => p.number === totalPages)) {
		pages.push({number: totalPages, symbol: totalPages});
	}

	return pages;
};

export const Pagination: FC<PaginationProps> = (props) => {
	const {className, goToPage, currentPage, totalPages} = props;

	const [current, setCurrent] = useState(currentPage);
	const {isScreenSmallMobile, isScreenMobile} = useScreenSize();

	const [block, element] = useBem('pagination', className);
	const visiblePages = isScreenMobile ? 3 : 5;
	const pagination = !isScreenSmallMobile ? generatePagination(current, totalPages, visiblePages) : [];

	const onPageClick = async (page: number): Promise<void> => {
		const oldPage = current;
		setCurrent(page);
		const success = await goToPage(page);
		if (!success) {
			setCurrent(oldPage);
		}
	};

	useEffect(() => {
		setCurrent(currentPage);
	}, [currentPage]);

	if (totalPages < 2) {
		return null;
	}

	// Специальный компактный режим для очень маленьких экранов (xs)
	if (isScreenSmallMobile) {
		return (
			<div className={block()}>
				<Button
					theme="blue-light"
					icon="arrow--bottom"
					className={element('arrow', {notShow: current <= 1})}
					onClick={() => onPageClick(current - 1)}
				/>
				<div className={element('pages')}>
					{current > 1 && (
						<Button theme="blue-light" className={element('page')} disabled>
							...
						</Button>
					)}
					<Button theme="blue-light" onClick={() => onPageClick(current)} className={element('page', {active: true})} disabled>
						{current}
					</Button>
					{current < totalPages && (
						<Button theme="blue-light" className={element('page')} disabled>
							...
						</Button>
					)}
				</div>

				<Button
					theme="blue-light"
					icon="arrow"
					className={element('arrow', {notShow: current >= totalPages})}
					onClick={() => onPageClick(current + 1)}
				/>
			</div>
		);
	}

	return (
		<div className={block()}>
			<Button
				theme="blue-light"
				icon="arrow--bottom"
				className={element('arrow', {notShow: current <= 1})}
				onClick={() => onPageClick(current - 1)}
			/>
			<div className={element('pages')}>
				{pagination.map((page) => (
					<Button
						theme="blue-light"
						onClick={() => onPageClick(page.number)}
						key={page.number}
						className={element('page', {active: page.number === current})}
						disabled={page.number === current}
					>
						{page.symbol}
					</Button>
				))}
			</div>

			<Button
				theme="blue-light"
				icon="arrow"
				className={element('arrow', {notShow: current >= totalPages})}
				onClick={() => onPageClick(current + 1)}
			/>
		</div>
	);
};
