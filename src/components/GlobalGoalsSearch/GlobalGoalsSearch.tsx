import {observer} from 'mobx-react-lite';
import {FC, useCallback, useEffect, useRef, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {scroller} from 'react-scroll';

import {useBem} from '@/hooks/useBem';
import {IGoal} from '@/typings/goal';
import {getAllGoals} from '@/utils/api/get/getAllGoals';

import {Button} from '../Button/Button';
import {CardShort} from '../CardShort/CardShort';
import {FieldInput} from '../FieldInput/FieldInput';
import {Loader} from '../Loader/Loader';
import {Svg} from '../Svg/Svg';
import './global-goals-search.scss';

interface GlobalGoalsSearchProps {
	className?: string;
	isModal?: boolean;
	theme?: 'white' | 'transparent';
}

export const GlobalGoalsSearch: FC<GlobalGoalsSearchProps> = observer((props) => {
	const {className, isModal, theme} = props;

	const [block, element] = useBem('global-goals-search', className);
	const navigate = useNavigate();

	const [query, setQuery] = useState('');
	const [isSearching, setIsSearching] = useState(false);
	const [results, setResults] = useState<IGoal[]>([]);
	const [totalCount, setTotalCount] = useState(0);
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const [searchTimer, setSearchTimer] = useState<NodeJS.Timeout | null>(null);

	const searchRef = useRef<HTMLDivElement>(null);

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

	// Обработка поиска с дебаунсом
	const performSearch = useCallback(async (searchQuery: string) => {
		if (searchQuery.length < 2) {
			setResults([]);
			setTotalCount(0);
			setIsDropdownOpen(false);
			return;
		}

		setIsSearching(true);

		try {
			const response = await getAllGoals('all', {
				search: searchQuery,
				page: 1,
				limit: 6, // Показываем максимум 6 результатов
			});

			if (response.success) {
				setResults(response.data.data);
				setTotalCount(response.data.pagination.totalItems);
				setIsDropdownOpen(true);
			}
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
		navigate(`/categories/all?search=${encodeURIComponent(query)}`);

		// Добавляем небольшую задержку для загрузки страницы, затем скроллим
		setTimeout(() => {
			scroller.scrollTo('catalog-items-goals', {
				duration: 800,
				delay: 100,
				smooth: 'easeInOutQuart',
				offset: -150,
			});
		}, 100);
	};

	// Переход к конкретной цели
	const handleGoalClick = (goalCode: string) => {
		setIsDropdownOpen(false);
		navigate(`/goals/${goalCode}`);
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
				{results.map((goal) => (
					<div
						key={goal.code}
						className={element('result-item')}
						role="button"
						tabIndex={0}
						onClick={() => handleGoalClick(goal.code)}
						onKeyDown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								handleGoalClick(goal.code);
							}
						}}
						aria-label={`Перейти к цели ${goal.title}`}
					>
						<CardShort goal={goal} />
					</div>
				))}
			</div>
		);
	};

	return (
		<div className={block({isModal, theme})} ref={searchRef}>
			<div className={element('input-wrapper')}>
				<FieldInput
					className={element('input')}
					placeholder="Поиск целей"
					id="global-search"
					value={query}
					setValue={handleSearchChange}
					iconEnd="search"
					onFocus={handleInputFocus}
					onKeyDown={handleKeyDown}
					theme={!isModal && theme === 'transparent' ? 'transparent' : undefined}
				/>
				{isSearching && (
					<div className={element('loading')}>
						<Loader isLoading />
					</div>
				)}
			</div>

			{isDropdownOpen && (
				<div className={element('dropdown')}>
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
								<Svg icon="search" className={element('no-results-icon')} />
								<span className={element('no-results-text')}>
									{query.length < 2 ? 'Введите минимум 2 символа для поиска' : 'Цели не найдены'}
								</span>
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	);
});
