import {observer} from 'mobx-react-lite';
import {FC, useCallback, useEffect, useRef, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';

import {addGoal} from '@/entities/goal/api/addGoal';
import {getGoal} from '@/entities/goal/api/getGoal';
import {markGoal} from '@/entities/goal/api/markGoal';
import {removeGoal} from '@/entities/goal/api/removeGoal';
import {refreshHeaderGoalCounts} from '@/entities/goal/lib/refreshHeaderGoalCounts';
import {useOGImage} from '@/entities/goal/lib/useOGImage';
import {GoalStore} from '@/entities/goal/model/GoalStore';
import {IGoal, IShortGoal} from '@/entities/goal/model/types';
import {Card} from '@/entities/goal/ui/Card/Card';
import {HeaderGoal} from '@/entities/goal/ui/HeaderGoal/HeaderGoal';
import {addRegularGoalToUser, RegularGoalSettings} from '@/entities/regular-goal/api/addRegularGoalToUser';
import {getRegularGoalSettings, RegularGoalSettingsResponse} from '@/entities/regular-goal/api/getRegularGoalSettings';
import {blockRegularGoalsAddIfLimitReached} from '@/entities/regular-goal/lib/checkRegularGoalsAddLimit';
import {HeaderRegularGoalsStore} from '@/entities/regular-goal/model/HeaderRegularGoalsStore';
import {requireEmailConfirmed} from '@/entities/user/lib/requireEmailConfirmed';
import {UserStore} from '@/entities/user/model/UserStore';
import {CatalogItemsSkeleton} from '@/features/catalog-items/CatalogItemsSkeleton';
import {EditGoal} from '@/features/edit-goal/EditGoal';
import {RegularGoalSettingsModal} from '@/features/regular-goal-settings/RegularGoalSettingsModal';
import {useBem} from '@/shared/lib/hooks/useBem';
import useScreenSize from '@/shared/lib/hooks/useScreenSize';
import {ModalStore} from '@/shared/model/ModalStore';
import {NotificationStore} from '@/shared/model/NotificationStore';
import {ThemeStore} from '@/shared/model/ThemeStore';
import {IPage} from '@/shared/types/page';
import {ScrollToTop} from '@/shared/ui/ScrollToTop/ScrollToTop';
import {SEO} from '@/shared/ui/SEO/SEO';
import {Title} from '@/shared/ui/Title/Title';
import {AsideGoal} from '@/widgets/aside-goal/AsideGoal';
import {ContentGoal} from '@/widgets/goal/ContentGoal';
import {GoalSkeleton} from '@/widgets/goal/GoalSkeleton';
import {useSimilarGoalsByCategory} from '@/widgets/goal/hooks/useSimilarGoalsByCategory';

import '@/widgets/goal/goal.scss';

const SIMILAR_LEAVE_HOLD_MS = 2000;
const SIMILAR_LEAVE_ANIM_MS = 350;

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
	const {isScreenMobile, isScreenSmallTablet, isScreenSmallMobile} = useScreenSize();
	const headerRef = useRef<HTMLElement | null>(null);
	const {isAuth} = UserStore;

	const {setId, setGoalListId} = GoalStore;
	const params = useParams();
	const navigate = useNavigate();
	const listId = params?.['id'];
	const [goal, setGoal] = useState<IGoal | null>(null);
	const [isEditing, setIsEditing] = useState(false);
	const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState(0); // Триггер для обновления истории
	const [showRegularModal, setShowRegularModal] = useState(false);
	const [regularGoalData, setRegularGoalData] = useState<RegularGoalSettingsResponse | null>(null);
	const [pendingSimilarGoalCode, setPendingSimilarGoalCode] = useState<string | null>(null);
	const [isRegularLoading, setIsRegularLoading] = useState(false);
	const [leavingSimilarCodes, setLeavingSimilarCodes] = useState<string[]>([]);
	const similarLeaveTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

	const {
		similarGoals,
		setSimilarGoals,
		isLoading: isSimilarLoading,
		reloadSimilarGoals,
		replaceSimilarGoalByCode,
	} = useSimilarGoalsByCategory(goal?.code || null, !!goal);

	const clearSimilarLeaveTimers = useCallback(() => {
		similarLeaveTimersRef.current.forEach((timer) => clearTimeout(timer));
		similarLeaveTimersRef.current.clear();
		setLeavingSimilarCodes([]);
	}, []);

	const reloadSimilarGoalsSafe = useCallback(async () => {
		clearSimilarLeaveTimers();
		await reloadSimilarGoals();
	}, [clearSimilarLeaveTimers, reloadSimilarGoals]);

	const scheduleSimilarGoalLeave = useCallback(
		(goalCode: string, holdMs = SIMILAR_LEAVE_HOLD_MS) => {
			const existing = similarLeaveTimersRef.current.get(goalCode);
			if (existing) {
				clearTimeout(existing);
			}

			const holdTimer = setTimeout(() => {
				setLeavingSimilarCodes((prev) => (prev.includes(goalCode) ? prev : [...prev, goalCode]));

				const animTimer = setTimeout(() => {
					replaceSimilarGoalByCode(goalCode)
						.then(() => {
							setLeavingSimilarCodes((prev) => prev.filter((code) => code !== goalCode));
							similarLeaveTimersRef.current.delete(goalCode);
						})
						.catch(() => undefined);
				}, SIMILAR_LEAVE_ANIM_MS);

				similarLeaveTimersRef.current.set(goalCode, animTimer);
			}, holdMs);

			similarLeaveTimersRef.current.set(goalCode, holdTimer);
		},
		[replaceSimilarGoalByCode]
	);

	useEffect(() => {
		return () => {
			similarLeaveTimersRef.current.forEach((timer) => clearTimeout(timer));
			similarLeaveTimersRef.current.clear();
		};
	}, []);

	const {setIsOpen, setWindow} = ModalStore;
	const {setHeader, setPageCategory} = ThemeStore;

	useEffect(() => {
		if (!goal?.category?.nameEn) {
			setPageCategory(null);
			return undefined;
		}
		setPageCategory(goal.category.nameEn);
		return () => setPageCategory(null);
	}, [goal?.category?.nameEn, setPageCategory]);

	useEffect(() => {
		if (!listId) return undefined;
		let cancelled = false;
		setGoal(null);
		(async () => {
			const res = await getGoal(listId);
			if (cancelled) return;
			if (res.success) {
				// Старый code объединённой (удалённой) цели: бэкенд вернул актуальную цель по алиасу — заменяем URL
				if (res.data.goal.code !== listId) {
					navigate(`/goals/${res.data.goal.code}`, {replace: true});
				}
				setGoal(normalizeGoalFromApi(res.data.goal));
				setId(res.data.goal.id);
				setGoalListId(null);
			}
		})();
		return () => {
			cancelled = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
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
		if (!requireEmailConfirmed()) {
			return;
		}
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

		const updatedGoal: Partial<IGoal> = {
			addedByUser: operation !== 'delete',
			completedByUser: operation === 'mark' ? !done : false,
			totalAdded: res.data.totalAdded,
			totalCompleted: res.data.totalCompleted,
			...(operation === 'delete' ? {userFolders: []} : {}),
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
				const merged = {...prev, ...fromApi} as IGoal;
				if (operation === 'delete') {
					merged.userFolders = [];
				}
				return merged;
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

		reloadSimilarGoalsSafe().catch(() => undefined);

		// Прогресс заданий обновляется автоматически на бэкенде
		return true;
	};

	const handleGoalUpdated = (updatedGoal: IGoal) => {
		setGoal({...goal, ...updatedGoal});
		setHeader('transparent');
		setIsEditing(false);
		reloadSimilarGoalsSafe().catch(() => undefined);
	};

	const handleGoalUpdate = async (updatedGoal?: IGoal | Partial<IGoal>) => {
		// Патч или полная цель с API
		if (updatedGoal !== undefined && Object.keys(updatedGoal).length > 0) {
			setGoal((prev) => (prev ? ({...prev, ...updatedGoal} as IGoal) : null));
			reloadSimilarGoalsSafe().catch(() => undefined);
			return;
		}
		if (goal && listId) {
			// Иначе перезагружаем цель из API
			const res = await getGoal(listId);
			if (res.success && res.data.goal) {
				setGoal(normalizeGoalFromApi(res.data.goal));
			}
		}
		reloadSimilarGoalsSafe().catch(() => undefined);
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
					setGoalListId(null);
				}
			} catch {
				// ignore reload errors
			}
		} else if (goal) {
			// Для обычных целей обновляем состояние как выполненной
			setGoal({
				...goal,
				completedByUser: true,
			});
		}
		reloadSimilarGoalsSafe().catch(() => undefined);
	};

	// Функция для обновления истории выполнения регулярной цели
	const handleHistoryRefresh = () => {
		setHistoryRefreshTrigger((prev) => prev + 1);
		reloadSimilarGoalsSafe().catch(() => undefined);
	};

	// Перезагрузка цели после изменения списка (цель могла быть добавлена/удалена у пользователя)
	const handleListChanged = async () => {
		if (listId) {
			const res = await getGoal(listId);
			if (res.success && res.data.goal) {
				const updatedGoal = res.data.goal;
				setGoal(updatedGoal);

				// Если цель удалена у пользователя — сбросить закешированный отзыв
				if (!updatedGoal.addedByUser && !updatedGoal.hasMyComment) {
					GoalStore.setMyComment(null);
				}
			}
		}
		reloadSimilarGoalsSafe().catch(() => undefined);
	};

	const [compact, setCompact] = useState(false);
	const [layoutHeaderOffset, setLayoutHeaderOffset] = useState(396);
	const headerHeightRef = useRef(396);
	const compactRef = useRef(false);
	const expandedHeaderHeightRef = useRef<number | null>(null);

	useEffect(() => {
		expandedHeaderHeightRef.current = null;
		headerHeightRef.current = 396;
		setLayoutHeaderOffset(396);
		setCompact(false);
		compactRef.current = false;
	}, [listId]);

	useEffect(() => {
		compactRef.current = compact;
		ThemeStore.setPreHeaderHiddenOverride(compact);
		// Сбрасываем инлайн-стили после того, как compact-класс применён к DOM
		if (compact && headerRef.current) {
			headerRef.current.style.clipPath = '';
			headerRef.current.style.transform = '';
		}
	}, [compact]);

	// Сбрасываем override при размонтировании
	useEffect(() => {
		ThemeStore.setPreHeaderHiddenOverride(false);
		return () => {
			ThemeStore.setPreHeaderHiddenOverride(null);
		};
	}, []);

	const blockRegularGoalAdd = () =>
		blockRegularGoalsAddIfLimitReached({
			onPremium: () => navigate('/user/self/subs'),
		});

	const updateSimilarGoalLocal = (goalCode: string, patch: Partial<IShortGoal>) => {
		setSimilarGoals((prev) => prev.map((item) => (item.code === goalCode ? {...item, ...patch} : item)));
	};

	/** Убрать из блока «похожие» цели, которые уже добавили в этой сессии (кроме текущей). */
	const flushOtherAddedSimilar = async (keepCode: string) => {
		const hasOthers = similarGoals.some(
			(item) => (item.addedByUser || item.completedByUser) && item.code !== keepCode && !leavingSimilarCodes.includes(item.code)
		);
		if (hasOthers) {
			await reloadSimilarGoalsSafe();
		}
	};

	const updateSimilarGoal = async (codeGoal: string, operation: 'add' | 'delete' | 'mark', done?: boolean): Promise<void> => {
		if (!isAuth) {
			setWindow('login');
			setIsOpen(true);
			return;
		}

		await flushOtherAddedSimilar(codeGoal);

		if (operation === 'add') {
			try {
				const regularSettings = await getRegularGoalSettings(codeGoal);
				if (regularSettings.success && regularSettings.data) {
					if (blockRegularGoalAdd()) {
						return;
					}

					if (regularSettings.data.regular_settings?.allowCustomSettings) {
						setRegularGoalData(regularSettings.data);
						setPendingSimilarGoalCode(codeGoal);
						setShowRegularModal(true);
						return;
					}

					const response = await addGoal(codeGoal);
					if (response.success) {
						updateSimilarGoalLocal(codeGoal, {
							addedByUser: true,
							...(typeof response.data?.totalAdded === 'number' ? {totalAdded: response.data.totalAdded} : {}),
						});
						HeaderRegularGoalsStore.loadTodayCount();
						NotificationStore.addNotification({
							type: 'success',
							title: 'Успех',
							message: 'Регулярная цель успешно добавлена!',
						});
					}
					return;
				}
			} catch {
				// Цель не регулярная — обычное добавление ниже
			}
		}

		const res = await (operation === 'add'
			? addGoal(codeGoal)
			: operation === 'delete'
			? removeGoal(codeGoal)
			: markGoal(codeGoal, !done));

		if (!res.success) {
			return;
		}

		if (operation === 'add') {
			updateSimilarGoalLocal(codeGoal, {
				addedByUser: true,
				completedByUser: false,
				totalAdded: res.data.totalAdded,
			});
		} else if (operation === 'mark' && !done) {
			updateSimilarGoalLocal(codeGoal, {
				addedByUser: true,
				completedByUser: true,
				totalAdded: res.data.totalAdded,
				totalCompleted: res.data.totalCompleted,
			});
			scheduleSimilarGoalLeave(codeGoal, SIMILAR_LEAVE_HOLD_MS);
		} else if (operation === 'delete') {
			scheduleSimilarGoalLeave(codeGoal, 0);
		} else {
			updateSimilarGoalLocal(codeGoal, {
				addedByUser: true,
				completedByUser: false,
				totalAdded: res.data.totalAdded,
			});
		}

		if (operation === 'add' || operation === 'delete') {
			HeaderRegularGoalsStore.loadTodayCount();
		}
	};

	const handleRegularModalClose = () => {
		setShowRegularModal(false);
		setRegularGoalData(null);
		setPendingSimilarGoalCode(null);
	};

	const handleRegularGoalSave = async (settings: RegularGoalSettings) => {
		if (!regularGoalData?.goal || !pendingSimilarGoalCode) {
			return;
		}

		const goalCode = pendingSimilarGoalCode;

		setIsRegularLoading(true);
		try {
			const requestData: RegularGoalSettings = {
				frequency: settings.frequency,
				durationType: settings.durationType,
				allowSkipDays: settings.allowSkipDays,
				resetOnSkip: settings.resetOnSkip,
				...(settings.frequency === 'weekly' && settings.weeklyFrequency !== undefined
					? {weeklyFrequency: settings.weeklyFrequency}
					: {}),
				...(settings.frequency === 'custom' && settings.customSchedule !== undefined
					? {customSchedule: settings.customSchedule}
					: {}),
				...(settings.durationType === 'days' || settings.durationType === 'weeks'
					? settings.durationValue !== undefined
						? {durationValue: settings.durationValue}
						: {}
					: {}),
				...(settings.durationType === 'until_date' && settings.endDate !== undefined ? {endDate: settings.endDate} : {}),
			};

			const response = await addRegularGoalToUser(goalCode, requestData);

			if (response.success) {
				updateSimilarGoalLocal(goalCode, {
					addedByUser: true,
					...(typeof response.data?.goal?.totalAdded === 'number' ? {totalAdded: response.data.goal.totalAdded} : {}),
				});
				refreshHeaderGoalCounts();
				NotificationStore.addNotification({
					type: 'success',
					title: 'Успех',
					message: 'Регулярная цель успешно добавлена с вашими настройками!',
				});
				handleRegularModalClose();
			} else {
				throw new Error(response.error || 'Ошибка при добавлении регулярной цели');
			}
		} catch (error) {
			NotificationStore.addNotification({
				type: 'error',
				title: 'Ошибка',
				message: error instanceof Error ? error.message : 'Не удалось добавить регулярную цель',
			});
		} finally {
			setIsRegularLoading(false);
		}
	};

	// Генерируем динамическое OG изображение
	const {imageUrl: ogImageUrl} = useOGImage({
		goal,
		width: 1200,
		height: 630,
	});

	const updateHeaderHeight = useCallback(() => {
		const el = headerRef.current;
		if (!el) return;

		// Временно сбрасываем clip-path/transform, чтобы измерить натуральную высоту
		const savedClip = el.style.clipPath;
		const savedTransform = el.style.transform;
		el.style.clipPath = '';
		el.style.transform = '';
		const h = el.offsetHeight;
		el.style.clipPath = savedClip;
		el.style.transform = savedTransform;

		headerHeightRef.current = h;

		if (!compactRef.current) {
			expandedHeaderHeightRef.current = h;
			setLayoutHeaderOffset(h);
		}

		window.dispatchEvent(new Event('scroll'));
	}, []);

	useEffect(() => {
		if (!goal) return;

		const el = headerRef.current;
		if (!el) return;

		updateHeaderHeight();

		const resizeObserver = new ResizeObserver(() => {
			updateHeaderHeight();
		});
		resizeObserver.observe(el);
		window.addEventListener('resize', updateHeaderHeight);

		return () => {
			resizeObserver.disconnect();
			window.removeEventListener('resize', updateHeaderHeight);
		};
	}, [goal?.code, compact, isScreenMobile, isScreenSmallTablet, updateHeaderHeight]);

	useEffect(() => {
		let rafId: number | null = null;
		let ticking = false;

		const onScroll = () => {
			if (ticking) return;
			ticking = true;

			rafId = window.requestAnimationFrame(() => {
				ticking = false;

				const scrollY = window.scrollY || 0;
				const currentCompact = compactRef.current;
				const expandedH = expandedHeaderHeightRef.current ?? headerHeightRef.current;
				const minHeight = isScreenSmallMobile ? 168 : 136;

				if (expandedH <= 0) return;

				if (isScreenSmallMobile) {
					// Мобильные (sm/xs): шапка прокручивается вместе с контентом через translateY
					const threshold = expandedH - minHeight;

					if (scrollY >= threshold && !currentCompact) {
						setCompact(true);
					} else if (scrollY < threshold && currentCompact) {
						setCompact(false);
					}

					// translateY только когда НЕ compact
					if (!currentCompact && scrollY < threshold) {
						if (headerRef.current) {
							headerRef.current.style.transform = `translateY(${-scrollY}px)`;
							headerRef.current.style.clipPath = '';
						}
					}
				} else {
					// Десктоп/планшет: clip-path
					const newHeight = Math.max(minHeight, expandedH - scrollY);

					if (newHeight <= minHeight && !currentCompact) {
						setCompact(true);
					} else if (newHeight > minHeight && currentCompact) {
						setCompact(false);
					}

					if (!currentCompact && !(newHeight <= minHeight)) {
						const clipBottom = expandedH - newHeight;
						if (headerRef.current) {
							headerRef.current.style.clipPath = clipBottom > 0 ? `inset(0 0 ${clipBottom}px 0)` : '';
						}
					}
				}

				// Плавное затемнение прозрачной шапки навигации при скролле (1 → 0.7 за 150px),
				// но только пока шапка цели не свернулась в compact — после этого затемнение убираем
				const isNowCompact =
					currentCompact || (isScreenSmallMobile ? scrollY >= expandedH - minHeight : expandedH - scrollY <= minHeight);
				const brightness = isNowCompact ? 1 : Math.max(0.6, 1 - (scrollY / 150) * 0.3);
				const blur = isNowCompact ? 0 : Math.min(5, (scrollY / 150) * 5);
				document.documentElement.style.setProperty('--header-backdrop-brightness', brightness.toFixed(3));
				document.documentElement.style.setProperty('--header-backdrop-blur', `${blur.toFixed(1)}px`);
			});
		};

		onScroll();

		window.addEventListener('scroll', onScroll, {passive: true});
		return () => {
			window.removeEventListener('scroll', onScroll);
			if (rafId != null) window.cancelAnimationFrame(rafId);
			// Очищаем инлайн-стили при смене экрана
			if (headerRef.current) {
				headerRef.current.style.transform = '';
				headerRef.current.style.clipPath = '';
			}
			document.documentElement.style.removeProperty('--header-backdrop-brightness');
			document.documentElement.style.removeProperty('--header-backdrop-blur');
		};
	}, [isScreenMobile, isScreenSmallMobile]);

	if (isEditing && goal) {
		return (
			<main className={block({editing: true})}>
				<EditGoal goal={goal} onGoalUpdated={handleGoalUpdated} cancelEdit={handleCancelEdit} />
			</main>
		);
	}

	if (!goal || goal.code !== listId) {
		return <GoalSkeleton />;
	}

	return (
		<>
			<SEO
				title={goal.title}
				description={goal.description || `Достигните цель "${goal.title}" на платформе Delting`}
				dynamicImage={ogImageUrl}
				type="article"
			/>
			<main
				className={block({category: goal.category.nameEn})}
				style={{'--height-header-goal': `${layoutHeaderOffset}px`} as React.CSSProperties}
			>
				<HeaderGoal
					ref={headerRef}
					title={goal.title}
					category={goal.category}
					image={goal.image}
					background={goal.image}
					goal={goal}
					compact={compact}
					onImageLoad={updateHeaderHeight}
				/>
				<section className={element('wrapper')}>
					<AsideGoal
						key={`aside-${goal.id}-${goal.regularConfig?.statistics?.updatedAt || ''}-${goal.regularConfig?.frequency || ''}-${
							goal.regularConfig?.durationValue || 0
						}-${goal.regularConfig?.allowSkipDays || 0}`}
						className={element('aside', {compact})}
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
						<ContentGoal
							page={page}
							goal={goal}
							className={element('content')}
							historyRefreshTrigger={historyRefreshTrigger}
							onListChanged={handleListChanged}
							onEditClick={() => setIsEditing(true)}
						/>
					</div>
				</section>
				{(isSimilarLoading || similarGoals.length > 0) && (
					<section className={element('similar-wrapper')}>
						<Title tag="h2" className={element('similar-title')}>
							Похожие цели
						</Title>
						{isSimilarLoading ? (
							<CatalogItemsSkeleton count={8} />
						) : (
							<div className="catalog-items__goals">
								{similarGoals.map((similarGoal) => (
									<Card
										key={similarGoal.id}
										className={[
											'catalog-items__goal',
											leavingSimilarCodes.includes(similarGoal.code) ? 'catalog-items__goal--leaving' : '',
										]
											.filter(Boolean)
											.join(' ')}
										goal={similarGoal}
										onClickAdd={() => updateSimilarGoal(similarGoal.code, 'add')}
										onClickDelete={() => updateSimilarGoal(similarGoal.code, 'delete')}
										onClickMark={() => updateSimilarGoal(similarGoal.code, 'mark', similarGoal.completedByUser)}
									/>
								))}
							</div>
						)}
					</section>
				)}
				{showRegularModal && regularGoalData?.regular_settings && (
					<RegularGoalSettingsModal
						isOpen={showRegularModal}
						onClose={handleRegularModalClose}
						goalData={regularGoalData.goal}
						originalSettings={regularGoalData.regular_settings}
						onSave={handleRegularGoalSave}
						isLoading={isRegularLoading}
					/>
				)}
				<ScrollToTop />
			</main>
		</>
	);
});
