import {FC, useCallback, useMemo, useState} from 'react';
import {Link, useSearchParams} from 'react-router-dom';

import {IGoalMergeRequest} from '@/entities/goal/api/goals';
import {useBem} from '@/shared/lib/hooks/useBem';
import {formatDateString} from '@/shared/lib/time/formatDate';
import {getSingleValueParam, getSortIndexParam} from '@/shared/lib/urlListState';
import {EmptyState} from '@/shared/ui/EmptyState/EmptyState';
import {FieldInput} from '@/shared/ui/FieldInput/FieldInput';
import {FilterGroup, FiltersDrawer} from '@/shared/ui/FiltersDrawer/FiltersDrawer';
import {Line} from '@/shared/ui/Line/Line';
import Select, {OptionSelect} from '@/shared/ui/Select/Select';
import {Svg} from '@/shared/ui/Svg/Svg';
import {ISwitch, Switch} from '@/shared/ui/Switch/Switch';
import {Tag} from '@/shared/ui/Tag/Tag';

import '@/features/merge-requests-list/merge-requests-list.scss';

interface MergeRequestsListProps {
	className?: string;
	requests: Array<IGoalMergeRequest>;
	switchButtons: Array<ISwitch>;
}

const STATUS_TAGS: Record<IGoalMergeRequest['status'], {text: string; theme: 'gray' | 'green' | 'red'; title: string}> = {
	pending: {text: 'На рассмотрении', theme: 'gray', title: 'Запрос ожидает решения модератора'},
	approved: {text: 'Одобрено', theme: 'green', title: 'Цели объединены, прогресс участников сохранён'},
	auto_merged: {text: 'Объединено', theme: 'green', title: 'Цели объединены автоматически'},
	rejected: {text: 'Отклонено', theme: 'red', title: 'Модератор посчитал цели разными'},
};

const SORT_OPTIONS: Array<OptionSelect> = [
	{name: 'Новые', value: '-created_at'},
	{name: 'Старые', value: 'created_at'},
];

const STATUS_FILTERS: FilterGroup[] = [
	{
		key: 'status',
		label: 'Статус',
		options: [
			{name: 'На рассмотрении', code: 'pending'},
			{name: 'Одобрено', code: 'approved'},
			{name: 'Отклонено', code: 'rejected'},
		],
		allLabel: 'Все статусы',
	},
];

const matchesStatus = (request: IGoalMergeRequest, status: string): boolean => {
	if (status === 'approved') return request.status === 'approved' || request.status === 'auto_merged';
	return request.status === status;
};

interface GoalPreviewProps {
	title: string;
	code: string;
	image: string | null;
	description: string;
	link: boolean;
	element: (name: string, mods?: Record<string, boolean | string | undefined>) => string;
}

const GoalPreview: FC<GoalPreviewProps> = ({title, code, image, description, link, element}) => {
	const content = (
		<>
			{image ? (
				<img src={image} alt={title} className={element('goal-image')} />
			) : (
				<div className={element('goal-no-image')}>
					<Svg icon="mount" />
				</div>
			)}
			<span className={element('goal-info')}>
				<span className={element('goal-title')}>{title}</span>
				{description && <span className={element('goal-description')}>{description}</span>}
			</span>
		</>
	);

	if (link) {
		return (
			<Link to={`/goals/${code}`} className={element('goal', {link: true})}>
				{content}
			</Link>
		);
	}
	return <div className={element('goal')}>{content}</div>;
};

export const MergeRequestsList: FC<MergeRequestsListProps> = (props) => {
	const {className, requests, switchButtons} = props;
	const [block, element] = useBem('merge-requests-list', className);

	const [searchParams, setSearchParams] = useSearchParams();
	const [search, setSearch] = useState(() => searchParams.get('search') ?? '');
	const [sortIndex, setSortIndex] = useState(() => getSortIndexParam(searchParams, 'sort', SORT_OPTIONS));
	const [filterValues, setFilterValues] = useState<Record<string, string[]>>(() => ({
		status: getSingleValueParam(searchParams, 'status'),
	}));

	// Синхронизируем поиск/фильтр/сортировку с URL, чтобы кнопка "назад" в браузере
	// восстанавливала то же состояние списка
	const syncMergeRequestsUrl = useCallback(
		(overrides: {search?: string; sortIndex?: number; filters?: Record<string, string[]>}) => {
			const nextSearch = overrides.search ?? search;
			const nextSortIndex = overrides.sortIndex ?? sortIndex;
			const nextFilters = overrides.filters ?? filterValues;

			setSearchParams(
				(prev) => {
					const next = new URLSearchParams(prev);

					if (nextSearch.trim()) {
						next.set('search', nextSearch.trim());
					} else {
						next.delete('search');
					}

					if (nextFilters['status']?.length > 0) {
						next.set('status', nextFilters['status'][0]);
					} else {
						next.delete('status');
					}

					if (nextSortIndex > 0 && SORT_OPTIONS[nextSortIndex]) {
						next.set('sort', SORT_OPTIONS[nextSortIndex].value);
					} else {
						next.delete('sort');
					}

					return next;
				},
				{replace: true}
			);
		},
		[search, sortIndex, filterValues, setSearchParams]
	);

	const handleSearchChange = (value: string) => {
		setSearch(value);
		syncMergeRequestsUrl({search: value});
	};

	const handleSortSelect = (index: number) => {
		setSortIndex(index);
		syncMergeRequestsUrl({sortIndex: index});
	};

	const handleFilterChange = (key: string, selected: string[]) => {
		const nextFilters = {...filterValues, [key]: selected};
		setFilterValues(nextFilters);
		syncMergeRequestsUrl({filters: nextFilters});
	};

	const handleFilterReset = () => {
		const nextFilters = {status: []};
		setFilterValues(nextFilters);
		syncMergeRequestsUrl({filters: nextFilters});
	};

	const visibleRequests = useMemo(() => {
		const statusFilter = filterValues['status']?.[0];
		const query = search.trim().toLowerCase();
		const filtered = requests.filter((request) => {
			if (statusFilter && !matchesStatus(request, statusFilter)) return false;
			if (query) {
				const haystack = [request.sourceGoalTitle, request.targetGoalTitle, request.mergedGoalTitle, request.resolvedTitle]
					.join(' ')
					.toLowerCase();
				return haystack.includes(query);
			}
			return true;
		});
		const desc = SORT_OPTIONS[sortIndex].value === '-created_at';
		filtered.sort((a, b) => {
			const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
			return desc ? -diff : diff;
		});
		return filtered;
	}, [requests, filterValues, search, sortIndex]);

	return (
		<section className={block()}>
			<div className={element('filters')}>
				<div className={element('filters-wrapper')}>
					<Switch className={element('switch')} buttons={switchButtons} active="merges" />
				</div>
				<Line className={element('line')} />
				<div className={element('search-wrapper')}>
					<FieldInput
						className={element('search')}
						placeholder="Поисковой запрос"
						id="merge-requests-search"
						value={search}
						setValue={handleSearchChange}
						iconBegin="search"
						iconEnd={search.trim() ? 'cross' : undefined}
						iconEndClick={search.trim() ? () => handleSearchChange('') : undefined}
					/>
					<div className={element('categories-wrapper')}>
						<FiltersDrawer
							filters={STATUS_FILTERS}
							values={filterValues}
							onChange={handleFilterChange}
							onReset={handleFilterReset}
							totalCount={visibleRequests.length}
						/>
						<Select options={SORT_OPTIONS} activeOption={sortIndex} onSelect={handleSortSelect} filter />
					</div>
				</div>
			</div>
			{visibleRequests.length === 0 ? (
				<EmptyState
					title={requests.length === 0 ? 'Нет запросов на объединение' : 'По запросу ничего не найдено'}
					description={
						requests.length === 0
							? 'Здесь отображаются ваши запросы на объединение дублей целей. Обработанные запросы хранятся 30 дней.'
							: 'Попробуйте изменить параметры поиска или фильтра'
					}
				/>
			) : (
				<div className={element('items')}>
					{visibleRequests.map((request) => {
						const isMerged = request.status === 'approved' || request.status === 'auto_merged';
						const statusTag = STATUS_TAGS[request.status];
						return (
							<article key={request.id} className={element('item')}>
								<div className={element('header')}>
									<Tag text={statusTag.text} theme={statusTag.theme} title={statusTag.title} />
									<span className={element('date')}>{formatDateString(request.createdAt)}</span>
								</div>
								{isMerged ? (
									// Дубль удалён — показываем только итоговую объединённую цель.
									// Не fallback на targetGoalTitle: это снимок до merge (может быть удалённая цель).
									<div className={element('goals')}>
										<GoalPreview
											title={request.mergedGoalTitle || request.resolvedTitle || 'Объединённая цель'}
											code={request.mergedGoalCode}
											image={request.mergedGoalImage}
											description={request.mergedGoalDescription}
											link={!!request.mergedGoalCode}
											element={element}
										/>
									</div>
								) : (
									<div className={element('goals')}>
										<GoalPreview
											title={request.sourceGoalTitle}
											code={request.sourceGoalCode}
											image={request.sourceGoalImage}
											description={request.sourceGoalDescription}
											link={!!request.sourceGoal}
											element={element}
										/>
										<span className={element('amp')}>&amp;</span>
										<GoalPreview
											title={request.targetGoalTitle}
											code={request.targetGoalCode}
											image={request.targetGoalImage}
											description={request.targetGoalDescription}
											link={!!request.targetGoal}
											element={element}
										/>
									</div>
								)}
								{!isMerged && request.reason && (
									<p className={element('note', {secondary: true})}>Ваш комментарий: {request.reason}</p>
								)}
								{request.status === 'rejected' && (
									<>
										{request.rejectionReasonMessages?.length > 0 && (
											<ul className={element('reasons')}>
												<p className={element('note', {secondary: true})}>Причина отклонения:</p>
												{request.rejectionReasonMessages.map((message) => (
													<li key={message} className={element('reason')}>
														{message}
													</li>
												))}
											</ul>
										)}
										{request.adminNotes && (
											<p className={element('note', {secondary: true})}>
												Комментарий модератора: {request.adminNotes}
											</p>
										)}
									</>
								)}
							</article>
						);
					})}
				</div>
			)}
		</section>
	);
};
