import {observer} from 'mobx-react-lite';
import {FC, useCallback, useEffect, useRef, useState} from 'react';
import {useParams, useSearchParams} from 'react-router-dom';

import {AsideGoal} from '@/components/AsideGoal/AsideGoal';
import {ContentListGoals} from '@/components/ContentListGoals/ContentListGoals';
import {buildListGoalsApiQuery, parseListGoalsFilterValues} from '@/components/ListGoalsFilters/listGoalsFiltersUtils';
import {Loader} from '@/components/Loader/Loader';
import {ScrollToTop} from '@/components/ScrollToTop/ScrollToTop';
import {SEO} from '@/components/SEO/SEO';
import {TitleWithTags} from '@/components/TitleWithTags/TitleWithTags';
import {useBem} from '@/hooks/useBem';
import {useOGImage} from '@/hooks/useOGImage';
import useScreenSize from '@/hooks/useScreenSize';
import {ModalStore} from '@/store/ModalStore';
import {UserStore} from '@/store/UserStore';
import {IList} from '@/typings/list';
import {getListGoalsPage} from '@/utils/api/get/getListGoalsPage';
import {addGoal} from '@/utils/api/post/addGoal';
import {addListGoal} from '@/utils/api/post/addListGoal';
import {markAllGoalsFromList} from '@/utils/api/post/markAllGoalsFromList';
import {markGoal} from '@/utils/api/post/markGoal';
import {removeGoal} from '@/utils/api/post/removeGoal';
import {removeListGoal} from '@/utils/api/post/removeListGoal';
import {goalsToMapPoints} from '@/utils/mapApi';

import './list-goals-container.scss';
import {ListGoalsContainerSkeleton} from './ListGoalsContainerSkeleton';

const ListGoalsContainerComponent: FC = () => {
	const [block, element] = useBem('list-goals-container');
	const [list, setList] = useState<IList | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const [search, setSearch] = useState('');
	const [searchTimer, setSearchTimer] = useState<NodeJS.Timeout | null>(null);
	const {isAuth} = UserStore;
	const {setIsOpen, setWindow} = ModalStore;
	const {isScreenMobile, isScreenSmallTablet} = useScreenSize();
	const loadMoreRef = useRef<HTMLDivElement>(null);
	const loaderTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const [searchParams] = useSearchParams();
	const searchParamsKey = searchParams.toString();
	const skipUrlFetchRef = useRef(true);
	const lastRequestedPageRef = useRef(0);

	const {imageUrl: ogImageUrl} = useOGImage({
		list,
		width: 1200,
		height: 630,
	});

	const params = useParams();
	const listId = params?.['id'];

	const buildQuery = useCallback(() => buildListGoalsApiQuery(searchParams, search), [searchParams, search]);

	const fetchList = useCallback(
		async (options?: {silent?: boolean}) => {
			if (!listId) return false;

			if (!options?.silent) {
				setIsLoading(true);
			}

			try {
				const res = await getListGoalsPage(listId, {page: 1, pageSize: 30, ...buildQuery()});
				if (res.success) {
					setList(res.data.list);
					lastRequestedPageRef.current = 0;
					return true;
				}
				return false;
			} finally {
				if (!options?.silent) {
					setIsLoading(false);
				}
			}
		},
		[listId, buildQuery]
	);

	useEffect(() => {
		let cancelled = false;
		skipUrlFetchRef.current = true;
		setList(null);
		setSearch('');

		(async () => {
			if (!listId) return;
			const res = await getListGoalsPage(listId, {
				page: 1,
				pageSize: 30,
				...buildListGoalsApiQuery(searchParams, ''),
			});
			if (cancelled) return;
			if (res.success) {
				setList(res.data.list);
				lastRequestedPageRef.current = 0;
			}
		})();

		return () => {
			cancelled = true;
			if (loaderTimerRef.current) clearTimeout(loaderTimerRef.current);
			if (searchTimer) clearTimeout(searchTimer);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [listId, isAuth]);

	useEffect(() => {
		if (skipUrlFetchRef.current) {
			skipUrlFetchRef.current = false;
			return;
		}
		if (!listId || !list || list.code !== listId) return;
		fetchList();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [searchParamsKey]);

	const isLoadingMoreRef = useRef(false);
	const listRef = useRef(list);
	listRef.current = list;

	const loadMoreGoals = async () => {
		const currentList = listRef.current;
		if (isLoadingMoreRef.current || !currentList || !currentList.goalsPagination?.hasMore) return;

		const nextPage = currentList.goalsPagination.page + 1;
		if (lastRequestedPageRef.current >= nextPage) return;
		lastRequestedPageRef.current = nextPage;

		isLoadingMoreRef.current = true;

		loaderTimerRef.current = setTimeout(() => setIsLoadingMore(true), 300);

		const res = await getListGoalsPage(currentList.code, {
			page: nextPage,
			pageSize: currentList.goalsPagination.pageSize,
			...buildQuery(),
		});

		if (res.success) {
			const newGoals = res.data.list.goals;
			const newPagination = res.data.list.goalsPagination;
			setList((prev) => {
				if (!prev) return prev;
				return {
					...prev,
					goals: [...prev.goals, ...newGoals],
					goalsPagination: newPagination,
				};
			});
		} else {
			lastRequestedPageRef.current = nextPage - 1;
		}

		if (loaderTimerRef.current) clearTimeout(loaderTimerRef.current);
		isLoadingMoreRef.current = false;
		setIsLoadingMore(false);
	};

	useEffect(() => {
		if (!list?.goalsPagination?.hasMore) return;

		const intersectionObserver = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting) {
					loadMoreGoals();
				}
			},
			{rootMargin: '400px'}
		);

		const ref = loadMoreRef.current;
		if (ref) {
			intersectionObserver.observe(ref);
		}

		return () => {
			if (ref) {
				intersectionObserver.unobserve(ref);
			}
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [list?.goalsPagination?.hasMore, list?.goalsPagination?.page, searchParamsKey, search]);

	const onSearchChange = (query: string) => {
		setSearch(query);

		if (searchTimer) {
			clearTimeout(searchTimer);
		}

		setSearchTimer(
			setTimeout(() => {
				if (!listId) return;
				setIsLoading(true);
				getListGoalsPage(listId, {page: 1, pageSize: 30, ...buildListGoalsApiQuery(searchParams, query)})
					.then((res) => {
						if (res.success) {
							setList(res.data.list);
							lastRequestedPageRef.current = 0;
						}
					})
					.finally(() => setIsLoading(false));
			}, 300)
		);
	};

	const shouldRemoveGoalAfterUpdate = (operation: 'add' | 'delete' | 'mark', done?: boolean, completedByUser?: boolean) => {
		const completionFilter = parseListGoalsFilterValues(searchParams)['completionStatus'][0];
		if (completionFilter === 'not_completed' && operation === 'mark' && !done && !completedByUser) {
			return true;
		}
		if (completionFilter === 'completed' && operation === 'mark' && done && completedByUser) {
			return true;
		}
		return false;
	};

	const updateList = async (code: string, operation: 'add' | 'delete' | 'mark-all'): Promise<boolean> => {
		if (!isAuth) {
			setWindow('login');
			setIsOpen(true);
			return false;
		}

		const res = await (operation === 'add'
			? addListGoal(code)
			: operation === 'delete'
			? removeListGoal(code)
			: markAllGoalsFromList(code));

		if (res.success) {
			setList({
				...list,
				...res.data,
			});
			lastRequestedPageRef.current = Number.MAX_SAFE_INTEGER;
			if (operation === 'mark-all') {
				await fetchList({silent: true});
			}
			return true;
		}
		return res.success;
	};

	const updateGoal = async (code: string, i: number, operation: 'add' | 'delete' | 'mark', done?: boolean): Promise<boolean> => {
		if (!isAuth) {
			setWindow('login');
			setIsOpen(true);
			return false;
		}

		const res = await (operation === 'add' ? addGoal(code) : operation === 'delete' ? removeGoal(code) : markGoal(code, !done));

		if (!res.success || !list) {
			return false;
		}

		const currentGoal = list.goals[i];
		const updatedGoal = {
			...currentGoal,
			addedByUser: operation !== 'delete',
			completedByUser: operation === 'mark' ? !done : operation === 'delete' ? false : currentGoal.completedByUser,
			totalAdded: res.data.totalAdded,
		};

		let newGoals = [...list.goals];
		if (shouldRemoveGoalAfterUpdate(operation, done, currentGoal.completedByUser)) {
			newGoals = newGoals.filter((_, index) => index !== i);
		} else {
			newGoals[i] = updatedGoal;
		}

		let {userCompletedGoals} = list;

		if (operation === 'mark' && !done && !list.goals[i].completedByUser) {
			userCompletedGoals += 1;
		} else if (operation === 'mark' && done && list.goals[i].completedByUser) {
			userCompletedGoals -= 1;
		} else if (operation === 'delete' && list.goals[i].completedByUser) {
			userCompletedGoals -= 1;
		}

		const completedByUser = userCompletedGoals === list.goalsCount;

		setList({
			...list,
			goals: newGoals,
			userCompletedGoals,
			completedByUser,
			totalCompleted: completedByUser ? list.totalCompleted + 1 : list.totalCompleted,
			goalsPagination: list.goalsPagination
				? {
						...list.goalsPagination,
						totalGoals: Math.max(0, list.goalsPagination.totalGoals - (newGoals.length < list.goals.length ? 1 : 0)),
				  }
				: undefined,
		});
		return true;
	};

	if (!list || list.code !== listId) {
		return <ListGoalsContainerSkeleton />;
	}

	// Точки для кнопки «Открыть карту» (превью из загруженной страницы; полный набор — через maps/list API)
	const goalsWithLocation = goalsToMapPoints(list.goals);

	return (
		<>
			<SEO
				title={list.title}
				description={list.description || `Список целей "${list.title}" на платформе Delting`}
				dynamicImage={ogImageUrl}
				type="article"
			/>
			<main className={block({category: list.category.nameEn})}>
				<article className={element('wrapper')}>
					{(isScreenSmallTablet || isScreenMobile) && (
						<TitleWithTags
							title={list.title}
							category={list.category}
							complexity={list.complexity}
							className={element('title')}
							totalCompleted={list.totalCompleted}
							isList
							theme="light"
						/>
					)}
					<AsideGoal
						className={element('aside')}
						title={list.title}
						image={list.image}
						updateGoal={updateList}
						added={list.addedByUser}
						code={list.code}
						isList
						done={list.completedByUser}
						canEdit={list.isCanEdit || list.isCanAddGoals}
						location={goalsWithLocation}
						list={list.goals}
						listCode={list.code}
						hasScratchMap={list.hasScratchMap}
					/>
					<div className={element('content-wrapper')}>
						<ContentListGoals
							className={element('content')}
							list={list}
							search={search}
							onSearchChange={onSearchChange}
							updateGoal={updateGoal}
						/>
						{isLoading && (
							<div className={element('loader')}>
								<Loader isLoading />
							</div>
						)}
						{list.goalsPagination?.hasMore && (
							<div ref={loadMoreRef}>
								<Loader isLoading={isLoadingMore} />
							</div>
						)}
					</div>
				</article>
				<ScrollToTop />
			</main>
		</>
	);
};

export const ListGoalsContainer = observer(ListGoalsContainerComponent);
