import {type KeyboardEvent, FC, useEffect, useState} from 'react';

import {LightboxWithScrollLock} from '@/components/LightboxWithScrollLock/LightboxWithScrollLock';
import {WeekDaySchedule} from '@/components/WeekDaySelector/WeekDaySelector';
import {useBem} from '@/hooks/useBem';
import useScreenSize from '@/hooks/useScreenSize';
import {GoalStore} from '@/store/GoalStore';
import {HeaderProgressGoalsStore} from '@/store/HeaderProgressGoalsStore';
import {HeaderRegularGoalsStore} from '@/store/HeaderRegularGoalsStore';
import {ModalStore} from '@/store/ModalStore';
import {NotificationStore} from '@/store/NotificationStore';
import {UserStore} from '@/store/UserStore';
import {IGoal, ILocation, IRegularGoalConfig, IRegularGoalStatistics, IShortGoal} from '@/typings/goal';
import {getGoalTimer, TimerInfo} from '@/utils/api/get/getGoalTimer';
import {
	IGoalProgress,
	markRegularProgress,
	resetCompletedSeries,
	resetGoalProgress,
	resetRegularGoal,
	restartAfterCompletion,
	restartRegularGoal,
	updateGoalProgress,
} from '@/utils/api/goals';
import {addRegularGoalToUser} from '@/utils/api/post/addRegularGoalToUser';
import {updateRegularGoalSettings} from '@/utils/api/post/updateRegularGoalSettings';
import {GoalWithLocation} from '@/utils/mapApi';
import {refreshHeaderGoalCounts} from '@/utils/refreshHeaderGoalCounts';
import {
	addDays,
	endOfISOWeekFromMonday,
	startOfISOWeek,
	weeklyProratedHintForFirstDayOnCalendar,
} from '@/utils/regularGoal/weeklyProratedHint';
import {pluralize} from '@/utils/text/pluralize';

import {Button} from '../Button/Button';
import '../CommentImagesGallery/comment-images-gallery.scss';
import {GoalTimer} from '../GoalTimer/GoalTimer';
import {GRADIENT_DEFAULT_IMAGE} from '../Gradient/Gradient';
import {Line} from '../Line/Line';
import {Modal} from '../Modal/Modal';
import {ModalConfirm} from '../ModalConfirm/ModalConfirm';
import {Progress} from '../Progress/Progress';
import {RegularGoalSettings, SetRegularGoalModal} from '../SetRegularGoalModal/SetRegularGoalModal';
import {Svg} from '../Svg/Svg';

import './aside-goal.scss';

/** Черновик для модалки до первого сохранения на сервер (id === 0) */
function buildDraftGoalProgress(p: {goalId: number; title: string; code: string; image?: string | null}): IGoalProgress {
	return {
		id: 0,
		goal: p.goalId,
		goalTitle: p.title,
		goalCategory: '',
		goalCategoryNameEn: '',
		goalImage: p.image || '',
		goalCode: p.code,
		progressPercentage: 0,
		dailyNotes: '',
		isWorkingToday: false,
		lastUpdated: '',
		createdAt: '',
		recentEntries: [],
	};
}

/** Календарная дата YYYY-MM-DD в локальном часовом поясе (toISOString даёт UTC и ломает сопоставление с датами с бэкенда). */
function formatLocalDateYMD(d: Date): string {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
}

interface AsideProps {
	className?: string;
	title: string;
	image: string | null | undefined;
	added: boolean;
	code: string;
	done: boolean;
	goalId?: number;
	userFolders?: Array<{id: number; name: string; color: string; icon: string}>;
	regularConfig?: IRegularGoalConfig;
}

interface AsideGoalProps extends AsideProps {
	updateGoal: (code: string, operation: 'add' | 'delete' | 'mark' | 'partial' | 'start', done?: boolean) => Promise<void | boolean>;
	isList?: never;
	openAddReview: () => void;
	hasMyComment?: boolean;
	editGoal?: (() => void) | undefined;
	canEdit?: boolean;
	location?: ILocation;
	onGoalCompleted?: () => void; // Новый колбэк для уведомления о завершении цели
	onHistoryRefresh?: () => void; // Колбэк для обновления истории выполнения
	onGoalUpdate?: (updatedGoal?: IGoal | Partial<IGoal>) => void; // Колбэк для обновления цели
	/** Прогресс из ответа GET цели; если передан (включая null), отдельный запрос к /progress/ не делается */
	userProgress?: IGoalProgress | null;
	page?: string; // Текущая страница (для определения, находимся ли мы на странице истории)
	list?: never;
}

export interface AsideListsProps extends AsideProps {
	updateGoal: (code: string, operation: 'add' | 'delete' | 'mark-all') => Promise<void | boolean>;
	isList: true;
	openAddReview?: never;
	editGoal?: never;
	canEdit?: boolean;
	location?: GoalWithLocation[];
	list?: IShortGoal[];
	listCode?: string;
	onGoalCompleted?: never;
	onHistoryRefresh?: never;
	page?: never;
}

export const AsideGoal: FC<AsideGoalProps | AsideListsProps> = (props) => {
	const {
		className,
		title,
		image,
		added,
		updateGoal,
		code,
		done,
		isList,
		openAddReview,
		editGoal,
		canEdit,
		location,
		goalId,
		userFolders,
		regularConfig,
		list,
		onGoalCompleted,
		onHistoryRefresh,
		page,
	} = props;
	const listCode = isList ? (props as AsideListsProps).listCode : undefined;
	const onGoalUpdate = !isList ? (props as AsideGoalProps).onGoalUpdate : undefined;
	const goalUserProgress = !isList ? (props as AsideGoalProps).userProgress : undefined;
	const [timer, setTimer] = useState<TimerInfo | null>(null);
	const [progress, setProgress] = useState<IGoalProgress | null>(null);
	const [isCompleted, setIsCompleted] = useState(done);
	const [isRegularGoalCompletedToday, setIsRegularGoalCompletedToday] = useState(false);
	const [isAddingRegularGoal, setIsAddingRegularGoal] = useState(false);
	const [isAddingListGoal, setIsAddingListGoal] = useState(false);
	const [isAdded, setIsAdded] = useState(added);
	const [localStatistics, setLocalStatistics] = useState<IRegularGoalStatistics | null>(regularConfig?.statistics || null);

	const {myComment} = GoalStore;
	const hasMyComment = !isList && (props as AsideGoalProps).hasMyComment;
	const hasOwnComment = !!myComment || !!hasMyComment;

	// Синхронизируем localStatistics с regularConfig при его изменении
	useEffect(() => {
		if (regularConfig?.statistics) {
			setLocalStatistics(regularConfig.statistics);
		}
	}, [regularConfig?.statistics]);
	const [isCompleteSeriesModalOpen, setIsCompleteSeriesModalOpen] = useState(false);
	const [isResetCompletedSeriesModalOpen, setIsResetCompletedSeriesModalOpen] = useState(false);
	const [isEditSettingsModalOpen, setIsEditSettingsModalOpen] = useState(false);
	const [isConfirmResetSeriesModalOpen, setIsConfirmResetSeriesModalOpen] = useState(false);
	const [pendingSettings, setPendingSettings] = useState<RegularGoalSettings | null>(null);
	const [isAddRegularGoalModalOpen, setIsAddRegularGoalModalOpen] = useState(false);
	const [isDeleteProgressModalOpen, setIsDeleteProgressModalOpen] = useState(false);
	const [isUncompleteWithProgressModalOpen, setIsUncompleteWithProgressModalOpen] = useState(false);
	const [isGoalImageLightboxOpen, setIsGoalImageLightboxOpen] = useState(false);

	const [block, element] = useBem('aside-goal', className);

	// Синхронизируем локальное состояние с пропсом
	useEffect(() => {
		setIsCompleted(done);
	}, [done]);

	// Синхронизируем локальное состояние added с пропсом
	useEffect(() => {
		setIsAdded(added);
	}, [added]);

	// Синхронизируем localStatistics с regularConfig при его изменении
	useEffect(() => {
		if (regularConfig?.statistics) {
			setLocalStatistics(regularConfig.statistics);
		}
	}, [regularConfig?.statistics]);

	// Сбрасываем локальные состояния регулярной цели при удалении цели
	useEffect(() => {
		if (!added && regularConfig) {
			// Если цель удалена, сбрасываем все локальные состояния регулярной цели
			setLocalStatistics(null);
			setIsRegularGoalCompletedToday(false);
		}
	}, [added, regularConfig]);

	// Инициализируем состояние выполнения регулярной цели на основе статистики
	// Обновляется при изменении regularConfig (например, после перезагрузки цели)
	useEffect(() => {
		// Если цель не добавлена, не инициализируем статистику и сбрасываем локальные состояния
		if (!added || !regularConfig) {
			setLocalStatistics(null);
			setIsRegularGoalCompletedToday(false);
			return;
		}

		if (regularConfig.statistics) {
			// Создаем глубокую копию статистики, чтобы React увидел изменение
			const newStatistics = {...regularConfig.statistics};

			// Если currentPeriodProgress есть, тоже создаем новый объект с глубоким копированием
			if (newStatistics.currentPeriodProgress) {
				const currentPeriodProgress = {...newStatistics.currentPeriodProgress};
				// Если есть weekDays, создаем новый массив с новыми объектами
				if (currentPeriodProgress.weekDays && Array.isArray(currentPeriodProgress.weekDays)) {
					currentPeriodProgress.weekDays = currentPeriodProgress.weekDays.map((day: any) => ({...day}));
				}
				newStatistics.currentPeriodProgress = currentPeriodProgress;
			}

			// Если regularGoalData есть, тоже создаем новый объект для глубокого копирования
			if (newStatistics.regularGoalData) {
				newStatistics.regularGoalData = {...newStatistics.regularGoalData};
			}

			setLocalStatistics(newStatistics);

			// Для daily проверяем completedToday
			if (newStatistics.currentPeriodProgress?.type === 'daily') {
				setIsRegularGoalCompletedToday(newStatistics.currentPeriodProgress.completedToday || false);
			} else if (regularConfig.frequency === 'custom' || regularConfig.frequency === 'weekly') {
				// Для custom и weekly: если нельзя выполнить сегодня, значит уже выполнено
				setIsRegularGoalCompletedToday(!newStatistics.canCompleteToday);
			}
		} else {
			// Если статистики нет (цель добавлена, но еще не начата), сбрасываем локальное состояние
			setLocalStatistics(null);
			setIsRegularGoalCompletedToday(false);
		}
	}, [regularConfig, added]);

	const {setIsOpen, setWindow, setFuncModal, setModalProps} = ModalStore;
	const {isAuth} = UserStore;
	const {isScreenMobile, isScreenSmallTablet} = useScreenSize();

	const patchParentUserProgress = (next: IGoalProgress | null) => {
		if (!onGoalUpdate) return;
		onGoalUpdate({
			userProgress: next,
			progressEntriesCount: next?.progressEntriesCount ?? next?.recentEntries?.length ?? 0,
		});
	};

	// Загрузка информации о таймере
	useEffect(() => {
		const loadTimer = async () => {
			if (isAdded && !isList) {
				const response = await getGoalTimer(code);
				if (response.success && response.data?.timer) {
					// Данные таймера уже в нужном формате, используем напрямую
					setTimer(response.data.timer);
				} else {
					// Сбрасываем таймер, если его нет или произошла ошибка
					setTimer(null);
				}
			}
		};

		loadTimer();
	}, [code, isAdded, isList]);

	// Прогресс только из ответа GET цели (userProgress); отдельных запросов к /progress/ нет
	useEffect(() => {
		if (!isAdded || isList || !goalId) {
			// Иначе после «удалить → снова добавить» остаётся старый локальный progress
			setProgress(null);
			return;
		}
		setProgress(goalUserProgress ?? null);
	}, [isAdded, isList, goalId, goalUserProgress]);

	const handleTimerUpdate = (updatedTimer: TimerInfo | null) => {
		setTimer(updatedTimer);
	};

	const handleRandomPick = () => {
		ModalStore.setWindow('random-goal-picker');
		ModalStore.setModalProps({goals: list, listCode});
		ModalStore.setIsOpen(true);
	};

	// Обработчик сброса завершенной серии (открывает модалку)
	const handleResetCompletedSeries = () => {
		setIsResetCompletedSeriesModalOpen(true);
	};

	// Обновление настроек на сервере
	const handleUpdateSettings = async (settings: RegularGoalSettings) => {
		if (!regularConfig || !isAdded) return;

		try {
			// Убеждаемся, что allowSkipDays всегда число
			const settingsWithDefaults = {
				...settings,
				allowSkipDays: settings.allowSkipDays ?? 0,
				daysForEarnedSkip: settings.daysForEarnedSkip ?? 0,
			};
			const response = await updateRegularGoalSettings(code, settingsWithDefaults);

			if (response.success && response.data) {
				NotificationStore.addNotification({
					type: 'success',
					title: 'Успех',
					message: response.message || 'Настройки успешно обновлены',
				});

				// Закрываем модалку
				setIsEditSettingsModalOpen(false);

				// Обновляем локальную статистику, если она есть
				if (response.data.statistics) {
					// Обновляем локальную статистику с новыми настройками
					// API уже возвращает правильные настройки в statistics.regularGoalData
					// благодаря обновленному RegularGoalStatisticsSerializer
					setLocalStatistics(response.data.statistics);
				}

				// Обновляем цель, если есть колбэк
				// Всегда вызываем onGoalUpdate, даже если goal не передан, чтобы перезагрузить данные
				if (onGoalUpdate) {
					onGoalUpdate(response.data.goal);
				} else {
					console.warn('AsideGoal: onGoalUpdate is not provided, cannot update goal');
				}

				// Обновляем историю, если есть колбэк
				if (onHistoryRefresh) {
					onHistoryRefresh();
				}
			} else {
				throw new Error(response.error || 'Не удалось обновить настройки');
			}
		} catch (error) {
			NotificationStore.addNotification({
				type: 'error',
				title: 'Ошибка',
				message: error instanceof Error ? error.message : 'Не удалось обновить настройки',
			});
		}
	};

	// Получение информации о текущем прогрессе регулярной цели
	const getRegularProgress = () => {
		if (!regularConfig) return null;

		// Используем локальную статистику, если она есть, иначе из пропсов
		const statsCurrent = localStatistics || regularConfig.statistics;

		// Если есть статистика, используем её
		if (statsCurrent?.currentPeriodProgress) {
			const regularProgressData = statsCurrent.currentPeriodProgress;

			if (regularProgressData.type === 'daily') {
				// Используем данные из обновленной статистики, если есть локальная статистика
				// Иначе используем локальное состояние для немедленного обновления UI
				const completedToday = localStatistics
					? regularProgressData.completedToday || false
					: isRegularGoalCompletedToday || regularProgressData.completedToday || false;
				return {
					text: completedToday ? 'Выполнено сегодня' : 'Не выполнено сегодня',
					completed: completedToday,
					streak: statsCurrent.currentStreak || 0,
				};
			}

			if (regularProgressData.type === 'weekly') {
				return {
					text: `${regularProgressData.currentWeekCompletions || 0} из ${
						regularProgressData.requiredPerWeek || 1
					} на этой неделе`,
					progress: regularProgressData.weekProgress || 0,
				};
			}
		}

		// Если статистики нет, показываем базовую информацию
		if (regularConfig.frequency === 'daily') {
			// Используем данные из локальной статистики, если она есть
			const completedToday = localStatistics
				? localStatistics.currentPeriodProgress?.completedToday || false
				: isRegularGoalCompletedToday;
			return {
				text: completedToday ? 'Выполнено сегодня' : 'Не выполнено сегодня',
				completed: completedToday,
				streak: statsCurrent?.currentStreak || 0,
			};
		}

		if (regularConfig.frequency === 'weekly') {
			return {
				text: `${statsCurrent?.currentWeekCompletions || 0} из ${regularConfig.weeklyFrequency || 1} на этой неделе`,
				progress: 0,
			};
		}

		// Для custom частоты используем weekly логику, если есть статистика
		if (regularConfig.frequency === 'custom' && statsCurrent?.currentPeriodProgress) {
			const regularProgressData = statsCurrent.currentPeriodProgress;
			if (regularProgressData.type === 'weekly') {
				return {
					text: `${regularProgressData.currentWeekCompletions || 0} из ${
						regularProgressData.requiredPerWeek || 1
					} на этой неделе`,
					progress: regularProgressData.weekProgress || 0,
				};
			}
		}

		if (regularConfig.frequency === 'custom') {
			return {
				text: '0 на этой неделе',
				progress: 0,
			};
		}

		return null;
	};

	// Пересчитываем regularProgress при каждом рендере (функция легковесная)
	const regularProgress = getRegularProgress();

	// "Заблокировано сегодня"
	const isRegularGoalBlockedTodayBySchedule = (() => {
		if (!regularConfig || !isAdded) return false;
		if (regularConfig.frequency !== 'custom') return false;

		const stats = localStatistics || regularConfig.statistics;
		const weekDays = stats?.currentPeriodProgress?.weekDays;
		if (!Array.isArray(weekDays) || weekDays.length === 0) return false;

		// Индекс дня
		const todayIndex = (new Date().getDay() + 6) % 7;
		const todayData = weekDays.find((d: any) => d?.dayIndex === todayIndex);

		return todayData?.isAllowed === false;
	})();

	// Обработчик для отметки/отмены регулярной цели
	const handleMarkRegularGoal = async () => {
		if (!regularConfig || !isAdded) return;

		// Проверяем, завершена ли серия - если да, не позволяем отмечать/отменять выполнение
		const stats = localStatistics || regularConfig.statistics;
		if (stats?.isSeriesCompleted) {
			// Если серия завершена, открываем модалку сброса
			handleResetCompletedSeries();
			return;
		}

		// Определяем текущее состояние выполнения на основе актуальных данных
		// Приоритет: локальная статистика > локальное состояние > статистика из пропсов
		let currentlyCompleted = false;

		if (stats?.currentPeriodProgress?.type === 'daily') {
			currentlyCompleted = stats.currentPeriodProgress.completedToday || false;
		} else if (regularConfig.frequency === 'custom' || regularConfig.frequency === 'weekly') {
			currentlyCompleted = !stats?.canCompleteToday || false;
		} else {
			currentlyCompleted = isRegularGoalCompletedToday || regularProgress?.completed || false;
		}

		const newCompletedState = !currentlyCompleted;

		try {
			const response = await markRegularProgress({
				regular_goal_id: regularConfig.id,
				completed: newCompletedState,
				notes: '',
			});

			if (response.success && response.data) {
				// POST оборачивает ответ сервера: response = { success: true, data: <ответ сервера> }
				// Сервер возвращает: { success: true, data: { progress: ..., statistics: ... }, message: ... }
				// Итого: response.data.data.statistics
				const serverResponse = (response.data as any).data || response.data;
				const statisticsData = serverResponse.statistics;

				if (statisticsData) {
					// Создаем новый объект, чтобы React увидел изменение
					const newStatistics = {...statisticsData};

					// Если currentPeriodProgress есть, тоже создаем новый объект с глубоким копированием
					if (newStatistics.currentPeriodProgress) {
						const currentPeriodProgress = {...newStatistics.currentPeriodProgress};
						// Если есть weekDays, создаем новый массив с новыми объектами
						if (currentPeriodProgress.weekDays && Array.isArray(currentPeriodProgress.weekDays)) {
							currentPeriodProgress.weekDays = currentPeriodProgress.weekDays.map((day: any) => ({...day}));
						}
						newStatistics.currentPeriodProgress = currentPeriodProgress;
					}

					// Если regularGoalData есть, тоже создаем новый объект для глубокого копирования
					if (newStatistics.regularGoalData) {
						newStatistics.regularGoalData = {...newStatistics.regularGoalData};
					}

					// Сначала обновляем статистику
					setLocalStatistics(newStatistics);

					// Затем обновляем локальное состояние выполнения на основе обновленной статистики
					// Это гарантирует, что состояние синхронизировано с данными из API
					if (newStatistics.currentPeriodProgress?.type === 'daily') {
						const completedToday = newStatistics.currentPeriodProgress.completedToday || false;
						setIsRegularGoalCompletedToday(completedToday);
					} else if (regularConfig.frequency === 'custom' || regularConfig.frequency === 'weekly') {
						const canComplete = newStatistics.canCompleteToday || false;
						setIsRegularGoalCompletedToday(!canComplete);
					}
				} else {
					// Fallback: обновляем локальное состояние выполнения напрямую
					setIsRegularGoalCompletedToday(newCompletedState);
				}

				// Если серия действительно завершена, уведомляем родителя о завершении цели
				if (onGoalCompleted && statisticsData?.isSeriesCompleted) {
					onGoalCompleted();
				}

				// Если серия завершена и мы на странице истории, обновляем историю
				if (statisticsData?.isSeriesCompleted && page === 'isGoalHistory' && onHistoryRefresh) {
					onHistoryRefresh();
				}

				// Обновляем счётчик регулярных целей в шапке
				HeaderRegularGoalsStore.loadTodayCount();
			}
		} catch (error) {
			console.error('Ошибка отметки регулярной цели:', error);
			NotificationStore.addNotification({
				type: 'error',
				title: 'Ошибка',
				message: error instanceof Error ? error.message : 'Не удалось обновить выполнение цели',
			});
		}
	};

	// Обработчик завершения серии регулярной цели (открывает модалку)
	const handleCompleteSeries = () => {
		if (!regularConfig || !isAdded) return;
		setIsCompleteSeriesModalOpen(true);
	};

	// Обработчик сохранения настроек регулярной цели
	const handleSaveSettings = (settings: RegularGoalSettings) => {
		if (!regularConfig || !isAdded) return;

		const stats = localStatistics || regularConfig.statistics;
		const isSeriesAlreadyCompleted = stats?.isSeriesCompleted || false;

		// Проверяем, начата ли серия (есть start_date и current_streak > 0)
		// Но если серия уже завершена — подтверждение не нужно
		const seriesStarted = !isSeriesAlreadyCompleted && stats?.startDate && (stats.currentStreak || 0) > 0;

		if (seriesStarted) {
			// Сохраняем настройки и показываем подтверждение поверх модалки редактирования
			setPendingSettings(settings);
			setIsConfirmResetSeriesModalOpen(true);
		} else {
			// Если серия не начата или уже завершена, сохраняем сразу
			handleUpdateSettings(settings);
		}
	};

	// Подтверждение сброса серии при изменении настроек
	const handleConfirmResetSeries = async () => {
		if (!pendingSettings) return;

		setIsConfirmResetSeriesModalOpen(false);
		setIsEditSettingsModalOpen(false);
		await handleUpdateSettings(pendingSettings);
		setPendingSettings(null);
	};

	// Обработчик сохранения настроек при добавлении цели
	const handleSaveAddSettings = async (settings: RegularGoalSettings) => {
		if (!regularConfig) return;

		setIsAddingRegularGoal(true);
		try {
			// Убеждаемся, что allowSkipDays всегда число
			const settingsWithDefaults = {
				...settings,
				allowSkipDays: settings.allowSkipDays ?? 0,
				daysForEarnedSkip: settings.daysForEarnedSkip ?? 0,
			};
			const response = await addRegularGoalToUser(code, settingsWithDefaults);

			if (response.success) {
				// Обновляем локальное состояние, чтобы UI обновился сразу
				setIsAdded(true);
				setIsAddRegularGoalModalOpen(false);

				// Синтезируем локальную статистику, чтобы отображение параметров сразу обновилось
				const prevStats = localStatistics || regularConfig?.statistics;
				setLocalStatistics({
					...(prevStats || {}),
					regularGoalData: {
						...((prevStats?.regularGoalData as any) || {}),
						frequency: settingsWithDefaults.frequency,
						weeklyFrequency: settingsWithDefaults.weeklyFrequency,
						customSchedule: settingsWithDefaults.customSchedule,
						durationType: settingsWithDefaults.durationType,
						durationValue: settingsWithDefaults.durationValue,
						endDate: settingsWithDefaults.endDate,
						resetOnSkip: settingsWithDefaults.resetOnSkip,
						allowSkipDays: settingsWithDefaults.allowSkipDays,
						daysForEarnedSkip: settingsWithDefaults.daysForEarnedSkip,
					},
				} as any);

				// Обновляем счётчик регулярных целей в шапке
				HeaderRegularGoalsStore.loadTodayCount();

				// Перезагружаем цель, чтобы обновить regularConfig.statistics и показать вкладку "История выполнения"
				if (onGoalUpdate) {
					onGoalUpdate();
				}

				NotificationStore.addNotification({
					type: 'success',
					title: 'Успех',
					message: 'Регулярная цель успешно добавлена с вашими настройками!',
				});
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
			setIsAddingRegularGoal(false);
		}
	};

	// Подтверждение завершения серии
	const handleConfirmCompleteSeries = async (markAsCompleted?: boolean) => {
		if (!regularConfig || !isAdded) return;

		// ModalConfirm обновлен для ожидания async функций
		// Модалка закроется автоматически после успешного выполнения
		try {
			const response = await resetRegularGoal(regularConfig.id, markAsCompleted ?? false);

			if (response.success && response.data) {
				// POST оборачивает ответ сервера: response = { success: true, data: <ответ сервера> }
				// Сервер возвращает: { success: true, data: { statistics: ... }, message: ... }
				// Итого: response.data.data.statistics
				const serverResponse = (response.data as any).data || response.data;
				const statisticsData = serverResponse.statistics || serverResponse;

				if (statisticsData) {
					// Создаем новый объект, чтобы React увидел изменение
					const newStatistics = {...statisticsData};

					// Если currentPeriodProgress есть, тоже создаем новый объект с глубоким копированием
					if (newStatistics.currentPeriodProgress) {
						const currentPeriodProgress = {...newStatistics.currentPeriodProgress};
						// Если есть weekDays, создаем новый массив с новыми объектами
						if (currentPeriodProgress.weekDays && Array.isArray(currentPeriodProgress.weekDays)) {
							currentPeriodProgress.weekDays = currentPeriodProgress.weekDays.map((day: any) => ({...day}));
						}
						newStatistics.currentPeriodProgress = currentPeriodProgress;
					}

					// Если regularGoalData есть, тоже создаем новый объект для глубокого копирования
					if (newStatistics.regularGoalData) {
						newStatistics.regularGoalData = {...newStatistics.regularGoalData};
					}

					// Обновляем локальную статистику из ответа API
					setLocalStatistics(newStatistics);

					// Обновляем локальное состояние выполнения на основе обновленной статистики
					if (newStatistics.currentPeriodProgress?.type === 'daily') {
						const completedToday = newStatistics.currentPeriodProgress.completedToday || false;
						setIsRegularGoalCompletedToday(completedToday);
					} else if (regularConfig.frequency === 'custom' || regularConfig.frequency === 'weekly') {
						const canComplete = newStatistics.canCompleteToday || false;
						setIsRegularGoalCompletedToday(!canComplete);
					} else {
						setIsRegularGoalCompletedToday(false);
					}
				} else {
					// Fallback: сбрасываем локальное состояние выполнения
					setIsRegularGoalCompletedToday(false);
				}

				// Обновляем счётчик регулярных целей в шапке
				HeaderRegularGoalsStore.loadTodayCount();

				NotificationStore.addNotification({
					type: 'success',
					title: 'Успех',
					message: serverResponse.message || 'Серия прервана',
				});

				// Если есть колбэк для обновления родительского компонента, вызываем его
				if (onGoalCompleted) {
					onGoalCompleted();
				}

				// Если мы на странице истории, обновляем историю
				if (page === 'isGoalHistory' && onHistoryRefresh) {
					onHistoryRefresh();
				}
			} else {
				throw new Error(response.error || 'Ошибка при прерывании серии');
			}
		} catch (error) {
			// При ошибке пробрасываем исключение, чтобы ModalConfirm не закрыл модалку
			NotificationStore.addNotification({
				type: 'error',
				title: 'Ошибка',
				message: error instanceof Error ? error.message : 'Не удалось прервать серию',
			});
			throw error; // Пробрасываем ошибку, чтобы ModalConfirm не закрыл модалку
		}
	};

	// Подтверждение сброса завершенной серии (отмена выполнения)
	const handleConfirmResetCompletedSeries = async () => {
		if (!regularConfig || !isAdded) return;

		try {
			const response = await resetCompletedSeries(regularConfig.id);

			if (response.success && response.data) {
				// POST оборачивает ответ сервера: response = { success: true, data: <ответ сервера> }
				// Сервер возвращает: { success: true, data: { statistics: ... }, message: ... }
				// Итого: response.data.data.statistics
				const serverResponse = (response.data as any).data || response.data;
				const statisticsData = serverResponse.statistics || serverResponse;

				if (statisticsData) {
					// Создаем новый объект с глубоким копированием
					const newStatistics = {...statisticsData};

					if (newStatistics.currentPeriodProgress) {
						const currentPeriodProgress = {...newStatistics.currentPeriodProgress};
						if (currentPeriodProgress.weekDays && Array.isArray(currentPeriodProgress.weekDays)) {
							currentPeriodProgress.weekDays = currentPeriodProgress.weekDays.map((day: any) => ({...day}));
						}
						newStatistics.currentPeriodProgress = currentPeriodProgress;
					}

					if (newStatistics.regularGoalData) {
						newStatistics.regularGoalData = {...newStatistics.regularGoalData};
					}

					setLocalStatistics(newStatistics);

					// Обновляем локальное состояние выполнения
					if (newStatistics.currentPeriodProgress?.type === 'daily') {
						setIsRegularGoalCompletedToday(newStatistics.currentPeriodProgress.completedToday || false);
					} else {
						setIsRegularGoalCompletedToday(false);
					}
				} else {
					setIsRegularGoalCompletedToday(false);
				}

				NotificationStore.addNotification({
					type: 'success',
					title: 'Успех',
					message: serverResponse.message || 'Выполнение серии отменено',
				});

				if (onGoalCompleted) {
					onGoalCompleted();
				}

				// Если мы на странице истории, обновляем историю
				if (page === 'isGoalHistory' && onHistoryRefresh) {
					onHistoryRefresh();
				}
			} else {
				throw new Error(response.error || 'Ошибка при отмене выполнения серии');
			}
		} catch (error) {
			NotificationStore.addNotification({
				type: 'error',
				title: 'Ошибка',
				message: error instanceof Error ? error.message : 'Не удалось отменить выполнение серии',
			});
			throw error;
		}
	};

	// Обработчик начала новой серии после завершения - "Выполнить ещё раз"
	const handleRestartAfterCompletion = async () => {
		if (!regularConfig || !isAdded) return;

		if (regularConfig.allowCustomSettings) {
			setIsEditSettingsModalOpen(true);
			return;
		}

		try {
			const response = await restartAfterCompletion(regularConfig.id);

			if (response.success && response.data) {
				// POST оборачивает ответ сервера: response = { success: true, data: <ответ сервера> }
				// Сервер возвращает: { success: true, data: { statistics: ... }, message: ... }
				// Итого: response.data.data.statistics
				const serverResponse = (response.data as any).data || response.data;
				const statisticsData = serverResponse.statistics || serverResponse;

				if (statisticsData) {
					// Создаем новый объект с глубоким копированием
					const newStatistics = {...statisticsData};

					if (newStatistics.currentPeriodProgress) {
						const currentPeriodProgress = {...newStatistics.currentPeriodProgress};
						if (currentPeriodProgress.weekDays && Array.isArray(currentPeriodProgress.weekDays)) {
							currentPeriodProgress.weekDays = currentPeriodProgress.weekDays.map((day: any) => ({...day}));
						}
						newStatistics.currentPeriodProgress = currentPeriodProgress;
					}

					if (newStatistics.regularGoalData) {
						newStatistics.regularGoalData = {...newStatistics.regularGoalData};
					}

					setLocalStatistics(newStatistics);

					// Обновляем локальное состояние выполнения
					if (newStatistics.currentPeriodProgress?.type === 'daily') {
						setIsRegularGoalCompletedToday(newStatistics.currentPeriodProgress.completedToday || false);
					} else {
						setIsRegularGoalCompletedToday(false);
					}
				} else {
					setIsRegularGoalCompletedToday(false);
				}

				// Обновляем счётчик регулярных целей в шапке
				HeaderRegularGoalsStore.loadTodayCount();

				NotificationStore.addNotification({
					type: 'success',
					title: 'Успех',
					message: serverResponse.message || 'Начата новая серия',
				});

				if (onGoalCompleted) {
					onGoalCompleted();
				}

				// Если мы на странице истории, обновляем историю
				if (page === 'isGoalHistory' && onHistoryRefresh) {
					onHistoryRefresh();
				}
			} else {
				throw new Error(response.error || 'Ошибка при начале новой серии');
			}
		} catch (error) {
			NotificationStore.addNotification({
				type: 'error',
				title: 'Ошибка',
				message: error instanceof Error ? error.message : 'Не удалось начать новую серию',
			});
		}
	};

	// Обработчик перевода прерванной цели в выполненную (для бессрочных)
	const handleCompleteInterruptedSeries = async () => {
		if (!regularConfig || !isAdded) return;
		try {
			const response = await resetRegularGoal(regularConfig.id, true);
			if (response.success && response.data) {
				const serverResponse = (response.data as any).data || response.data;
				const statisticsData = serverResponse.statistics || serverResponse;
				if (statisticsData) {
					const newStatistics = {...statisticsData};
					if (newStatistics.currentPeriodProgress) {
						const currentPeriodProgress = {...newStatistics.currentPeriodProgress};
						if (currentPeriodProgress.weekDays && Array.isArray(currentPeriodProgress.weekDays)) {
							currentPeriodProgress.weekDays = currentPeriodProgress.weekDays.map((day: any) => ({...day}));
						}
						newStatistics.currentPeriodProgress = currentPeriodProgress;
					}
					if (newStatistics.regularGoalData) {
						newStatistics.regularGoalData = {...newStatistics.regularGoalData};
					}
					setLocalStatistics(newStatistics);
				}
				HeaderRegularGoalsStore.loadTodayCount();
				if (onGoalCompleted) onGoalCompleted();
				if (onHistoryRefresh) onHistoryRefresh();
				NotificationStore.addNotification({
					type: 'success',
					title: 'Успех',
					message: 'Серия отмечена выполненной',
				});
			} else {
				throw new Error(response.error || 'Не удалось отметить серию выполненной');
			}
		} catch (error) {
			NotificationStore.addNotification({
				type: 'error',
				title: 'Ошибка',
				message: error instanceof Error ? error.message : 'Не удалось отметить серию выполненной',
			});
		}
	};

	// Обработчик полного сброса - "Начать заново" (для прерванной серии)
	const handleRestartGoal = async () => {
		if (!regularConfig || !isAdded) return;

		try {
			const response = await restartRegularGoal(regularConfig.id);

			if (response.success && response.data) {
				// POST оборачивает ответ сервера: response = { success: true, data: <ответ сервера> }
				// Сервер возвращает: { success: true, data: { statistics: ... }, message: ... }
				// Итого: response.data.data.statistics
				const serverResponse = (response.data as any).data || response.data;
				const statisticsData = serverResponse.statistics || serverResponse;

				if (statisticsData) {
					// Создаем новый объект, чтобы React увидел изменение
					const newStatistics = {...statisticsData};

					// Если currentPeriodProgress есть, тоже создаем новый объект с глубоким копированием
					if (newStatistics.currentPeriodProgress) {
						const currentPeriodProgress = {...newStatistics.currentPeriodProgress};
						// Если есть weekDays, создаем новый массив с новыми объектами
						if (currentPeriodProgress.weekDays && Array.isArray(currentPeriodProgress.weekDays)) {
							currentPeriodProgress.weekDays = currentPeriodProgress.weekDays.map((day: any) => ({...day}));
						}
						newStatistics.currentPeriodProgress = currentPeriodProgress;
					}

					// Если regularGoalData есть, тоже создаем новый объект для глубокого копирования
					if (newStatistics.regularGoalData) {
						newStatistics.regularGoalData = {...newStatistics.regularGoalData};
					}

					// Обновляем локальную статистику из ответа API
					setLocalStatistics(newStatistics);

					// Обновляем локальное состояние выполнения на основе обновленной статистики
					if (newStatistics.currentPeriodProgress?.type === 'daily') {
						const completedToday = newStatistics.currentPeriodProgress.completedToday || false;
						setIsRegularGoalCompletedToday(completedToday);
					} else if (regularConfig.frequency === 'custom' || regularConfig.frequency === 'weekly') {
						const canComplete = newStatistics.canCompleteToday || false;
						setIsRegularGoalCompletedToday(!canComplete);
					} else {
						setIsRegularGoalCompletedToday(false);
					}
				} else {
					// Fallback: сбрасываем локальное состояние выполнения
					setIsRegularGoalCompletedToday(false);
				}

				// Обновляем счётчик регулярных целей в шапке
				HeaderRegularGoalsStore.loadTodayCount();

				NotificationStore.addNotification({
					type: 'success',
					title: 'Успех',
					message: serverResponse.message || 'Прогресс полностью сброшен. Можно начать заново.',
				});

				// Если есть колбэк для обновления родительского компонента, вызываем его
				if (onGoalCompleted) {
					onGoalCompleted();
				}

				// Если мы на странице истории, обновляем историю
				if (page === 'isGoalHistory' && onHistoryRefresh) {
					onHistoryRefresh();
				}
			} else {
				throw new Error(response.error || 'Ошибка при сбросе прогресса');
			}
		} catch (error) {
			NotificationStore.addNotification({
				type: 'error',
				title: 'Ошибка',
				message: error instanceof Error ? error.message : 'Не удалось сбросить прогресс',
			});
		}
	};

	const openProgressModal = (progressOverride?: IGoalProgress) => {
		const current = progressOverride ?? progress;
		if (!isList && goalId && current) {
			setWindow('progress-update');
			setIsOpen(true);
			setModalProps({
				goalId,
				goalTitle: title,
				currentProgress: current,
				onProgressUpdate: (updatedProgress: IGoalProgress) => {
					setProgress(updatedProgress);
					patchParentUserProgress(updatedProgress);
					// Если прогресс достиг 100%, отмечаем как выполненную
					if (updatedProgress.progressPercentage >= 100) {
						setIsCompleted(true);
					}
					if (page === 'isGoalProgressHistory' && onHistoryRefresh) {
						onHistoryRefresh();
					}
					// Обновляем счётчик прогресса в шапке (counts в профиле + стор)
					refreshHeaderGoalCounts();
				},
				onGoalCompleted: () => {
					setIsCompleted(true);
					if (onGoalCompleted) {
						onGoalCompleted();
					}
					// Обновляем счётчик прогресса в шапке (counts в профиле + стор)
					refreshHeaderGoalCounts();
				},
			});
		}
	};

	const handleOpenProgressModalOrStart = () => {
		if (isList || !goalId || !isAdded || regularConfig) return;
		if (!progress) {
			openProgressModal(buildDraftGoalProgress({goalId, title, code, image}));
		} else {
			openProgressModal();
		}
	};

	const openMarkAll = () => {
		setWindow('confirm-execution-all-goal');
		setIsOpen(true);
		if (isList) {
			setFuncModal(() => updateGoal(code, 'mark-all'));
		}
	};

	const deleteGoal = () => {
		// Очищаем modalProps перед открытием модалки удаления, чтобы не было лишних заголовков
		setModalProps({});
		setWindow('delete-goal');
		setIsOpen(true);
		setFuncModal(() => updateGoal(code, 'delete'));
	};

	const deleteList = () => {
		setWindow('delete-list');
		setIsOpen(true);
		setFuncModal(() => updateGoal(code, 'delete'));
	};

	const openMapModal = () => {
		if (!isList) {
			setWindow('goal-map');
			setIsOpen(true);
			setModalProps({
				location,
				userVisitedLocation: isCompleted,
			});
		} else {
			setWindow('goal-map-multi');
			setIsOpen(true);
			setModalProps({
				goals: location,
			});
		}
	};

	const openFolderSelector = () => {
		if (!isList && isAdded && goalId) {
			setWindow('folder-selector');
			setIsOpen(true);
			setModalProps({
				goalId,
				goalTitle: title,
				goalFolders: userFolders || [],
				onFolderSelected: (folder: {id: number; name: string; color: string; icon: string}) => {
					if (!onGoalUpdate) return;
					const current = userFolders || [];
					if (current.some((f) => f.id === folder.id)) return;
					onGoalUpdate({userFolders: [...current, folder]});
				},
			});
		}
	};

	const handleShare = async () => {
		// Прогресс заданий обновляется автоматически на бэкенде

		window.open(`https://telegram.me/share/url?url=${window.location.href}`, 'sharer', 'status=0,toolbar=0,width=650,height=500');
	};

	const handleAddListGoal = async () => {
		if (!isList || isAdded) return;
		setIsAddingListGoal(true);
		try {
			await updateGoal(code, 'add');
		} finally {
			setIsAddingListGoal(false);
		}
	};

	// Обработчик добавления цели с проверкой на регулярность
	const handleAddGoal = async () => {
		if (isList || isAdded) return;

		if (!isAuth) {
			setWindow('login');
			setIsOpen(true);
			return;
		}

		if (regularConfig) {
			// Если настройки нельзя изменить, используем обычный endpoint /add/ с базовыми настройками
			if (!regularConfig.allowCustomSettings) {
				setIsAddingRegularGoal(true);
				try {
					// Используем обычный endpoint для добавления цели с базовыми настройками
					await updateGoal(code, 'add');
					setIsAdded(true);

					// Обновляем счётчик регулярных целей в шапке
					HeaderRegularGoalsStore.loadTodayCount();

					NotificationStore.addNotification({
						type: 'success',
						title: 'Успех',
						message: 'Регулярная цель успешно добавлена!',
					});
				} catch (error) {
					NotificationStore.addNotification({
						type: 'error',
						title: 'Ошибка',
						message: error instanceof Error ? error.message : 'Не удалось добавить регулярную цель',
					});
				} finally {
					setIsAddingRegularGoal(false);
				}
				return;
			}

			// Если настройки можно изменить, показываем модалку
			setIsAddRegularGoalModalOpen(true);
			return;
		}
		await updateGoal(code, 'add');
	};

	const handleProgressBarClick = () => {
		openProgressModal();
	};

	const handleProgressBarKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			openProgressModal();
		}
	};

	const handleMarkToday = async () => {
		if (!goalId || !progress) return;
		const newWorkingToday = !progress.isWorkingToday;
		try {
			const response = await updateGoalProgress(goalId, {
				progress_percentage: progress.progressPercentage,
				daily_notes: progress.dailyNotes || '',
				is_working_today: newWorkingToday,
			});
			if (response.success && response.data) {
				setProgress(response.data);
				patchParentUserProgress(response.data);
				// Обновляем счётчик прогресса в шапке
				HeaderProgressGoalsStore.loadGoalsInProgress();
			}
		} catch (error) {
			console.error('Ошибка отметки сегодня:', error);
			NotificationStore.addNotification({
				type: 'error',
				title: 'Ошибка',
				message: error instanceof Error ? error.message : 'Не удалось обновить отметку',
			});
		}
	};

	const handleMarkGoal = async (isCurrentlyCompleted: boolean) => {
		// Если цель снимается с выполнения и есть прогресс, сбрасываем его
		if (isCurrentlyCompleted && progress && goalId) {
			try {
				await resetGoalProgress(goalId);
				setProgress(null);
				patchParentUserProgress(null);
				onHistoryRefresh?.();
			} catch (error) {
				console.error('Ошибка сброса прогресса:', error);
				NotificationStore.addNotification({
					type: 'error',
					title: 'Ошибка',
					message: error instanceof Error ? error.message : 'Не удалось сбросить прогресс',
				});
				return;
			}
		}

		// Если цель отмечается как выполненная и есть прогресс < 100%, подтягиваем прогресс до 100%
		if (!isCurrentlyCompleted && progress && goalId && progress.progressPercentage < 100) {
			try {
				const response = await updateGoalProgress(goalId, {
					progress_percentage: 100,
					daily_notes: progress.dailyNotes || '',
					is_working_today: progress.isWorkingToday ?? false,
				});
				if (response.success && response.data) {
					setProgress(response.data);
					patchParentUserProgress(response.data);
					onHistoryRefresh?.();
				}
			} catch (error) {
				console.error('Ошибка обновления прогресса до 100%:', error);
			}
		}

		setIsCompleted(!isCurrentlyCompleted);

		if (!isList) {
			await (updateGoal as any)(code, 'mark', isCurrentlyCompleted);
		}

		// Обновляем счётчик прогресса в шапке (прогресс мог быть сброшен или цель завершена)
		refreshHeaderGoalCounts();
	};

	/** Отмена выполнения: при активном прогрессе — сначала подтверждение (прогресс будет удалён) */
	const handleMarkGoalClick = () => {
		if (!isList && isCompleted && progress && goalId) {
			setIsUncompleteWithProgressModalOpen(true);
			return;
		}
		handleMarkGoal(isCompleted).catch(() => {});
	};

	// Функция для форматирования дней недели
	const formatDaysOfWeek = (customSchedule: WeekDaySchedule): string => {
		const dayNames: Record<keyof WeekDaySchedule, string> = {
			monday: 'Пн',
			tuesday: 'Вт',
			wednesday: 'Ср',
			thursday: 'Чт',
			friday: 'Пт',
			saturday: 'Сб',
			sunday: 'Вс',
		};

		const dayOrder: Array<keyof WeekDaySchedule> = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
		const selectedDays: string[] = [];

		dayOrder.forEach((day) => {
			if (customSchedule[day] === true) {
				selectedDays.push(dayNames[day]);
			}
		});

		return selectedDays.join(', ') || '';
	};

	// Функция для форматирования длительности
	const getDurationDisplay = () => {
		if (!regularConfig) return '';

		const stats = localStatistics || regularConfig.statistics;
		const source = isAdded && stats?.regularGoalData ? stats.regularGoalData : regularConfig;
		const durationType = source.durationType || regularConfig.durationType;
		const durationValue = source.durationValue ?? regularConfig.durationValue;
		const endDate = source.endDate ?? regularConfig.endDate;

		switch (durationType) {
			case 'days':
				return `${pluralize(durationValue || 0, ['день', 'дня', 'дней'])}`;
			case 'weeks':
				return `${pluralize(durationValue || 0, ['неделя', 'недели', 'недель'])}`;
			case 'until_date':
				if (endDate) {
					const date = new Date(endDate);
					return date.toLocaleDateString('ru-RU', {day: '2-digit', month: '2-digit', year: 'numeric'});
				}
				return 'До даты';
			case 'indefinite':
				return 'Бессрочно';
			default:
				return '';
		}
	};

	// Функция для форматирования периодичности для отображения в карточке
	const getFrequencyDisplay = () => {
		if (!regularConfig) return '';

		// Получаем актуальную частоту и customSchedule (могут быть в статистике для пользовательских настроек)
		let {frequency} = regularConfig;
		let {customSchedule} = regularConfig;
		let {weeklyFrequency} = regularConfig;

		// Используем локальную статистику, если она есть, иначе из пропсов
		const stats = localStatistics || regularConfig.statistics;

		// Если цель добавлена и есть статистика, используем данные из статистики (пользовательские настройки)
		if (isAdded && stats?.regularGoalData) {
			frequency = stats.regularGoalData.frequency || frequency;
			customSchedule = stats.regularGoalData.customSchedule || customSchedule;
			weeklyFrequency = stats.regularGoalData.weeklyFrequency || weeklyFrequency;
		}

		if (frequency === 'daily') {
			return 'Ежедневно';
		}

		if (frequency === 'weekly') {
			// Если есть customSchedule, показываем дни недели
			if (customSchedule && Object.keys(customSchedule).length > 0) {
				return formatDaysOfWeek(customSchedule);
			}
			return pluralize(weeklyFrequency || 0, ['раз в неделю', 'раза в неделю', 'раз в неделю']);
		}

		if (frequency === 'custom' && customSchedule) {
			return formatDaysOfWeek(customSchedule);
		}

		return '';
	};

	// Получение текущего дня недели (0 - воскресенье, 1 - понедельник, ..., 6 - суббота)
	const getCurrentDayOfWeek = (): number => {
		const today = new Date();
		const day = today.getDay();
		// Преобразуем в формат: 0 - понедельник, 1 - вторник, ..., 6 - воскресенье
		return day === 0 ? 6 : day - 1;
	};

	// Получение названия дня недели по индексу
	const getDayName = (index: number): string => {
		const names = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
		return names[index];
	};

	// Хелперы для блока прогресса (цели с прогрессом, не регулярные)
	const getLocalMonday = (d: Date): Date => {
		const t = new Date(d);
		t.setHours(0, 0, 0, 0);
		const day = t.getDay();
		const diffFromMonday = day === 0 ? 6 : day - 1;
		t.setDate(t.getDate() - diffFromMonday);
		return t;
	};

	/** Недели по календарю (Пн–Вс): первая неделя = 1, с каждым новым понедельником +1 от недели старта */
	const getProgressWeeksCount = (p: IGoalProgress): number => {
		if (typeof p.calendarWeeksCount === 'number') {
			return p.calendarWeeksCount;
		}
		const msPerWeek = 7 * 24 * 60 * 60 * 1000;
		const startMonday = getLocalMonday(new Date(p.createdAt));
		const todayMonday = getLocalMonday(new Date());
		const deltaWeeks = Math.floor((todayMonday.getTime() - startMonday.getTime()) / msPerWeek);
		if (deltaWeeks < 0) {
			return 1;
		}
		return Math.max(1, deltaWeeks + 1);
	};

	const getProgressMaxStreak = (p: IGoalProgress): number => {
		if (typeof p.maxConsecutiveWorkDays === 'number') {
			return p.maxConsecutiveWorkDays;
		}
		const entries = (p.recentEntries || []).filter((e) => e.workDone);
		if (entries.length === 0) return 0;
		const dates = [...new Set(entries.map((e) => e.date.split('T')[0]))].sort();
		let maxStreak = 1;
		let currentStreak = 1;
		for (let i = 1; i < dates.length; i++) {
			const prev = new Date(dates[i - 1]);
			const curr = new Date(dates[i]);
			const diffDays = Math.round((curr.getTime() - prev.getTime()) / (24 * 60 * 60 * 1000));
			if (diffDays === 1) {
				currentStreak += 1;
				maxStreak = Math.max(maxStreak, currentStreak);
			} else {
				currentStreak = 1;
			}
		}
		return maxStreak;
	};

	const getProgressWeekDaysCompleted = (p: IGoalProgress): boolean[] => {
		if (p.weekWorkDone && p.weekWorkDone.length === 7) {
			return p.weekWorkDone;
		}
		const today = new Date();
		const dayOfWeek = today.getDay();
		const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
		const monday = new Date(today);
		monday.setDate(today.getDate() - diff);
		monday.setHours(0, 0, 0, 0);
		const hasWorkedOnDate = (dateStr: string): boolean =>
			(p.recentEntries || []).some((e) => {
				const entryDay = e.date.split('T')[0];
				return entryDay === dateStr && (e.workDone ?? false);
			});
		return Array.from({length: 7}, (_, i) => {
			const d = new Date(monday);
			d.setDate(monday.getDate() + i);
			const dateStr = formatLocalDateYMD(d);
			return hasWorkedOnDate(dateStr);
		});
	};

	/** Количество дней с отметкой «работал» (по workDone в записях) */
	const getProgressMarkedDaysCount = (p: IGoalProgress): number => {
		if (typeof p.workedDaysCount === 'number') {
			return p.workedDaysCount;
		}
		const byDate = new Map<string, boolean>();
		(p.recentEntries || []).forEach((e) => {
			const key = e.date.split('T')[0];
			if (!key) return;
			const wd = e.workDone ?? false;
			byDate.set(key, (byDate.get(key) ?? false) || wd);
		});
		return [...byDate.values()].filter(Boolean).length;
	};

	// Получение информации о серии (дни или недели)
	const getSeriesInfo = () => {
		// Используем локальную статистику, если она есть, иначе из пропсов
		const stats = localStatistics || regularConfig?.statistics;

		// Единица измерения определяется по frequency: daily → дни, weekly/custom → недели
		const frequency = stats?.regularGoalData?.frequency || regularConfig?.frequency;
		const isWeeklyUnit = frequency !== 'daily';

		if (!stats || !regularConfig) {
			const unit = isWeeklyUnit ? pluralize(0, ['неделя', 'недели', 'недель']) : pluralize(0, ['день', 'дня', 'дней']);
			return {value: 0, unit, isInterrupted: false, isCompleted: false, maxStreak: 0, maxStreakUnit: unit};
		}

		const seriesIsCompleted = stats.isSeriesCompleted || false;
		const isInterrupted = stats.isInterrupted || false;

		let streak = stats.currentStreak || 0;
		if (isInterrupted && stats.interruptedStreak !== null && stats.interruptedStreak !== undefined) {
			streak = stats.interruptedStreak;
		} else if (seriesIsCompleted) {
			// Для завершённой серии
			if (isWeeklyUnit) {
				// weekly/custom → недели. Считаем календарные недели от старта серии до её завершения,
				// чтобы короткие серии показывали минимум 1 неделю, а серия, завершившаяся на 2-й неделе — 2.
				const startStr = stats.startDate;
				const endStr = stats.seriesCompletionDate;
				if (startStr && endStr) {
					const startMonday = getLocalMonday(new Date(startStr));
					const endMonday = getLocalMonday(new Date(endStr));
					const msPerWeek = 7 * 24 * 60 * 60 * 1000;
					const deltaWeeks = Math.floor((endMonday.getTime() - startMonday.getTime()) / msPerWeek);
					streak = Math.max(1, deltaWeeks + 1);
				} else {
					streak = Math.max(1, stats.completedWeeks || stats.currentStreak || 0);
				}
			} else {
				// daily → дни
				streak = stats.totalCompletions > 0 ? stats.totalCompletions : stats.currentStreak || 0;
			}
		} else {
			// Активная серия
			const completions = stats.totalCompletions ?? 0;
			if (completions === 0) {
				streak = 0;
			} else if (isWeeklyUnit) {
				// weekly/custom → недели
				streak = stats.completedWeeks > 0 ? stats.completedWeeks : stats.currentStreak || 0;
			} else {
				// daily → дни
				streak = stats.currentStreak || 0;
			}
		}

		const maxStreakValue = stats.maxStreak || 0;

		// Единица измерения: weekly/custom → недели, daily → дни
		if (isWeeklyUnit) {
			return {
				value: streak,
				unit: pluralize(streak, ['неделя', 'недели', 'недель']),
				isInterrupted,
				isCompleted: seriesIsCompleted,
				maxStreak: maxStreakValue,
				maxStreakUnit: pluralize(maxStreakValue, ['неделя', 'недели', 'недель']),
			};
		}
		return {
			value: streak,
			unit: pluralize(streak, ['день', 'дня', 'дней']),
			isInterrupted,
			isCompleted: seriesIsCompleted,
			maxStreak: maxStreakValue,
			maxStreakUnit: pluralize(maxStreakValue, ['день', 'дня', 'дней']),
		};
	};

	// Получение процента прогресса (возвращает null для бессрочных целей)
	const getProgressPercentage = (): number | null => {
		if (!regularConfig || !regularProgress) return null;

		// Для бессрочных целей прогресс не рассчитывается
		const stats = localStatistics || regularConfig.statistics;
		const durationType = stats?.regularGoalData?.durationType || regularConfig.durationType;

		// Если серия прервана, используем interrupted_completion_percentage
		if (stats?.isInterrupted && stats.interruptedCompletionPercentage !== null && stats.interruptedCompletionPercentage !== undefined) {
			return stats.interruptedCompletionPercentage;
		}

		if (durationType === 'indefinite') {
			return null;
		}

		// Используем completion_percentage из статистики, если он есть
		if (stats?.completionPercentage !== undefined && stats.completionPercentage !== null) {
			return stats.completionPercentage;
		}

		// Fallback на старую логику для совместимости
		if (regularConfig.frequency === 'daily') {
			return regularProgress.completed ? 100 : 0;
		}

		if (regularConfig.frequency === 'weekly' && regularProgress.progress !== undefined) {
			return regularProgress.progress;
		}

		// Для custom можно использовать процент завершенных дней недели
		if (regularConfig.frequency === 'custom') {
			// Если есть статистика по неделе, используем её
			if (regularProgress?.progress !== undefined) {
				return regularProgress.progress;
			}
			return null;
		}

		return null;
	};

	// Проверка, является ли день выбранным (для custom)
	const isDaySelected = (dayIndex: number): boolean => {
		if (!regularConfig) return false;

		// Получаем актуальную частоту и customSchedule (могут быть в статистике для пользовательских настроек)
		let {frequency} = regularConfig;
		let {customSchedule} = regularConfig;

		// Используем локальную статистику, если она есть, иначе из пропсов
		const stats = localStatistics || regularConfig.statistics;

		// Если цель добавлена и есть статистика, используем данные из статистики (пользовательские настройки)
		if (isAdded && stats?.regularGoalData) {
			frequency = stats.regularGoalData.frequency || frequency;
			customSchedule = stats.regularGoalData.customSchedule || customSchedule;
		}

		if (frequency !== 'custom' || !customSchedule) {
			return false;
		}

		const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
		const dayKey = dayKeys[dayIndex];
		return customSchedule[dayKey] === true;
	};

	// Пересчитываем seriesInfo при каждом рендере (функция легковесная)
	const seriesInfo = getSeriesInfo();
	const regularStatsForActions = localStatistics || regularConfig?.statistics;
	const hasRegularSeriesStarted =
		(regularStatsForActions?.totalCompletions ?? 0) > 0 || Boolean(regularStatsForActions?.lastCompletionDate);
	const currentDayIndex = getCurrentDayOfWeek();
	const progressPercentage = getProgressPercentage();
	const isProgressGoalComplete = progress != null && progress.progressPercentage >= 100;
	const daysForEarnedSkip =
		(localStatistics?.regularGoalData as any)?.daysForEarnedSkip ??
		(regularConfig?.statistics?.regularGoalData as any)?.daysForEarnedSkip ??
		(regularConfig as any)?.daysForEarnedSkip ??
		0;
	const consecutiveCompletionsForSkip =
		localStatistics?.consecutiveCompletionsForSkip ?? regularConfig?.statistics?.consecutiveCompletionsForSkip ?? 0;
	const daysUntilEarnedSkipFromBackend = localStatistics?.daysUntilEarnedSkip ?? regularConfig?.statistics?.daysUntilEarnedSkip;
	const daysUntilEarnedSkip =
		daysUntilEarnedSkipFromBackend !== undefined
			? daysUntilEarnedSkipFromBackend
			: daysForEarnedSkip > 0
			? (() => {
					const completedInCycle = consecutiveCompletionsForSkip % daysForEarnedSkip;
					return completedInCycle === 0 ? daysForEarnedSkip : daysForEarnedSkip - completedInCycle;
			  })()
			: null;

	const getWeeklyTargetCount = (): number => {
		if (!regularConfig || regularConfig.frequency !== 'weekly') return 0;
		let wf = regularConfig.weeklyFrequency ?? 0;
		const stats = localStatistics || regularConfig.statistics;
		if (isAdded && stats?.regularGoalData?.weeklyFrequency != null) {
			wf = stats.regularGoalData.weeklyFrequency;
		}
		return wf || 0;
	};

	/** Пропорция N×(T/7): пока серия не начата — подсказка «если начать сегодня» */
	const weeklyProratedStartHint = (() => {
		if (!regularConfig || regularConfig.frequency !== 'weekly') return null;
		const detailsWhenNotAdded = !isAdded && !regularConfig.allowCustomSettings;
		const detailsWhenAddedNotStarted = isAdded && !hasRegularSeriesStarted;
		if (!detailsWhenNotAdded && !detailsWhenAddedNotStarted) return null;
		const N = getWeeklyTargetCount();
		if (N <= 0) return null;
		const today = new Date();
		const {tDays, minCompletions} = weeklyProratedHintForFirstDayOnCalendar(N, today, today);
		if (minCompletions >= N) return null;
		return {tDays, minCompletions, N};
	})();

	const imageSrc = image != null && String(image).trim() !== '' ? String(image).trim() : GRADIENT_DEFAULT_IMAGE;
	const canOpenGoalImageLightbox = imageSrc !== GRADIENT_DEFAULT_IMAGE;

	return (
		<aside className={block({isList})}>
			{/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-to-interactive-role */}
			<img
				src={imageSrc}
				alt={title}
				className={element('image', {clickable: canOpenGoalImageLightbox})}
				{...(canOpenGoalImageLightbox
					? {
							role: 'button' as const,
							tabIndex: 0,
							onClick: () => setIsGoalImageLightboxOpen(true),
							onKeyDown: (e: KeyboardEvent<HTMLImageElement>) => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault();
									setIsGoalImageLightboxOpen(true);
								}
							},
					  }
					: {})}
			/>
			{canOpenGoalImageLightbox && (
				<LightboxWithScrollLock
					open={isGoalImageLightboxOpen}
					close={() => setIsGoalImageLightboxOpen(false)}
					slides={[{src: imageSrc}]}
					index={0}
					className="comment-images-gallery__lightbox"
					carousel={{finite: true, padding: '16px'}}
					controller={{closeOnBackdropClick: true}}
					animation={{fade: 300}}
					render={{buttonPrev: () => null, buttonNext: () => null}}
				/>
			)}
			{/* Блок с информацией о регулярной цели - показывается только если цель не добавлена */}
			{regularConfig && !isList && !isAdded && (
				<div className={element('regular-info-header')}>
					<div className={element('regular-info-title')}>
						<Svg icon="regular" className={element('regular-info-icon')} />
						<span>Регулярная цель</span>
					</div>
					<Line className={element('line')} />
					{/* Строка "Выполнено раз: X" - показывается если серия была выполнена хотя бы раз (даже если цель удалена) */}
					{regularConfig.completedSeriesCount !== undefined && regularConfig.completedSeriesCount > 0 && (
						<>
							<div className={element('regular-info-row')}>
								<span className={element('regular-info-label')}>Выполнено раз:</span>
								<span className={element('regular-info-value')}>{regularConfig.completedSeriesCount}</span>
							</div>
							<Line className={element('line')} margin={isScreenMobile ? '8px 0' : undefined} />
						</>
					)}
					{regularConfig.allowCustomSettings ? (
						<div className={element('regular-info-text')}>
							<span>Параметры настраиваются при добавлении цели</span>
						</div>
					) : (
						<div className={element('regular-info-details')}>
							<div className={element('regular-info-row')}>
								<span className={element('regular-info-label')}>Периодичность:</span>
								<span className={element('regular-info-value')}>{getFrequencyDisplay()}</span>
							</div>
							<div className={element('regular-info-row')}>
								<span className={element('regular-info-label')}>Длительность:</span>
								<span className={element('regular-info-value')}>{getDurationDisplay()}</span>
							</div>
							{regularConfig.resetOnSkip && (
								<div className={element('regular-info-row')}>
									<span className={element('regular-info-label')}>Сброс прогресса:</span>
									<span className={element('regular-info-value')}>Да</span>
								</div>
							)}
							{(() => {
								const skipDays =
									localStatistics?.remainingSkipDays !== undefined
										? localStatistics.remainingSkipDays
										: regularConfig.statistics?.remainingSkipDays !== undefined
										? regularConfig.statistics.remainingSkipDays
										: regularConfig.allowSkipDays || 0;
								return skipDays > 0 ? (
									<div className={element('regular-info-row')}>
										<span className={element('regular-info-label')}>Разрешенные пропуски:</span>
										<span className={element('regular-info-value')}>{skipDays}</span>
									</div>
								) : null;
							})()}
							{weeklyProratedStartHint && (
								<div className={element('regular-info-hint')} role="note">
									Если начнёте сегодня, достаточно выполнить {weeklyProratedStartHint.minCompletions} из{' '}
									{pluralize(weeklyProratedStartHint.N, ['дня', 'дней', 'дней'])} по недельному плану.
								</div>
							)}
							{daysUntilEarnedSkip !== null && (
								<div className={element('regular-info-row')}>
									<span className={element('regular-info-label')}>До начисления пропуска:</span>
									<span className={element('regular-info-value')}>
										{regularConfig.frequency === 'daily'
											? pluralize(daysUntilEarnedSkip, ['день', 'дня', 'дней'])
											: pluralize(daysUntilEarnedSkip, ['неделя', 'недели', 'недель'])}
									</span>
								</div>
							)}
							{/* Показываем использованные пропуски, если они есть */}
							{localStatistics?.usedSkipDays !== undefined && localStatistics.usedSkipDays > 0 && (
								<div className={element('regular-info-row')}>
									<span className={element('regular-info-label')}>Использовано пропусков:</span>
									<span className={element('regular-info-value')}>{localStatistics.usedSkipDays}</span>
								</div>
							)}
							{!localStatistics?.usedSkipDays &&
								regularConfig.statistics?.usedSkipDays !== undefined &&
								regularConfig.statistics.usedSkipDays > 0 && (
									<div className={element('regular-info-row')}>
										<span className={element('regular-info-label')}>Использовано пропусков:</span>
										<span className={element('regular-info-value')}>{regularConfig.statistics.usedSkipDays}</span>
									</div>
								)}
						</div>
					)}
				</div>
			)}

			{/* Блок сведений о текущей серии - показывается если цель добавлена */}
			{regularConfig && isAdded && !isList && (
				<div className={element('regular-info-header')}>
					{(() => {
						const stats = localStatistics || regularConfig.statistics;
						const frequency = stats?.regularGoalData?.frequency || regularConfig.frequency;
						const currentWeekCompletions = stats?.currentWeekCompletions ?? 0;
						const startDate = stats?.startDate;

						let isCurrentPeriodCompleted = false;
						if (frequency === 'daily') {
							isCurrentPeriodCompleted = isRegularGoalCompletedToday;
						} else if (frequency === 'weekly') {
							const weeklyN = stats?.regularGoalData?.weeklyFrequency ?? regularConfig.weeklyFrequency ?? 0;
							if (weeklyN > 0) {
								const startForHint = startDate ? new Date(startDate) : new Date();
								const {minCompletions} = weeklyProratedHintForFirstDayOnCalendar(weeklyN, startForHint, new Date());
								isCurrentPeriodCompleted = currentWeekCompletions >= minCompletions;
							}
						} else if (frequency === 'custom') {
							const schedule = stats?.regularGoalData?.customSchedule || regularConfig.customSchedule;
							if (schedule) {
								const today = new Date();
								today.setHours(0, 0, 0, 0);
								const monday = startOfISOWeek(today);
								const sunday = endOfISOWeekFromMonday(monday);
								const start = startDate ? new Date(startDate) : monday;
								start.setHours(0, 0, 0, 0);
								const effStart = start.getTime() > monday.getTime() ? start : monday;
								const dayKeys: Array<keyof WeekDaySchedule> = [
									'monday',
									'tuesday',
									'wednesday',
									'thursday',
									'friday',
									'saturday',
									'sunday',
								];
								let requiredCount = 0;
								for (let i = 0; i < 7; i++) {
									const d = addDays(monday, i);
									if (d.getTime() >= effStart.getTime() && d.getTime() <= sunday.getTime() && schedule[dayKeys[i]]) {
										requiredCount++;
									}
								}
								isCurrentPeriodCompleted = requiredCount > 0 && currentWeekCompletions >= requiredCount;
							}
						}

						const isActiveState =
							seriesInfo.isCompleted || seriesInfo.isInterrupted || (seriesInfo.value > 0 && isCurrentPeriodCompleted);
						return (
							<div className={element('regular-info-title')}>
								{seriesInfo.isCompleted ? (
									<Svg icon="regular-checked" className={element('regular-info-icon')} />
								) : seriesInfo.isInterrupted ? (
									<Svg icon="regular-cancel" className={element('regular-info-icon')} />
								) : seriesInfo.value > 0 && isCurrentPeriodCompleted ? (
									<Svg icon="regular" className={element('regular-info-icon')} />
								) : (
									<Svg icon="regular-empty" className={element('regular-info-icon')} />
								)}
								<span>
									{seriesInfo.isCompleted
										? 'Серия выполнена'
										: seriesInfo.isInterrupted
										? 'Серия прервана'
										: 'Текущая серия'}
								</span>
								<span className={element('regular-info-streak', {active: isActiveState})}>{seriesInfo.unit}</span>
							</div>
						);
					})()}

					{/* Календарь дней недели - показываем только если серия не прервана и не завершена */}
					{!seriesInfo.isInterrupted && !seriesInfo.isCompleted && (
						<div className={element('regular-series-days')}>
							{Array.from({length: 7}, (_, i) => {
								const dayName = getDayName(i);
								let isSelected = false;
								let isBlocked = false;
								let isBlockedByStartDate = false; // Блокировка из-за даты начала (показываем пустым, без крестика)
								let isCompletedDay = false; // Зелёный фон (включая дни, закрашенные нормой недели)
								let isCompletedActual = false; // Реально выполненный день — для галочки
								let isSkipped = false; // Использован разрешенный пропуск
								const isCurrentDay = i === currentDayIndex;

								if (regularConfig.frequency === 'daily') {
									// Для daily используем данные из weekDays, если они есть
									const stats = localStatistics || regularConfig.statistics;
									const weekDays = stats?.currentPeriodProgress?.weekDays;

									if (weekDays && weekDays.length > 0) {
										const dayData = weekDays.find(
											(d: {
												dayIndex: number;
												isCompleted?: boolean;
												isCompletedDay?: boolean;
												isBlocked?: boolean;
												isBlockedByStartDate?: boolean;
												isSkipped?: boolean;
												isAllowed?: boolean;
											}) => d.dayIndex === i
										);
										if (dayData) {
											isSelected = dayData.isAllowed !== false;
											isBlocked = false;
											isBlockedByStartDate = dayData.isBlockedByStartDate || false;
											isCompletedDay = !isBlockedByStartDate && (dayData.isCompleted || false);
											isCompletedActual =
												!isBlockedByStartDate && (dayData.isCompletedDay ?? dayData.isCompleted ?? false);
											isSkipped = !isBlockedByStartDate && (dayData.isSkipped || false);
										}
									} else {
										// Fallback: если weekDays нет, используем старую логику (только текущий день)
										isSelected = i === currentDayIndex;
										if (isSelected) {
											if (localStatistics?.currentPeriodProgress?.type === 'daily') {
												isCompletedDay = localStatistics.currentPeriodProgress.completedToday || false;
											} else {
												const dailyFallbackStats = localStatistics || regularConfig.statistics;
												if (dailyFallbackStats?.currentPeriodProgress?.type === 'daily') {
													isCompletedDay = dailyFallbackStats.currentPeriodProgress.completedToday || false;
												} else {
													isCompletedDay = isRegularGoalCompletedToday || regularProgress?.completed || false;
												}
											}
											isCompletedActual = isCompletedDay;
										}
									}
								} else if (regularConfig.frequency === 'weekly') {
									// Для weekly используем данные из weekDays
									const stats = localStatistics || regularConfig.statistics;
									const weekDays = stats?.currentPeriodProgress?.weekDays;
									if (weekDays && weekDays.length > 0) {
										const dayData = weekDays.find(
											(d: {
												dayIndex: number;
												isCompleted?: boolean;
												isCompletedDay?: boolean;
												isBlocked?: boolean;
												isBlockedByStartDate?: boolean;
												isSkipped?: boolean;
												isAllowed?: boolean;
											}) => d.dayIndex === i
										);
										if (dayData) {
											isSelected = dayData.isAllowed !== false;
											isBlockedByStartDate = dayData.isBlockedByStartDate || false;
											isBlocked = false;
											// isCompleted у бэка для weekly = "зелёный фон" (все дни, если неделя выполнена)
											isCompletedDay = !isBlockedByStartDate && (dayData.isCompleted || false);
											// isCompletedDay у бэка для weekly = "реально выполнен" (для галочки)
											isCompletedActual = !isBlockedByStartDate && (dayData.isCompletedDay ?? false);
											isSkipped = !isBlockedByStartDate && (dayData.isSkipped || false);
										}
									}
									// Если weekDays нет или пуст, используем fallback логику
									if (!weekDays || weekDays.length === 0) {
										const weeklyFallbackStats = localStatistics || regularConfig.statistics;
										const startDate = weeklyFallbackStats?.startDate
											? new Date(`${weeklyFallbackStats.startDate}T00:00:00`)
											: null;
										const today = new Date();
										today.setHours(0, 0, 0, 0);

										const dayOfWeek = today.getDay();
										const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
										const weekStart = new Date(today);
										weekStart.setDate(today.getDate() - diff);
										weekStart.setHours(0, 0, 0, 0);

										const dayDate = new Date(weekStart);
										dayDate.setDate(weekStart.getDate() + i);
										dayDate.setHours(0, 0, 0, 0);

										if (startDate) {
											startDate.setHours(0, 0, 0, 0);
											isSelected = dayDate >= startDate;
											isBlockedByStartDate = dayDate < startDate;
											isBlocked = false;
										} else {
											isSelected = true;
											isBlockedByStartDate = false;
											isBlocked = false;
										}

										isCompletedDay = false;
										isCompletedActual = false;
										isSkipped = false;
									}
								} else if (regularConfig.frequency === 'custom') {
									const stats = localStatistics || regularConfig.statistics;
									const weekDays = stats?.currentPeriodProgress?.weekDays;
									if (weekDays && weekDays.length > 0) {
										const dayData = weekDays.find(
											(d: {
												dayIndex: number;
												isCompleted?: boolean;
												isCompletedDay?: boolean;
												isBlocked?: boolean;
												isBlockedByStartDate?: boolean;
												isSkipped?: boolean;
												isAllowed?: boolean;
											}) => d.dayIndex === i
										);
										if (dayData) {
											isBlockedByStartDate = dayData.isBlockedByStartDate || false;
											const inCustomSchedule = isDaySelected(i);
											isBlocked = !inCustomSchedule || !!dayData.isBlocked;
											isSelected = dayData.isAllowed !== false;
											isCompletedDay = !isBlockedByStartDate && (dayData.isCompleted || false);
											isCompletedActual =
												!isBlockedByStartDate && (dayData.isCompletedDay ?? dayData.isCompleted ?? false);
											isSkipped = !isBlockedByStartDate && (dayData.isSkipped || false);
										}
									} else {
										const daySelected = isDaySelected(i);
										isSelected = daySelected;
										isBlocked = !daySelected;
										isBlockedByStartDate = false;
										isCompletedDay = false;
										isCompletedActual = false;
										isSkipped = false;
									}
								}

								// Синяя рамка и выделение всегда на текущем дне (isCurrentDay),
								// Не показываем рамку только для блокировки по дате начала (isBlockedByStartDate).
								const showBorder = isCurrentDay && !isBlockedByStartDate;
								// custom: крестик для любого дня вне графика, даже до start_date; в графике до старта — без крестика
								const blockedScheduleCross =
									regularConfig.frequency === 'custom' ? isBlocked : isBlocked && !isBlockedByStartDate;

								const showCompleted = isCompletedDay && !isSkipped && !blockedScheduleCross && !isBlockedByStartDate;

								return (
									<div key={i} className={element('regular-series-day-wrapper')}>
										<div
											className={element('regular-series-day', {
												selected: showBorder,
												blocked: blockedScheduleCross,
												completed: showCompleted,
												skipped: isSkipped && !blockedScheduleCross && !isBlockedByStartDate,
											})}
										>
											{blockedScheduleCross && <Svg icon="cross" className={element('regular-series-day-icon')} />}
											{!blockedScheduleCross && !isBlockedByStartDate && (isCompletedActual || isSkipped) && (
												<Svg icon="done" className={element('regular-series-day-icon-selected')} />
											)}
										</div>
										<span
											className={element('regular-series-day-name', {
												selected: isCurrentDay && !isBlockedByStartDate,
											})}
										>
											{dayName}
										</span>
									</div>
								);
							})}
						</div>
					)}
					<Line className={element('line')} margin={isScreenMobile ? '8px 0' : undefined} />

					{(() => {
						const stats = localStatistics || regularConfig.statistics;
						const source = isAdded && stats?.regularGoalData ? stats.regularGoalData : regularConfig;
						const durationType = source.durationType || regularConfig.durationType;
						const resetOnSkip = source.resetOnSkip ?? regularConfig.resetOnSkip;
						const showMaxStreak =
							durationType === 'indefinite' &&
							!resetOnSkip &&
							seriesInfo.maxStreak > 0 &&
							!seriesInfo.isCompleted &&
							(seriesInfo.isInterrupted || seriesInfo.maxStreak > seriesInfo.value);
						const showCompletedCount =
							regularConfig.completedSeriesCount !== undefined && regularConfig.completedSeriesCount > 0;
						const hasBelow = showMaxStreak || showCompletedCount;
						const isCompletedWithFinite = seriesInfo.isCompleted && durationType !== 'indefinite';
						const displayProgress = isCompletedWithFinite ? 100 : progressPercentage;
						const showProgress =
							durationType !== 'indefinite' && displayProgress !== null && (isCompletedWithFinite || !seriesInfo.isCompleted);
						return (
							<>
								{/* Прогресс - показывается только для целей с определенной длительностью */}
								{showProgress && (
									<div className={element('regular-series-progress', {tight: hasBelow})}>
										<span className={element('regular-series-progress-label')}>Прогресс:</span>
										<div className={element('regular-series-progress-bar')}>
											<Progress done={displayProgress as number} all={100} goal />
										</div>
									</div>
								)}
								<div
									className={element('regular-info-details', {
										tight: showProgress,
									})}
								>
									{showCompletedCount && (
										<div className={element('regular-info-row')}>
											<span className={element('regular-info-label')}>Выполнено раз:</span>
											<span className={element('regular-info-value')}>{regularConfig.completedSeriesCount}</span>
										</div>
									)}
									{showMaxStreak && (
										<div className={element('regular-info-row')}>
											<span className={element('regular-info-label')}>Макс. серия без пропусков:</span>
											<span className={element('regular-info-value')}>{seriesInfo.maxStreakUnit}</span>
										</div>
									)}
								</div>
							</>
						);
					})()}
					{(seriesInfo.isCompleted ||
						seriesInfo.isInterrupted ||
						(regularConfig.completedSeriesCount !== undefined && regularConfig.completedSeriesCount > 0)) && (
						<Line className={element('line')} margin={isScreenMobile ? '8px 0' : undefined} />
					)}
					{/* Детали */}
					<div className={element('regular-info-details')}>
						<div className={element('regular-info-row')}>
							<span className={element('regular-info-label')}>Периодичность:</span>
							<span className={element('regular-info-value')}>{getFrequencyDisplay()}</span>
						</div>
						<div className={element('regular-info-row')}>
							<span className={element('regular-info-label')}>Длительность:</span>
							<span className={element('regular-info-value')}>{getDurationDisplay()}</span>
						</div>
						{regularConfig.resetOnSkip && (
							<div className={element('regular-info-row')}>
								<span className={element('regular-info-label')}>Сброс прогресса:</span>
								<span className={element('regular-info-value')}>Да</span>
							</div>
						)}
						{(() => {
							const skipDays =
								localStatistics?.remainingSkipDays !== undefined
									? localStatistics.remainingSkipDays
									: regularConfig.statistics?.remainingSkipDays !== undefined
									? regularConfig.statistics.remainingSkipDays
									: regularConfig.allowSkipDays || 0;
							return skipDays > 0 ? (
								<div className={element('regular-info-row')}>
									<span className={element('regular-info-label')}>Разрешенные пропуски:</span>
									<span className={element('regular-info-value')}>{skipDays}</span>
								</div>
							) : null;
						})()}
						{weeklyProratedStartHint && (
							<div className={element('regular-info-hint')} role="note">
								Если начнёте сегодня, достаточно выполнить {weeklyProratedStartHint.minCompletions} из{' '}
								{pluralize(weeklyProratedStartHint.N, ['дня', 'дней', 'дней'])} по недельному плану.
							</div>
						)}
						{daysUntilEarnedSkip !== null && (
							<div className={element('regular-info-row')}>
								<span className={element('regular-info-label')}>До начисления пропуска:</span>
								<span className={element('regular-info-value')}>
									{regularConfig.frequency === 'daily'
										? pluralize(daysUntilEarnedSkip, ['день', 'дня', 'дней'])
										: pluralize(daysUntilEarnedSkip, ['неделя', 'недели', 'недель'])}
								</span>
							</div>
						)}
						{/* Показываем использованные пропуски, если они есть */}
						{(localStatistics?.usedSkipDays !== undefined && localStatistics.usedSkipDays > 0) ||
						(regularConfig.statistics?.usedSkipDays !== undefined && regularConfig.statistics.usedSkipDays > 0) ? (
							<div className={element('regular-info-row')}>
								<span className={element('regular-info-label')}>Использовано пропусков:</span>
								<span className={element('regular-info-value')}>
									{localStatistics?.usedSkipDays ?? regularConfig.statistics?.usedSkipDays ?? 0}
								</span>
							</div>
						) : null}
					</div>
					<Line className={element('line')} margin={isScreenMobile ? '8px 0' : undefined} />
					{/* Блок кнопок для регулярной цели */}
					{regularConfig && isAdded && !isList && (
						<div className={element('regular-series-actions')}>
							{seriesInfo.isCompleted ? (
								// Если серия завершена, показываем кнопку "Выполнено", "Впечатление" и "Выполнить ещё раз"
								<>
									<Button
										theme="green"
										onClick={handleResetCompletedSeries}
										icon="done"
										className={element('btn')}
										size={isScreenMobile || isScreenSmallTablet ? 'medium' : undefined}
										hoverContent="Отменить выполнение"
										hoverIcon="cross"
									>
										Выполнено
									</Button>
									{!hasOwnComment && (
										<Button
											theme="blue-light"
											onClick={openAddReview}
											icon="comment"
											className={element('btn')}
											size={isScreenMobile || isScreenSmallTablet ? 'medium' : undefined}
										>
											Добавить впечатление
										</Button>
									)}
									<Button
										theme="blue-light"
										onClick={handleRestartAfterCompletion}
										icon="regular-empty"
										className={element('btn')}
										size={isScreenMobile || isScreenSmallTablet ? 'medium' : undefined}
									>
										Выполнить ещё раз
									</Button>
								</>
							) : seriesInfo.isInterrupted ? (
								// Если серия прервана
								<>
									{(() => {
										const stats = localStatistics || regularConfig.statistics;
										const durationType = stats?.regularGoalData?.durationType || regularConfig.durationType;
										return durationType === 'indefinite' ? (
											<Button
												theme="blue"
												onClick={handleCompleteInterruptedSeries}
												icon="done"
												className={element('btn')}
												size={isScreenMobile || isScreenSmallTablet ? 'medium' : undefined}
											>
												Выполнить
											</Button>
										) : null;
									})()}
									<Button
										theme="blue-light"
										onClick={handleRestartGoal}
										icon="regular-empty"
										className={element('btn')}
										size={isScreenMobile || isScreenSmallTablet ? 'medium' : undefined}
									>
										Начать заново
									</Button>
								</>
							) : (
								// Если серия не завершена и не прервана, показываем обычную кнопку выполнения
								(regularConfig.frequency === 'daily' ||
									regularConfig.frequency === 'weekly' ||
									regularConfig.frequency === 'custom') && (
									<Button
										theme={
											isRegularGoalBlockedTodayBySchedule
												? 'no-active'
												: (regularConfig.frequency === 'daily' &&
														(isRegularGoalCompletedToday || regularProgress?.completed)) ||
												  ((regularConfig.frequency === 'weekly' || regularConfig.frequency === 'custom') &&
														isRegularGoalCompletedToday)
												? 'green'
												: 'blue'
										}
										onClick={handleMarkRegularGoal}
										icon={
											isRegularGoalBlockedTodayBySchedule
												? undefined
												: (regularConfig.frequency === 'daily' &&
														(isRegularGoalCompletedToday || regularProgress?.completed)) ||
												  ((regularConfig.frequency === 'weekly' || regularConfig.frequency === 'custom') &&
														isRegularGoalCompletedToday)
												? 'regular-checked'
												: 'regular-empty'
										}
										className={element('btn')}
										size={isScreenMobile || isScreenSmallTablet ? 'medium' : undefined}
										disabled={isRegularGoalBlockedTodayBySchedule}
										hoverContent={
											isRegularGoalBlockedTodayBySchedule
												? undefined
												: (regularConfig.frequency === 'daily' &&
														(isRegularGoalCompletedToday || regularProgress?.completed)) ||
												  ((regularConfig.frequency === 'weekly' || regularConfig.frequency === 'custom') &&
														isRegularGoalCompletedToday)
												? 'Отменить выполнение'
												: undefined
										}
										hoverIcon={
											isRegularGoalBlockedTodayBySchedule
												? undefined
												: (regularConfig.frequency === 'daily' &&
														(isRegularGoalCompletedToday || regularProgress?.completed)) ||
												  ((regularConfig.frequency === 'weekly' || regularConfig.frequency === 'custom') &&
														isRegularGoalCompletedToday)
												? 'cross'
												: undefined
										}
									>
										{isRegularGoalBlockedTodayBySchedule
											? 'Сегодня нельзя выполнить'
											: regularConfig.frequency === 'daily' &&
											  (isRegularGoalCompletedToday || regularProgress?.completed)
											? 'Выполнено сегодня'
											: regularConfig.frequency === 'daily'
											? 'Выполнить сегодня'
											: (regularConfig.frequency === 'weekly' || regularConfig.frequency === 'custom') &&
											  isRegularGoalCompletedToday
											? 'Выполнено сегодня'
											: 'Выполнить сегодня'}
									</Button>
								)
							)}
							{/* Кнопка "изменить параметры" - показывается только если разрешено редактирование и серия не выполнена */}
							{regularConfig && isAdded && !isList && regularConfig.allowCustomSettings && !seriesInfo.isCompleted && (
								<Button
									theme="blue-light"
									onClick={() => setIsEditSettingsModalOpen(true)}
									icon="edit"
									className={element('btn')}
									size={isScreenMobile || isScreenSmallTablet ? 'medium' : undefined}
								>
									Изменить параметры
								</Button>
							)}
						</div>
					)}
				</div>
			)}

			{/* Блок прогресса: есть запись GoalProgress — прогресс начат, в т.ч. 0% и без заметок */}
			{!isList && isAdded && !regularConfig && progress && (
				<div className={element('regular-info-header')}>
					<div className={element('regular-info-title')}>
						<Svg icon="signal" className={element('regular-info-icon', {progress: true})} />
						<span>{isProgressGoalComplete ? 'Выполнено за:' : 'Прогресс'}</span>
						<span className={element('regular-info-streak', {active: true})}>
							{pluralize(getProgressMarkedDaysCount(progress), ['день', 'дня', 'дней'])}
						</span>
					</div>
					<Line className={element('line')} margin={isScreenMobile ? '8px 0' : undefined} />

					{!isProgressGoalComplete && (
						<>
							{/* График дней недели по recentEntries */}
							<div className={element('regular-series-days')}>
								{Array.from({length: 7}, (_, i) => {
									const dayName = getDayName(i);
									const isCompletedDay = getProgressWeekDaysCompleted(progress)[i];
									const isCurrentDay = i === currentDayIndex;
									return (
										<div key={i} className={element('regular-series-day-wrapper')}>
											<div
												className={element('regular-series-day', {
													selected: isCurrentDay,
													completed: isCompletedDay,
												})}
											>
												{isCompletedDay && (
													<Svg icon="done" className={element('regular-series-day-icon-selected')} />
												)}
											</div>
											<span
												className={element('regular-series-day-name', {
													selected: isCurrentDay,
												})}
											>
												{dayName}
											</span>
										</div>
									);
								})}
							</div>
							<Line className={element('line')} margin={isScreenMobile ? '8px 0' : undefined} />

							{/* Прогресс */}
							<div
								className={element('progress-bar')}
								onClick={handleProgressBarClick}
								onKeyDown={handleProgressBarKeyDown}
								role="button"
								tabIndex={0}
								aria-label={`Изменить прогресс цели, текущий прогресс ${progress.progressPercentage}%`}
								style={{cursor: 'pointer'}}
							>
								<div className={element('regular-series-progress')}>
									<span className={element('regular-series-progress-label')}>Прогресс:</span>
									<div className={element('regular-series-progress-bar')}>
										<Progress done={progress.progressPercentage} all={100} goal />
									</div>
								</div>
							</div>
							<Line className={element('line')} margin={isScreenMobile ? '8px 0' : undefined} />
						</>
					)}

					{/* Количество недель и макс. серия — показываем и при 100% */}
					<div className={element('regular-info-details')}>
						<div className={element('regular-info-row')}>
							<span className={element('regular-info-label')}>Количество недель:</span>
							<span className={element('regular-info-value')}>{getProgressWeeksCount(progress)}</span>
						</div>
						<div className={element('regular-info-row')}>
							<span className={element('regular-info-label')}>Макс. серия без пропусков:</span>
							<span className={element('regular-info-value')}>
								{pluralize(getProgressMaxStreak(progress), ['день', 'дня', 'дней'])}
							</span>
						</div>
					</div>
					<Line className={element('line')} margin={isScreenMobile ? '8px 0' : undefined} />

					{/* Кнопки прогресса: при 100% — только сброс прогресса */}
					<div className={element('regular-series-actions')}>
						{!isProgressGoalComplete && (
							<>
								<Button
									theme={progress.isWorkingToday ? 'green' : 'blue'}
									onClick={handleMarkToday}
									icon={progress.isWorkingToday ? 'regular-checked' : 'regular-empty'}
									className={element('btn')}
									size={isScreenMobile || isScreenSmallTablet ? 'medium' : undefined}
									hoverContent={progress.isWorkingToday ? 'Снять отметку' : undefined}
									hoverIcon={progress.isWorkingToday ? 'cross' : undefined}
								>
									{progress.isWorkingToday ? 'Отмечено сегодня' : 'Отметить сегодня'}
								</Button>
								<Button
									theme="blue-light"
									onClick={handleOpenProgressModalOrStart}
									icon="signal"
									className={element('btn')}
									size={isScreenMobile || isScreenSmallTablet ? 'medium' : undefined}
								>
									Изменить прогресс
								</Button>
							</>
						)}
						{goalId && (
							<Button
								theme="blue-light"
								onClick={() => setIsDeleteProgressModalOpen(true)}
								icon="trash"
								className={element('btn')}
								size={isScreenMobile || isScreenSmallTablet ? 'medium' : undefined}
							>
								Удалить прогресс
							</Button>
						)}
					</div>
				</div>
			)}

			<div className={element('info')}>
				{/* Кнопки для регулярной цели */}
				{regularConfig && isAdded && !isList && (
					<>
						{!seriesInfo.isInterrupted && !seriesInfo.isCompleted && hasRegularSeriesStarted && (
							<Button
								theme="blue-light"
								onClick={handleCompleteSeries}
								icon="stop-circle"
								className={element('btn')}
								size={isScreenMobile || isScreenSmallTablet ? 'medium' : undefined}
							>
								Завершить серию
							</Button>
						)}
						<Button
							theme="blue-light"
							onClick={openFolderSelector}
							icon="folder-open"
							className={element('btn', {folder: true})}
							size={isScreenMobile || isScreenSmallTablet ? 'medium' : undefined}
						>
							Добавить в папку
						</Button>
						<Button
							theme="blue-light"
							onClick={deleteGoal}
							icon="trash"
							className={element('btn')}
							size={isScreenMobile || isScreenSmallTablet ? 'medium' : undefined}
						>
							Удалить
						</Button>
						<Line className={element('line')} margin={isScreenMobile ? '8px 0' : undefined} />
						<Button
							theme="blue-light"
							icon="share"
							onClick={handleShare}
							className={element('btn')}
							size={isScreenMobile || isScreenSmallTablet ? 'medium' : undefined}
						>
							Поделиться
						</Button>
					</>
				)}

				{/* Порядок кнопок для цели с прогрессом */}
				{!isList && isAdded && !regularConfig && (
					<>
						<Button
							theme={isCompleted ? 'green' : 'blue'}
							onClick={handleMarkGoalClick}
							icon="done"
							className={element('btn', {done: true})}
							hoverContent={isCompleted ? 'Отменить выполнение' : ''}
							hoverIcon={isCompleted ? 'cross' : ''}
							size={isScreenMobile || isScreenSmallTablet ? 'medium' : undefined}
						>
							{isCompleted ? 'Выполнено' : 'Выполнить'}
						</Button>
						{isCompleted && !hasOwnComment && (
							<Button
								theme="blue-light"
								onClick={openAddReview}
								icon="comment"
								className={element('btn')}
								size={isScreenMobile || isScreenSmallTablet ? 'medium' : undefined}
							>
								Добавить впечатление
							</Button>
						)}
					</>
				)}
				{!isList && isAdded && !regularConfig && (
					<Button
						theme="blue-light"
						onClick={openFolderSelector}
						icon="folder-open"
						className={element('btn', {folder: true})}
						size={isScreenMobile || isScreenSmallTablet ? 'medium' : undefined}
					>
						Добавить в папку
					</Button>
				)}
				{!isList && !!canEdit && typeof editGoal === 'function' && (
					<Button
						theme="blue-light"
						onClick={editGoal}
						icon="edit"
						className={element('btn')}
						size={isScreenMobile || isScreenSmallTablet ? 'medium' : undefined}
					>
						Редактировать
					</Button>
				)}
				{isAdded && !isCompleted && !isList && !regularConfig && (
					<GoalTimer timer={timer} goalCode={code} onTimerUpdate={handleTimerUpdate} />
				)}
				{!isList && isAdded && !isCompleted && !regularConfig && !progress && (
					<Button
						theme="blue-light"
						onClick={handleOpenProgressModalOrStart}
						icon="signal"
						className={element('btn')}
						size={isScreenMobile || isScreenSmallTablet ? 'medium' : undefined}
					>
						Задать прогресс
					</Button>
				)}
				{isAdded && !regularConfig && !isList && (
					<Button
						theme="blue-light"
						onClick={deleteGoal}
						icon="trash"
						className={element('btn')}
						size={isScreenMobile || isScreenSmallTablet ? 'medium' : undefined}
					>
						Удалить
					</Button>
				)}
				{/* Кнопки для списков */}
				{isList && (
					<>
						{!isAdded && (
							<Button
								onClick={handleAddListGoal}
								icon="plus"
								className={element('btn')}
								theme="blue"
								size={isScreenMobile || isScreenSmallTablet ? 'medium' : undefined}
								disabled={isAddingListGoal}
							>
								{isAddingListGoal ? 'Добавление...' : 'Добавить к себе'}
							</Button>
						)}
						{isAdded && !isCompleted && (
							<Button
								theme="blue"
								onClick={openMarkAll}
								icon="done"
								className={element('btn')}
								size={isScreenMobile || isScreenSmallTablet ? 'medium' : undefined}
							>
								Выполнить все цели
							</Button>
						)}
						{isAdded && (
							<Button
								theme="blue-light"
								onClick={deleteList}
								icon="trash"
								className={element('btn')}
								size={isScreenMobile || isScreenSmallTablet ? 'medium' : undefined}
							>
								Удалить
							</Button>
						)}
						{canEdit && (
							<Button
								theme="blue-light"
								onClick={editGoal}
								icon="edit"
								className={element('btn')}
								type={editGoal ? 'button' : 'Link'}
								href={editGoal ? undefined : `/edit-list/${code}`}
								size={isScreenMobile || isScreenSmallTablet ? 'medium' : undefined}
							>
								Редактировать
							</Button>
						)}
						{!!location?.length && (
							<Button
								theme="blue-light"
								icon="map"
								onClick={openMapModal}
								className={element('btn')}
								size={isScreenMobile || isScreenSmallTablet ? 'medium' : undefined}
							>
								Открыть карту
							</Button>
						)}
						<Button theme="blue-light" className={element('btn')} onClick={handleRandomPick} icon="magic">
							Случайная цель
						</Button>
					</>
				)}
				{/* Кнопки для одиночных целей */}
				{!isList && (
					<>
						{location && (
							<Button
								theme="blue-light"
								icon="map"
								onClick={openMapModal}
								className={element('btn')}
								size={isScreenMobile || isScreenSmallTablet ? 'medium' : undefined}
							>
								Открыть карту
							</Button>
						)}
						{!isAdded && (
							<Button
								onClick={handleAddGoal}
								icon="plus"
								className={element('btn')}
								theme="blue"
								size={isScreenMobile || isScreenSmallTablet ? 'medium' : undefined}
								disabled={isAddingRegularGoal}
							>
								{isAddingRegularGoal ? 'Добавление...' : 'Добавить к себе'}
							</Button>
						)}
					</>
				)}

				{!isList && !regularConfig && (
					<>
						<Line className={element('line')} margin={isScreenMobile ? '8px 0' : undefined} />
						<Button
							theme="blue-light"
							icon="share"
							onClick={handleShare}
							className={element('btn')}
							size={isScreenMobile || isScreenSmallTablet ? 'medium' : undefined}
						>
							Поделиться
						</Button>
					</>
				)}
			</div>
			{/* Модалка подтверждения завершения серии */}
			{regularConfig && isAdded && (
				<ModalConfirm
					isOpen={isCompleteSeriesModalOpen}
					onClose={() => setIsCompleteSeriesModalOpen(false)}
					title="Завершение серии"
					text={
						regularConfig.durationType === 'indefinite'
							? 'Вы действительно хотите завершить текущую серию выполнения цели? Вы сможете начать новую серию позже.'
							: 'Вы действительно хотите прервать текущую серию выполнения цели?'
					}
					textBtnCancel="Отмена"
					textBtn="Завершить"
					themeBtn="red"
					handleBtn={handleConfirmCompleteSeries}
					checkboxText={regularConfig.durationType === 'indefinite' ? 'Отметить серию выполненной' : undefined}
					checkboxId="mark-as-completed"
				/>
			)}
			{/* Модалка подтверждения сброса завершенной серии (отмена выполнения) */}
			{regularConfig && isAdded && (
				<ModalConfirm
					isOpen={isResetCompletedSeriesModalOpen}
					onClose={() => setIsResetCompletedSeriesModalOpen(false)}
					title="Сброс выполнения"
					text="Вы действительно хотите отменить выполнение цели и сбросить весь прогресс серии?"
					textBtnCancel="Отмена"
					textBtn="Сбросить"
					themeBtn="red"
					handleBtn={handleConfirmResetCompletedSeries}
				/>
			)}
			{/* Модалка подтверждения удаления прогресса цели */}
			<ModalConfirm
				isOpen={isDeleteProgressModalOpen}
				onClose={() => setIsDeleteProgressModalOpen(false)}
				title="Удаление прогресса"
				text="Вы действительно хотите удалить весь прогресс цели? Вся история прогресса выполнения будет сброшена."
				textBtnCancel="Отмена"
				textBtn="Удалить"
				themeBtn="red"
				handleBtn={async () => {
					if (!goalId) return;
					await resetGoalProgress(goalId);
					setProgress(null);
					patchParentUserProgress(null);
					if (onHistoryRefresh) {
						onHistoryRefresh();
					}
					refreshHeaderGoalCounts();
				}}
			/>
			{/* Отмена выполнения цели с прогрессом — прогресс удаляется вместе с отметкой */}
			{!isList && isAdded && (
				<ModalConfirm
					isOpen={isUncompleteWithProgressModalOpen}
					onClose={() => setIsUncompleteWithProgressModalOpen(false)}
					title="Отменить выполнение?"
					text="Прогресс будет удалён. Вы точно хотите начать заново выполнение цели?"
					textBtnCancel="Отмена"
					textBtn="Отменить выполнение"
					themeBtn="red"
					handleBtn={async () => {
						await handleMarkGoal(true);
					}}
				/>
			)}
			{/* Модалка редактирования настроек регулярной цели */}
			{regularConfig &&
				isAdded &&
				!isList &&
				regularConfig.allowCustomSettings &&
				(() => {
					// Используем настройки из статистики (пользовательские), если они есть, иначе из regularConfig
					const stats = localStatistics || regularConfig.statistics;
					const settingsData = stats?.regularGoalData || regularConfig;

					return (
						<Modal
							isOpen={isEditSettingsModalOpen}
							onClose={() => setIsEditSettingsModalOpen(false)}
							title="Изменение регулярности цели"
							size="medium"
						>
							<SetRegularGoalModal
								onSave={handleSaveSettings}
								onCancel={() => setIsEditSettingsModalOpen(false)}
								showResetWarning={!(localStatistics || regularConfig?.statistics)?.isSeriesCompleted}
								initialSettings={{
									frequency: settingsData.frequency,
									weeklyFrequency: settingsData.weeklyFrequency,
									customSchedule: settingsData.customSchedule,
									durationType: settingsData.durationType,
									durationValue: settingsData.durationValue,
									endDate: settingsData.endDate,
									resetOnSkip: settingsData.resetOnSkip,
									allowSkipDays: settingsData.allowSkipDays,
									daysForEarnedSkip: (settingsData as any).daysForEarnedSkip,
									markAsCompletedAfterSeries: false,
								}}
							/>
						</Modal>
					);
				})()}
			{/* Модалка подтверждения сброса серии при изменении настроек */}
			{regularConfig && isAdded && (
				<ModalConfirm
					isOpen={isConfirmResetSeriesModalOpen}
					onClose={() => {
						setIsConfirmResetSeriesModalOpen(false);
						setPendingSettings(null);
					}}
					title="Завершение серии"
					text="Вы действительно хотите прервать текущую серию выполнения цели и начать новую с заданными параметрами?"
					textBtnCancel="Отмена"
					textBtn="Завершить"
					themeBtn="red"
					handleBtn={handleConfirmResetSeries}
				/>
			)}
			{/* Модалка редактирования настроек при добавлении регулярной цели */}
			{regularConfig && !isAdded && !isList && regularConfig.allowCustomSettings && (
				<Modal
					isOpen={isAddRegularGoalModalOpen}
					onClose={() => setIsAddRegularGoalModalOpen(false)}
					title="Задать регулярность цели"
				>
					<SetRegularGoalModal
						onSave={handleSaveAddSettings}
						onCancel={() => setIsAddRegularGoalModalOpen(false)}
						initialSettings={{
							frequency: regularConfig.frequency,
							weeklyFrequency: regularConfig.weeklyFrequency,
							customSchedule: regularConfig.customSchedule,
							durationType: regularConfig.durationType,
							durationValue: regularConfig.durationValue,
							endDate: regularConfig.endDate,
							resetOnSkip: regularConfig.resetOnSkip,
							allowSkipDays: regularConfig.allowSkipDays,
							markAsCompletedAfterSeries: false,
						}}
					/>
				</Modal>
			)}
		</aside>
	);
};
