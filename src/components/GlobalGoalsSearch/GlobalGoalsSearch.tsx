import {observer} from 'mobx-react-lite';
import {FC, useCallback, useEffect, useRef, useState} from 'react';
import {useLocation, useNavigate, useSearchParams} from 'react-router-dom';
import {scroller} from 'react-scroll';

import {useBem} from '@/hooks/useBem';
import {IShortGoal, IShortList} from '@/typings/goal';
import {getAllGoals} from '@/utils/api/get/getAllGoals';
import {getAllLists} from '@/utils/api/get/getAllLists';

import {Button} from '../Button/Button';
import {CardShort} from '../CardShort/CardShort';
import {FieldInput} from '../FieldInput/FieldInput';
import {Loader} from '../Loader/Loader';
import {Svg} from '../Svg/Svg';

import './global-goals-search.scss';

type SearchResultItem = {type: 'goal'; item: IShortGoal} | {type: 'list'; item: IShortList};

interface GlobalGoalsSearchProps {
	className?: string;
	isModal?: boolean;
	theme?: 'white' | 'transparent';
}

export const GlobalGoalsSearch: FC<GlobalGoalsSearchProps> = observer((props) => {
	const {className, isModal, theme} = props;

	const [block, element] = useBem('global-goals-search', className);
	const navigate = useNavigate();
	const location = useLocation();
	const [searchParams, setSearchParams] = useSearchParams();

	const [query, setQuery] = useState('');
	const [isSearching, setIsSearching] = useState(false);
	const [results, setResults] = useState<SearchResultItem[]>([]);
	const [totalCount, setTotalCount] = useState(0);
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const [searchTimer, setSearchTimer] = useState<NodeJS.Timeout | null>(null);

	const searchRef = useRef<HTMLDivElement>(null);

	// Синхронизация поля с URL (когда зашли на страницу с search)
	useEffect(() => {
		const urlSearch = searchParams.get('search') || '';
		setQuery(urlSearch);
	}, [location.pathname, location.search]);

	// Закрыть дропдаун при клике вне компонента
	useEffect(() => {
		if (isModal) return;
		const handleClickOutside = (event: MouseEvent) => {
			if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
				setIsDropdownOpen(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, [isModal]);

	// Обработка поиска с дебаунсом (цели + списки)
	const performSearch = useCallback(async (searchQuery: string) => {
		if (searchQuery.length < 2) {
			setResults([]);
			setTotalCount(0);
			setIsDropdownOpen(false);
			return;
		}

		setIsSearching(true);

		try {
			const [goalsRes, listsRes] = await Promise.all([
				getAllGoals('all', {
					search: searchQuery,
					page: 1,
					items_per_page: 3,
				}),
				getAllLists('all', {
					search: searchQuery,
					page: 1,
					items_per_page: 3,
				}),
			]);

			const combined: SearchResultItem[] = [];
			let total = 0;

			if (goalsRes.success && goalsRes.data?.data) {
				goalsRes.data.data.forEach((goal: IShortGoal) => combined.push({type: 'goal', item: goal}));
				const pag = goalsRes.data.pagination;
				total += pag?.totalItems ?? pag?.total_items ?? 0;
			}
			if (listsRes.success && listsRes.data?.data) {
				listsRes.data.data.forEach((list: IShortList) => combined.push({type: 'list', item: list}));
				const pag = listsRes.data.pagination;
				total += pag?.totalItems ?? pag?.total_items ?? 0;
			}

			setResults(combined);
			setTotalCount(total);
			setIsDropdownOpen(true);
		} catch (error) {
			setResults([]);
			setTotalCount(0);
		} finally {
			setIsSearching(false);
		}
	}, []);

	// Обработчик изменения поискового запроса
	const handleSearchChange = (value: string) => {
		setQuery(value);

		// Если очистили поле и мы на странице поиска — сбрасываем URL и каталог
		if (value.trim().length < 2 && location.pathname === '/categories/all' && searchParams.get('search')) {
			if (searchTimer) clearTimeout(searchTimer);
			setSearchTimer(null);
			setSearchParams({});
			return;
		}

		// Очищаем предыдущий таймер
		if (searchTimer) {
			clearTimeout(searchTimer);
		}

		// Устанавливаем новый таймер для дебаунса
		const newTimer = setTimeout(() => {
			performSearch(value);
		}, 300);

		setSearchTimer(newTimer);
	};

	// Переход на страницу результатов
	const handleShowAllResults = () => {
		if (!query.trim()) return;

		setIsDropdownOpen(false);
		const targetUrl = `/categories/all?search=${encodeURIComponent(query)}`;
		const currentSearch = searchParams.get('search') || '';
		const isAlreadyOnResults = location.pathname === '/categories/all' && currentSearch.trim() === query.trim();

		if (isAlreadyOnResults) {
			scroller.scrollTo('all-goals-and-lists', {
				duration: 800,
				delay: 0,
				smooth: 'easeInOutQuart',
				offset: -150,
			});
		} else {
			navigate(targetUrl);
		}
	};

	// Переход к цели или списку
	const handleItemClick = (item: SearchResultItem) => {
		setIsDropdownOpen(false);
		if (item.type === 'goal') {
			navigate(`/goals/${item.item.code}`);
		} else {
			navigate(`/list/${item.item.code}`);
		}
	};

	// Обработчик фокуса на поле ввода
	const handleInputFocus = () => {
		if (results.length > 0) {
			setIsDropdownOpen(true);
		}
	};

	// Обработчик нажатия Enter
	const handleKeyDown = (event: React.KeyboardEvent) => {
		if (event.key === 'Enter') {
			event.preventDefault();
			handleShowAllResults();
		}
		if (event.key === 'Escape') {
			setIsDropdownOpen(false);
		}
	};

	// Компонент для отображения результатов с кастомным скроллбаром
	const ScrollableResults = () => {
		return (
			<div
				className={element('results')}
				style={{
					maxHeight: isModal ? 'auto' : '60vh',
					overflowY: 'auto',
					padding: '8px 0',
				}}
			>
				{results.map((result) => (
					<div
						key={`${result.type}-${result.item.code}`}
						className={element('result-item')}
						role="button"
						tabIndex={0}
						onClick={() => handleItemClick(result)}
						onKeyDown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								handleItemClick(result);
							}
						}}
						aria-label={`Перейти к ${result.type === 'goal' ? 'цели' : 'списку'} ${result.item.title}`}
					>
						<CardShort item={result.item} variant={result.type} typeLabel={result.type === 'goal' ? 'Цель' : 'Список'} />
					</div>
				))}
			</div>
		);
	};

	return (
		<div className={block({isModal, theme})} ref={searchRef}>
			{!isModal && (
				<div className={element('input-wrapper')}>
					<FieldInput
						className={element('input')}
						placeholder="Поиск целей и списков"
						id="global-search"
						value={query}
						setValue={handleSearchChange}
						iconEnd="search"
						iconEndClick={handleShowAllResults}
						onFocus={handleInputFocus}
						onKeyDown={handleKeyDown}
						theme={!isModal && theme === 'transparent' ? 'transparent' : undefined}
						focusBorder="white"
					/>
					{isSearching && (
						<div className={element('loading')}>
							<Loader isLoading />
						</div>
					)}
				</div>
			)}

			{(isDropdownOpen || isModal) && (
				<div className={element('dropdown')}>
					{isModal && (
						<div className={element('input-wrapper')}>
							<FieldInput
								className={element('input')}
								placeholder="Поиск целей и списков"
								id="global-search"
								value={query}
								setValue={handleSearchChange}
								iconEnd="search"
								iconEndClick={handleShowAllResults}
								onFocus={handleInputFocus}
								onKeyDown={handleKeyDown}
								theme={!isModal && theme === 'transparent' ? 'transparent' : undefined}
								focusBorder="white"
							/>
							{isSearching && (
								<div className={element('loading')}>
									<Loader isLoading />
								</div>
							)}
						</div>
					)}
					{results.length > 0 ? (
						<>
							<ScrollableResults />

							{totalCount > 6 && (
								<div className={element('show-all', {isModal})}>
									<Button
										className={element('show-all-button')}
										theme="blue-light"
										size="medium"
										onClick={handleShowAllResults}
									>
										<>Показать результаты: {totalCount}</>
									</Button>
								</div>
							)}
						</>
					) : (
						<div className={element('no-results')}>
							<div className={element('no-results-content')}>
								<Svg icon="empty" className={element('no-results-icon')} />
								<span className={element('no-results-text')}>
									{query.length < 2 ? 'Введите минимум 2 символа для поиска' : 'Ничего не найдено'}
								</span>
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	);
});
