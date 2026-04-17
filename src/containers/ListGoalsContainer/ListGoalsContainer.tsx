import {observer} from 'mobx-react-lite';
import {FC, useEffect, useRef, useState} from 'react';
import {useParams} from 'react-router-dom';

import {AsideGoal} from '@/components/AsideGoal/AsideGoal';
import {ContentListGoals} from '@/components/ContentListGoals/ContentListGoals';
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
import {getList} from '@/utils/api/get/getList';
import {getListGoalsPage} from '@/utils/api/get/getListGoalsPage';
import {addGoal} from '@/utils/api/post/addGoal';
import {addListGoal} from '@/utils/api/post/addListGoal';
import {markAllGoalsFromList} from '@/utils/api/post/markAllGoalsFromList';
import {markGoal} from '@/utils/api/post/markGoal';
import {removeGoal} from '@/utils/api/post/removeGoal';
import {removeListGoal} from '@/utils/api/post/removeListGoal';
import {GoalWithLocation} from '@/utils/mapApi';

import {ListGoalsContainerSkeleton} from './ListGoalsContainerSkeleton';
import './list-goals-container.scss';

const ListGoalsContainerComponent: FC = () => {
	const [block, element] = useBem('list-goals-container');
	const [list, setList] = useState<IList | null>(null);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const {isAuth} = UserStore;
	const {setIsOpen, setWindow} = ModalStore;
	const {isScreenMobile, isScreenSmallTablet} = useScreenSize();
	const loadMoreRef = useRef<HTMLDivElement>(null);
	const loaderTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Ге��ерируем динамич��ское OG изображение для списка
	const {imageUrl: ogImageUrl} = useOGImage({
		list,
		width: 1200,
		height: 630,
	});

	const params = useParams();
	const listId = params?.['id'];

	useEffect(() => {
		let cancelled = false;
		setList(null);
		(async () => {
			const res = await getList(`goal-lists/${listId}`);
			if (cancelled) return;
			if (res.success) {
				setList(res.data.list);
			}
		})();
		return () => {
			cancelled = true;
			if (loaderTimerRef.current) clearTimeout(loaderTimerRef.current);
		};
	}, [listId, isAuth]);

	// Ref для предотвращения повторных запросов (не вызывает ре-рендер)
	const isLoadingMoreRef = useRef(false);
	const lastRequestedPageRef = useRef(0);
	const listRef = useRef(list);
	listRef.current = list;

	// Подгрузка следующей страницы целей
	const loadMoreGoals = async () => {
		const currentList = listRef.current;
		if (isLoadingMoreRef.current || !currentList || !currentList.goalsPagination?.hasMore) return;

		const nextPage = currentList.goalsPagination.page + 1;
		if (lastRequestedPageRef.current >= nextPage) return;
		lastRequestedPageRef.current = nextPage;

		isLoadingMoreRef.current = true;

		// Показываем лоудер только если запрос занимает больше 300ms
		loaderTimerRef.current = setTimeout(() => setIsLoadingMore(true), 300);

		const res = await getListGoalsPage(currentList.code, nextPage, currentList.goalsPagination.pageSize);

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

	// IntersectionObserver для бесконечной прокрутки
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
	}, [list?.goalsPagination?.hasMore, list?.goalsPagination?.page]);

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
			// ��рогресс заданий обновляется автоматически на бэкенде

			setList({
				...list,
				...res.data,
			});
			lastRequestedPageRef.current = Number.MAX_SAFE_INTEGER;
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

		// Прогресс заданий обновляется автоматически на бэкенде

		const updatedGoal = {
			...list.goals[i],
			addedByUser: operation !== 'delete',
			completedByUser: operation === 'mark' ? !done : operation === 'delete' ? false : list.goals[i].completedByUser,
			totalAdded: res.data.totalAdded,
		};

		const newGoals = [...list.goals];
		newGoals[i] = updatedGoal;

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
		});
		return true;
	};

	if (!list || list.code !== listId) {
		return <ListGoalsContainerSkeleton />;
	}

	// ��обираем массив целей с локацией для карты
	const goalsWithLocation = list.goals
		.filter((goal) => goal.location && typeof goal.location.latitude === 'number' && typeof goal.location.longitude === 'number')
		.map((goal) => ({
			location: goal.location!,
			userVisitedLocation: goal.completedByUser,
			name: goal.title,
			address: goal.location?.address,
			description: goal.description,
		})) as GoalWithLocation[];

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
					/>
					<div className={element('content-wrapper')}>
						<ContentListGoals className={element('content')} list={list} updateGoal={updateGoal} />
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
