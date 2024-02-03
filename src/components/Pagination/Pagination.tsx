import {FC, useEffect, useState} from 'react';

import {Button} from '../Button/Button';

import {useBem} from '@/hooks/useBem';
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

const generatePagination = (activePage: number, totalPages: number, visiblePages = 5): Array<IPage> => {
	const pagination: Array<IPage> = [];

	if (totalPages <= visiblePages) {
		for (let i = 1; i <= totalPages; i += 1) {
			pagination.push({number: i, symbol: i});
		}
	} else {
		const halfVisible = Math.floor(visiblePages / 2);

		// Add the first page
		pagination.push({number: 1, symbol: 1});

		const startRange = Math.max(2, activePage > totalPages - 2 ? totalPages - (visiblePages - 1) : activePage - halfVisible);
		const endRange = Math.min(totalPages - 1, activePage < 3 ? visiblePages : activePage + halfVisible);

		// Add the pages before the active page
		if (activePage - halfVisible > 2) {
			pagination.push({
				symbol: '...',
				number: Math.floor((startRange + 1) / 2),
			});
		}

		// Add the visible pages around the active page
		for (let i = startRange; i <= endRange; i += 1) {
			pagination.push({number: i, symbol: i});
		}

		// Add the pages after the active page
		if (activePage + halfVisible < totalPages - 1) {
			pagination.push({
				symbol: '...',
				number: Math.floor((totalPages + endRange) / 2),
			});
		}

		// Add the last page
		pagination.push({number: totalPages, symbol: totalPages});
	}

	return pagination;
};

export const Pagination: FC<PaginationProps> = (props) => {
	const {className, goToPage, currentPage, totalPages} = props;

	const [current, setCurrent] = useState(currentPage);

	const [block, element] = useBem('pagination', className);
	const [loading, setLoading] = useState(false);
	const pagination = generatePagination(current, totalPages);

	const onPageClick = async (page: number): Promise<void> => {
		const oldPage = current;
		setLoading(true);
		setCurrent(page);
		const newCurrent = await goToPage(page);
		if (!newCurrent) {
			setCurrent(oldPage);
		}
		setLoading(false);
	};

	useEffect(() => {
		setCurrent(currentPage);
	}, [currentPage]);

	if (totalPages < 2) {
		return null;
	}

	return (
		<div className={block()}>
			<Button
				theme="blue-light"
				icon="arrow--bottom"
				className={element('arrow', {notShow: !(currentPage > 1)})}
				onClick={() => onPageClick(currentPage - 1)}
			/>
			<div className={element('pages')}>
				{pagination.map((page) => (
					<Button
						theme="blue-light"
						onClick={() => onPageClick(page.number)}
						key={page.number}
						className={element('page')}
						active={page.number === current}
						loading={loading && current === page.number}
					>
						{page.symbol}
					</Button>
				))}
			</div>

			<Button
				theme="blue-light"
				icon="arrow"
				className={element('arrow', {notShow: !(currentPage < totalPages)})}
				onClick={() => onPageClick(currentPage + 1)}
			/>
		</div>
	);
};
