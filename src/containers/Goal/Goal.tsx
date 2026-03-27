import {observer} from 'mobx-react-lite';
import {FC, useEffect, useRef, useState} from 'react';
import {useParams} from 'react-router-dom';

import {AsideGoal} from '@/components/AsideGoal/AsideGoal';
import {Card} from '@/components/Card/Card';
import {ContentGoal} from '@/components/ContentGoal/ContentGoal';
import {EditGoal} from '@/components/EditGoal/EditGoal';
import {HeaderGoal} from '@/components/HeaderGoal/HeaderGoal';
import {Loader} from '@/components/Loader/Loader';
import {ScrollToTop} from '@/components/ScrollToTop/ScrollToTop';
import {SEO} from '@/components/SEO/SEO';
import {Title} from '@/components/Title/Title';
import {useBem} from '@/hooks/useBem';
import {useOGImage} from '@/hooks/useOGImage';
import useScreenSize from '@/hooks/useScreenSize';
import {GoalStore} from '@/store/GoalStore';
import {ModalStore} from '@/store/ModalStore';
import {ThemeStore} from '@/store/ThemeStore';
import {UserStore} from '@/store/UserStore';
import {IGoal} from '@/typings/goal';
import {IPage} from '@/typings/page';
import {getGoal} from '@/utils/api/get/getGoal';
import {addGoal} from '@/utils/api/post/addGoal';
import {markGoal} from '@/utils/api/post/markGoal';
import {removeGoal} from '@/utils/api/post/removeGoal';

import {useSimilarGoalsByCategory} from './hooks/useSimilarGoalsByCategory';

import './goal.scss';

/** GET goals/:code отдаёт addedFromList; при отсутствии — camelCase из рендерера */
const normalizeGoalFromApi = (raw: IGoal & {added_from_list?: string[]}): IGoal => {
	const addedFromList = Array.isArray(raw.addedFromList)
		? raw.addedFromList
		: Array.isArray(raw.added_from_list)
		? raw.added_from_list
		: [];
	return {...raw, addedFromList};
};

export const Goal: FC<IPage> = observer(({page}) => {
	const [block, element] = useBem('goal');
	const {isScreenMobile, isScreenSmallTablet} = useScreenSize();
	const headerRef = useRef<HTMLElement | null>(null);
	const {isAuth} = UserStore;

	const {setId} = GoalStore;
	const params = useParams();
	const listId = params?.['id'];
	const [goal, setGoal] = useState<IGoal | null>(null);
	const [isEditing, setIsEditing] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState(0); // Триггер для обновления истории

	const {setIsOpen, setWindow} = ModalStore;
	const {setHeader} = ThemeStore;

	useEffect(() => {
		(async () => {
			if (listId) {
				setIsLoading(true);
				const res = await getGoal(listId);
				if (res.success) {
					setGoal(normalizeGoalFromApi(res.data.goal));
					setId(res.data.goal.id);
				}
				setIsLoading(false);
			}
		})();
	}, [listId, isAuth]);

	// Счётчик записей для вкладки «История прогресса» — из userProgress (не из recentEntries: может не приходить)
	useEffect(() => {
		if (!goal?.addedByUser || goal.regularConfig) return;
		const count = goal.userProgress?.progressEntriesCount ?? goal.userProgress?.recentEntries?.length ?? 0;
		setGoal((prev) => {
			if (!prev || prev.progressEntriesCount === count) return prev;
			return {...prev, progressEntriesCount: count};
		});
	}, [goal?.id, goal?.addedByUser, goal?.regularConfig, goal?.userProgress]);

	// После действий на странице истории — перезагрузить цель (обновится user_progress)
	useEffect(() => {
		if (historyRefreshTrigger === 0 || !listId) return;
		let cancelled = false;
		(async () => {
			const res = await getGoal(listId);
			if (!cancelled && res.success && res.data.goal) {
				setGoal(normalizeGoalFromApi(res.data.goal));
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [historyRefreshTrigger, listId]);

	const openAddReview = () => {
		setWindow('add-review');
		setIsOpen(true);
	};

	const updateGoal = async (
		code: string,
		operation: 'add' | 'delete' | 'mark' | 'partial' | 'start',
		done?: boolean
	): Promise<boolean> => {
		if (!goal) {
			return false;
		}

		// Специальная обработка для начала выполнения
		if (operation === 'start') {
			// Логика начала выполнения обрабатывается в AsideGoal
			// Здесь можем добавить дополнительную логику если нужно
			return false;
		}

		// Специальная обработка для частичного выполнения
		if (operation === 'partial') {
			// Логика частичного выполнения обрабатывается в AsideGoal
			// Здесь можем добавить дополнительную логику если нужно
			return false;
		}

		if (!isAuth) {
			setWindow('login');
			setIsOpen(true);
			return false;
		}

		const res = await (operation === 'add'
			? addGoal(code)
			: operation === 'delete'
			? removeGoal(code)
			: markGoal(
					code,
					!done,
					!done
						? {
								title: 'Цель успешно выполнена!',
								type: 'success',
								id: Math.random().toString(36).substring(2, 15),
								message: 'Оставьте впечатление чтобы заработать больше очков',
								actionText: 'Добавить впечатление',
								action: openAddReview,
						  }
						: undefined
			  ));

		if (!res.success) {
			return false;
		}

		const updatedGoal = {
			addedByUser: operation !== 'delete',
			completedByUser: operation === 'mark' ? !done : false,
			totalAdded: res.data.totalAdded,
			totalCompleted: res.data.totalCompleted,
		};

		// Функциональное обновление: иначе после patchParentUserProgress(null) из AsideGoal
		// следующий setGoal({...goal, ...}) с устаревшим goal снова подставляет старый userProgress.
		setGoal((prev) => {
			if (!prev) {
				return null;
			}
			// POST add/remove возвращают полную цель (GoalSerializer) — подмешиваем, чтобы не тянуть старый userProgress
			const fromApi = res.data as Partial<IGoal> & {id?: number};
			if ((operation === 'delete' || operation === 'add') && typeof fromApi.id === 'number' && fromApi.id === prev.id) {
				return {...prev, ...fromApi} as IGoal;
			}
			const next = {...prev, ...updatedGoal} as IGoal;
			if (operation === 'mark') {
				const data = res.data as Partial<IGoal> & {userProgress?: IGoal['userProgress']};
				if (Object.prototype.hasOwnProperty.call(data, 'userProgress')) {
					next.userProgress = data.userProgress ?? null;
					if (next.userProgress == null) {
						next.progressEntriesCount = 0;
					} else if (data.progressEntriesCount !== undefined) {
						next.progressEntriesCount = data.progressEntriesCount;
					}
				}
			}
			return next;
		});

		// Если удалена или добавлена регулярная цель, перезагружаем данные цели, чтобы обновить regularConfig.statistics
		if ((operation === 'delete' || operation === 'add') && goal.regularConfig && listId) {
			const reloadRes = await getGoal(listId);
			if (reloadRes.success && reloadRes.data.goal) {
				setGoal(normalizeGoalFromApi(reloadRes.data.goal));
			}
		}

		// Прогресс заданий обновляется автоматически на бэкенде
		return true;
	};

	const handleGoalUpdated = (updatedGoal: IGoal) => {
		setGoal({...goal, ...updatedGoal});
		setHeader('transparent');
		setIsEditing(false);
	};

	const handleGoalUpdate = async (updatedGoal?: IGoal | Partial<IGoal>) => {
		// Патч или полная цель с API
		if (updatedGoal !== undefined && Object.keys(updatedGoal).length > 0) {
			setGoal((prev) => (prev ? ({...prev, ...updatedGoal} as IGoal) : null));
			return;
		}
		if (goal && listId) {
			// Иначе перезагружаем цель из API
			setIsLoading(true);
			const res = await getGoal(listId);
			if (res.success && res.data.goal) {
				setGoal(normalizeGoalFromApi(res.data.goal));
			}
			setIsLoading(false);
		}
	};

	const handleCancelEdit = () => {
		setHeader('transparent');
		setIsEditing(false);
	};

	const handleGoalCompleted = async () => {
		// Если цель регулярная, перезагружаем её для обновления статистики
		if (goal?.regularConfig) {
			try {
				const res = await getGoal(listId || '');
				if (res.success && res.data?.goal) {
					setGoal(normalizeGoalFromApi(res.data.goal));
					setId(res.data.goal.id);
				}
			} catch (error) {
				console.error('Ошибка при перезагрузке цели:', error);
			}
		} else if (goal) {
			// Для обычных целей обновляем состояние как выполненной
			setGoal({
				...goal,
				completedByUser: true,
			});
		}
	};

	// Функция для обновления истории выполнения регулярной цели
	const handleHistoryRefresh = () => {
		setHistoryRefreshTrigger((prev) => prev + 1);
	};

	const [shrink, setShrink] = useState(false);
	const [headerHeight, setHeaderHeight] = useState<number>(340);
	const collapsedHeaderHeightMobile = 260; // на какой высоте сворачивается header на мобильных устройствах
	const headerHeightRef = useRef(headerHeight);
	const shrinkRef = useRef(false);
	const expandedHeaderHeightRef = useRef<number | null>(null);

	useEffect(() => {
		headerHeightRef.current = headerHeight;
	}, [headerHeight]);

	useEffect(() => {
		shrinkRef.current = shrink;
		if (!shrink && headerRef.current) {
			const h = headerRef.current.offsetHeight;
			const prevExpanded = expandedHeaderHeightRef.current;
			if (prevExpanded == null || h > prevExpanded) {
				expandedHeaderHeightRef.current = h;
			}
		}
	}, [shrink]);

	const {similarGoals} = useSimilarGoalsByCategory(goal?.code || null, !!goal);

	// Генерируем динамическое OG изображение
	const {imageUrl: ogImageUrl} = useOGImage({
		goal,
		width: 1200,
		height: 630,
	});

	const updateHeaderHeight = () => {
		if (headerRef.current) {
			const h = headerRef.current.offsetHeight;
			setHeaderHeight(h);
			if (!shrinkRef.current) {
				const prevExpanded = expandedHeaderHeightRef.current;
				if (prevExpanded == null || h > prevExpanded) {
					expandedHeaderHeightRef.current = h;
				}
			}
		} else {
			setHeaderHeight(340);
		}
	};

	useEffect(() => {
		const el = headerRef.current;
		if (!el) return;
		const oh = el.offsetHeight;
		if (oh > headerHeight) {
			updateHeaderHeight();
		} else if (!shrinkRef.current) {
			const prevExpanded = expandedHeaderHeightRef.current;
			if (prevExpanded == null || oh > prevExpanded) {
				expandedHeaderHeightRef.current = oh;
			}
		}
	}, [shrink, isScreenMobile, isScreenSmallTablet, headerHeight]);

	useEffect(() => {
		let rafId: number | null = null;
		let ticking = false;

		const onScroll = () => {
			if (ticking) return;
			ticking = true;

			rafId = window.requestAnimationFrame(() => {
				ticking = false;

				const isNarrowPhone = isScreenMobile;
				const scrollY = window.scrollY || 0;
				const currentShrink = shrinkRef.current;

				const expandedH = expandedHeaderHeightRef.current ?? headerHeightRef.current;

				if (isNarrowPhone) {
					const shrinkAfterScrollPx = collapsedHeaderHeightMobile;
					const expandHysteresisPx = 40;
					let enterAt = expandedH - shrinkAfterScrollPx;
					if (enterAt < expandHysteresisPx + 1) {
						enterAt = expandHysteresisPx + 1;
					}
					const exitAt = enterAt - expandHysteresisPx;

					if (!currentShrink) {
						if (scrollY > enterAt) setShrink(true);
					} else if (scrollY < exitAt) {
						setShrink(false);
					}
				} else {
					const enterAt = 40;
					const exitAt = 30;

					if (!currentShrink && scrollY > enterAt) {
						setShrink(true);
					} else if (currentShrink && scrollY < exitAt) {
						setShrink(false);
					}
				}
			});
		};

		onScroll();

		window.addEventListener('scroll', onScroll, {passive: true});
		return () => {
			window.removeEventListener('scroll', onScroll);
			if (rafId != null) window.cancelAnimationFrame(rafId);
		};
	}, [isScreenMobile]);

	if (isEditing && goal) {
		return (
			<main className={block({editing: true})}>
				<EditGoal goal={goal} onGoalUpdated={handleGoalUpdated} cancelEdit={handleCancelEdit} />
			</main>
		);
	}

	if (!goal) {
		return <Loader isLoading={isLoading} isPageLoader />;
	}

	const expandedHeaderHeight = expandedHeaderHeightRef.current ?? headerHeight;

	return (
		<>
			<SEO
				title={goal.title}
				description={goal.description || `Достигните цель "${goal.title}" на платформе Delting`}
				dynamicImage={ogImageUrl}
				type="article"
			/>
			<main className={block({shrink})}>
				<HeaderGoal
					ref={headerRef}
					title={goal.title}
					category={goal.category}
					image={goal.image}
					background={goal.image}
					goal={goal}
					shrink={shrink}
					onImageLoad={updateHeaderHeight}
				/>
				<section
					className={element('wrapper')}
					style={{
						paddingTop: isScreenMobile
							? shrink
								? Math.max(expandedHeaderHeight - collapsedHeaderHeightMobile, 0)
								: expandedHeaderHeight
							: 0,
					}}
				>
					<AsideGoal
						key={`aside-${goal.id}-${goal.regularConfig?.statistics?.updatedAt || ''}-${goal.regularConfig?.frequency || ''}-${
							goal.regularConfig?.durationValue || 0
						}-${goal.regularConfig?.allowSkipDays || 0}`}
						className={element('aside', {shrink})}
						title={goal.title}
						image={goal.image || ''}
						added={goal.addedByUser}
						updateGoal={updateGoal}
						code={goal.code}
						goalId={goal.id}
						done={goal.completedByUser}
						openAddReview={openAddReview}
						hasMyComment={goal.hasMyComment}
						editGoal={goal.isCanEdit ? () => setIsEditing(true) : undefined}
						canEdit={goal.isCanEdit}
						location={goal?.location}
						onGoalCompleted={handleGoalCompleted}
						onHistoryRefresh={handleHistoryRefresh}
						onGoalUpdate={handleGoalUpdate}
						page={page}
						userFolders={goal.userFolders}
						regularConfig={goal.regularConfig}
						userProgress={goal.userProgress}
					/>
					<div className={element('content-wrapper')}>
						<ContentGoal page={page} goal={goal} className={element('content')} historyRefreshTrigger={historyRefreshTrigger} />
					</div>
				</section>
				{similarGoals.length > 0 && (
					<section className={element('similar-wrapper')}>
						<Title tag="h2" className={element('similar-title')}>
							Похожие цели
						</Title>
						<div className="catalog-items__goals">
							{similarGoals.map((similarGoal) => (
								<Card
									key={similarGoal.id}
									className="catalog-items__goal"
									goal={similarGoal}
									onClickAdd={async () => Promise.resolve()}
									onClickDelete={async () => Promise.resolve()}
									onClickMark={async () => Promise.resolve()}
								/>
							))}
						</div>
					</section>
				)}
				<ScrollToTop />
			</main>
		</>
	);
});
