import {observer} from 'mobx-react-lite';
import {FC, useCallback, useEffect, useRef, useState} from 'react';
import {useNavigate, useParams, useSearchParams} from 'react-router-dom';

import {addGoal} from '@/entities/goal/api/addGoal';
import {goalsToMapPoints} from '@/entities/goal/api/mapApi';
import {markGoal} from '@/entities/goal/api/markGoal';
import {removeGoal} from '@/entities/goal/api/removeGoal';
import {useOGImage} from '@/entities/goal/lib/useOGImage';
import {TitleWithTags} from '@/entities/goal/ui/TitleWithTags/TitleWithTags';
import {addListGoal} from '@/entities/goal-list/api/addListGoal';
import {getListGoalsPage} from '@/entities/goal-list/api/getListGoalsPage';
import {markAllGoalsFromList} from '@/entities/goal-list/api/markAllGoalsFromList';
import {removeListGoal} from '@/entities/goal-list/api/removeListGoal';
import {IList} from '@/entities/goal-list/model/types';
import {requireEmailConfirmed} from '@/entities/user/lib/requireEmailConfirmed';
import {UserStore} from '@/entities/user/model/UserStore';
import {useBem} from '@/shared/lib/hooks/useBem';
import useScreenSize from '@/shared/lib/hooks/useScreenSize';
import {ModalStore} from '@/shared/model/ModalStore';
import {Loader} from '@/shared/ui/Loader/Loader';
import {ScrollToTop} from '@/shared/ui/ScrollToTop/ScrollToTop';
import {SEO} from '@/shared/ui/SEO/SEO';
import {AsideGoal} from '@/widgets/aside-goal/AsideGoal';
import '@/widgets/list-goals/list-goals-container.scss';
import {ContentListGoals} from '@/widgets/list-goals/ContentListGoals';
import {ListGoalsContainerSkeleton} from '@/widgets/list-goals/ListGoalsContainerSkeleton';
import {
	buildListGoalsApiQuery,
	getListGoalsSearchParam,
	parseListGoalsFilterValues,
} from '@/widgets/list-goals-filters/listGoalsFiltersUtils';

interface ListGoalsContainerProps {
	page: string;
}

const ListGoalsContainerComponent: FC<ListGoalsContainerProps> = (props) => {
	const {page} = props;
	const [block, element] = useBem('list-goals-container');
	const [list, setList] = useState<IList | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const [search, setSearch] = useState('');
	const [searchTimer, setSearchTimer] = useState<NodeJS.Timeout | null>(null);
	const {isAuth} = UserStore;
	const {setIsOpen, setWindow, setModalProps} = ModalStore;
	const {isScreenMobile, isScreenSmallTablet} = useScreenSize();
	const navigate = useNavigate();
	const loadMoreRef = useRef<HTMLDivElement>(null);
	const loaderTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const [searchParams, setSearchParams] = useSearchParams();
	const searchParamsKey = searchParams.toString();
	const skipUrlFetchRef = useRef(true);
	const skipSearchUrlEffectRef = useRef(false);
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
		const initialSearch = getListGoalsSearchParam(searchParams);
		setSearch(initialSearch);

		(async () => {
			if (!listId) return;
			const res = await getListGoalsPage(listId, {
				page: 1,
				pageSize: 30,
				...buildListGoalsApiQuery(searchParams, initialSearch),
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
		if (skipSearchUrlEffectRef.current) {
			skipSearchUrlEffectRef.current = false;
			return;
		}
		if (!listId || !list || list.code !== listId) return;
		fetchList();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [searchParamsKey]);

	// Пишем поиск в URL без повторного запроса (он уже выполнен в onSearchChange), чтобы кнопка
	// "назад" в браузере восстанавливала строку поиска
	const updateListGoalsSearchUrl = useCallback(
		(searchValue: string) => {
			skipSearchUrlEffectRef.current = true;
			setSearchParams(
				(prev) => {
					const next = new URLSearchParams(prev);
					const trimmed = searchValue.trim();
					if (trimmed.length >= 2) {
						next.set('search', trimmed);
					} else {
						next.delete('search');
					}
					return next;
				},
				{replace: true}
			);
		},
		[setSearchParams]
	);

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
		if (page !== 'isList' || !list?.goalsPagination?.hasMore) return;

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
	}, [page, list?.goalsPagination?.hasMore, list?.goalsPagination?.page, searchParamsKey, search]);

	const onSearchChange = (query: string) => {
		setSearch(query);

		if (searchTimer) {
			clearTimeout(searchTimer);
		}

		setSearchTimer(
			setTimeout(() => {
				if (!listId) return;
				updateListGoalsSearchUrl(query);
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

	const openAddReview = () => {
		if (!requireEmailConfirmed()) {
			return;
		}
		if (page !== 'isListImpressions') {
			navigate(`/list/${list.code}/impressions`);
		}
		setModalProps({
			goalListId: list.id,
			onReviewAdded: () => {
				setList((prev) =>
					prev
						? {
								...prev,
								hasMyComment: true,
								totalComments: (prev.totalComments ?? 0) + 1,
						  }
						: prev
				);
			},
			onReviewRemoved: () => {
				setList((prev) =>
					prev
						? {
								...prev,
								hasMyComment: false,
								totalComments: Math.max(0, (prev.totalComments ?? 1) - 1),
						  }
						: prev
				);
			},
		});
		setWindow('add-review');
		setIsOpen(true);
	};

	const isGoalsTab = page === 'isList';

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
						openAddReview={openAddReview}
						hasMyComment={list.hasMyComment}
					/>
					<div className={element('content-wrapper')}>
						<ContentListGoals
							className={element('content')}
							list={list}
							page={page}
							search={search}
							isGoalsLoading={isGoalsTab && isLoading}
							onSearchChange={onSearchChange}
							updateGoal={updateGoal}
							onMyCommentChange={(hasComment) => {
								setList((prev) => {
									if (!prev) return prev;
									const wasComment = !!prev.hasMyComment;
									let {totalComments} = prev;
									if (hasComment && !wasComment) {
										totalComments = (totalComments ?? 0) + 1;
									} else if (!hasComment && wasComment) {
										totalComments = Math.max(0, (totalComments ?? 1) - 1);
									}
									return {...prev, hasMyComment: hasComment, totalComments};
								});
							}}
						/>
						{isGoalsTab && list.goalsPagination?.hasMore && !isLoading && (
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
