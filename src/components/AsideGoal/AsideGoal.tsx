import {FC, useEffect, useState} from 'react';

import {WeekDaySchedule} from '@/components/WeekDaySelector/WeekDaySelector';
import {useBem} from '@/hooks/useBem';
import useScreenSize from '@/hooks/useScreenSize';
import {ModalStore} from '@/store/ModalStore';
import {NotificationStore} from '@/store/NotificationStore';
import {IGoal, ILocation, IRegularGoalConfig, IRegularGoalStatistics, IShortGoal} from '@/typings/goal';
import {getGoalTimer, TimerInfo} from '@/utils/api/get/getGoalTimer';
import {
	createGoalProgress,
	getGoalProgress,
	IGoalProgress,
	markRegularProgress,
	resetCompletedSeries,
	resetGoalProgress,
	resetRegularGoal,
	restartAfterCompletion,
	restartRegularGoal,
} from '@/utils/api/goals';
import {addRegularGoalToUser} from '@/utils/api/post/addRegularGoalToUser';
import {updateRegularGoalSettings} from '@/utils/api/post/updateRegularGoalSettings';
import {GoalWithLocation} from '@/utils/mapApi';
import {pluralize} from '@/utils/text/pluralize';

import {Button} from '../Button/Button';
import {GoalTimer} from '../GoalTimer/GoalTimer';
import {Line} from '../Line/Line';
import {Modal} from '../Modal/Modal';
import {ModalConfirm} from '../ModalConfirm/ModalConfirm';
import {Progress} from '../Progress/Progress';
import {RegularGoalSettings, SetRegularGoalModal} from '../SetRegularGoalModal/SetRegularGoalModal';
import {Svg} from '../Svg/Svg';

import './aside-goal.scss';

interface AsideProps {
	className?: string;
	title: string;
	image: string;
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
	editGoal?: (() => void) | undefined;
	canEdit?: boolean;
	location?: ILocation;
	onGoalCompleted?: () => void; // Новый колбэк для уведомления о завершении цели
	onHistoryRefresh?: () => void; // Колбэк для обновления истории выполнения
	onGoalUpdate?: (updatedGoal?: IGoal) => void; // Колбэк для обновления цели
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
	const onGoalUpdate = !isList ? (props as AsideGoalProps).onGoalUpdate : undefined;
	const [timer, setTimer] = useState<TimerInfo | null>(null);
	const [progress, setProgress] = useState<IGoalProgress | null>(null);
	const [isCompleted, setIsCompleted] = useState(done);
	const [isRegularGoalCompletedToday, setIsRegularGoalCompletedToday] = useState(false);
	const [isAddingRegularGoal, setIsAddingRegularGoal] = useState(false);
	const [isAdded, setIsAdded] = useState(added);
	const [localStatistics, setLocalStatistics] = useState<IRegularGoalStatistics | null>(regularConfig?.statistics || null);

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
	const {isScreenMobile, isScreenSmallTablet} = useScreenSize();

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

	// Загрузка прогресса цели
	useEffect(() => {
		const loadProgress = async () => {
			if (isAdded && !isList && goalId) {
				try {
					const response = await getGoalProgress(goalId);
					if (response.success && response.data) {
						setProgress(response.data);
					}
				} catch (error) {
					console.error('Ошибка загрузки прогресса:', error);
				}
			}
		};

		loadProgress();
	}, [isAdded, isList, goalId]);

	const handleTimerUpdate = (updatedTimer: TimerInfo | null) => {
		setTimer(updatedTimer);
	};

	const handleRandomPick = () => {
		ModalStore.setWindow('random-goal-picker');
		ModalStore.setModalProps({goals: list});
		ModalStore.setIsOpen(true);
	};

	const handleStartProgress = async () => {
		if (!isList && isAdded && goalId && (!progress || progress.progressPercentage === 0)) {
			try {
				const response = await createGoalProgress(goalId, {
					progress_percentage: 0,
					daily_notes: 'Начало выполнения цели',
					is_working_today: true,
				});

				if (response.success && response.data) {
					setProgress(response.data);
					// Обновляем прогресс заданий для начала выполнения цели
					// Прогресс заданий обновляется автоматически на бэкенде
				}
			} catch (error) {
				console.error('Ошибка начала выполнения:', error);
			}
		}
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

		// Проверяем, начата ли серия (есть start_date и current_streak > 0)
		const seriesStarted = localStatistics?.startDate && localStatistics.currentStreak > 0;

		if (seriesStarted) {
			// Сохраняем настройки и показываем подтверждение
			setPendingSettings(settings);
			setIsEditSettingsModalOpen(false);
			setIsConfirmResetSeriesModalOpen(true);
		} else {
			// Если серия не начата, сохраняем сразу
			handleUpdateSettings(settings);
		}
	};

	// Подтверждение сброса серии при изменении настроек
	const handleConfirmResetSeries = async () => {
		if (!pendingSettings) return;

		setIsConfirmResetSeriesModalOpen(false);
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

	const openProgressModal = () => {
		if (!isList && goalId && progress) {
			setWindow('progress-update');
			setIsOpen(true);
			setModalProps({
				goalId,
				goalTitle: title,
				currentProgress: progress,
				onProgressUpdate: (updatedProgress: IGoalProgress) => {
					setProgress(updatedProgress);
					// Если прогресс достиг 100%, отмечаем как выполненную
					if (updatedProgress.progressPercentage >= 100) {
						setIsCompleted(true);
					}
				},
				onGoalCompleted: () => {
					setIsCompleted(true);
					if (onGoalCompleted) {
						onGoalCompleted();
					}
				},
			});
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
			});
		}
	};

	const handleShare = async () => {
		// Прогресс заданий обновляется автоматически на бэкенде

		window.open(`https://telegram.me/share/url?url=${window.location.href}`, 'sharer', 'status=0,toolbar=0,width=650,height=500');
	};

	// Обработчик добавления цели с проверкой на регулярность
	const handleAddGoal = async () => {
		if (isList || isAdded) return;

		if (regularConfig) {
			// Если настройки нельзя изменить, используем обычный endpoint /add/ с базовыми настройками
			if (!regularConfig.allowCustomSettings) {
				setIsAddingRegularGoal(true);
				try {
					// Используем обычный endpoint для добавления цели с базовыми настройками
					await updateGoal(code, 'add');
					setIsAdded(true);
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

	const handleMarkGoal = async (isCurrentlyCompleted: boolean) => {
		// Если цель снимается с выполнения и есть прогресс, сбрасываем его
		if (isCurrentlyCompleted && progress && goalId) {
			try {
				await resetGoalProgress(goalId);
				setProgress(null);
			} catch (error) {
				console.error('Ошибка сброса прогресса:', error);
			}
		}

		// Обновляем локальное состояние
		setIsCompleted(!isCurrentlyCompleted);

		// Вызываем оригинальную функцию только для целей (не списков)
		if (!isList) {
			await (updateGoal as any)(code, 'mark', isCurrentlyCompleted);
		}
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

		switch (regularConfig.durationType) {
			case 'days':
				return `${pluralize(regularConfig.durationValue || 0, ['день', 'дня', 'дней'])}`;
			case 'weeks':
				return `${pluralize(regularConfig.durationValue || 0, ['неделя', 'недели', 'недель'])}`;
			case 'until_date':
				if (regularConfig.endDate) {
					const date = new Date(regularConfig.endDate);
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
			return `${weeklyFrequency || 0} раз в неделю`;
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

	// Получение информации о серии (дни или недели)
	const getSeriesInfo = () => {
		// Используем локальную статистику, если она есть, иначе из пропсов
		const stats = localStatistics || regularConfig?.statistics;

		if (!stats || !regularConfig) {
			// Если статистики нет, возвращаем 0 с правильной единицей
			const unit = regularConfig?.frequency === 'daily' ? 'дней' : 'недель';
			return {value: 0, unit, isInterrupted: false, isCompleted: false};
		}

		// Проверяем, завершена ли серия
		const seriesIsCompleted = stats.isSeriesCompleted || false;
		const isInterrupted = stats.isInterrupted || false;

		// Для завершенной серии используем currentStreak (количество выполненного до завершения)
		// Для прерванной серии используем interruptedStreak
		let streak = stats.currentStreak || 0;
		if (isInterrupted && stats.interruptedStreak !== null && stats.interruptedStreak !== undefined) {
			streak = stats.interruptedStreak;
		} else if (seriesIsCompleted) {
			// Для завершенной серии определяем количество дней/недель:
			// - Для daily/weekly/custom с durationType 'days' или 'weeks': используем currentStreak (уже установлен при завершении)
			// - Для 'until_date': используем totalCompletions для daily/custom или completedWeeks для weekly (количество отмеченных дней/недель)
			const durationType = stats.regularGoalData?.durationType || regularConfig.durationType;
			const frequency = stats.regularGoalData?.frequency || regularConfig.frequency;
			if (durationType === 'until_date') {
				// Для целей до даты используем количество отмеченных дней/недель
				if (frequency === 'weekly') {
					// Для weekly целей используем completedWeeks (количество завершенных недель)
					// Если completedWeeks не установлен, используем currentStreak (который уже в неделях)
					streak = stats.completedWeeks > 0 ? stats.completedWeeks : stats.currentStreak || 0;
				} else {
					// Для daily/custom используем totalCompletions (количество отмеченных дней)
					streak = stats.totalCompletions || 0;
				}
			} else {
				// Для остальных типов длительности (days, weeks) используем currentStreak (количество дней/недель в серии)
				streak = stats.currentStreak || 0;
			}
		}

		// Для daily - серия в днях, для weekly/custom - в неделях
		if (regularConfig.frequency === 'daily') {
			return {
				value: streak,
				unit: pluralize(streak, ['день', 'дня', 'дней']),
				isInterrupted,
				isCompleted: seriesIsCompleted,
			};
		}
		// Для weekly и custom - серия в неделях
		return {
			value: streak,
			unit: pluralize(streak, ['неделя', 'недели', 'недель']),
			isInterrupted,
			isCompleted: seriesIsCompleted,
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
	const currentDayIndex = getCurrentDayOfWeek();
	const progressPercentage = getProgressPercentage();

	return (
		<aside className={block()}>
			<img src={image} alt={title} className={element('image')} />
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
							<div className={element('regular-info-row')}>
								<span className={element('regular-info-label')}>Сброс прогресса:</span>
								<span className={element('regular-info-value')}>{regularConfig.resetOnSkip ? 'Да' : 'Нет'}</span>
							</div>
							<div className={element('regular-info-row')}>
								<span className={element('regular-info-label')}>Разрешенные пропуски:</span>
								<span className={element('regular-info-value')}>
									{localStatistics?.remainingSkipDays !== undefined
										? localStatistics.remainingSkipDays
										: regularConfig.statistics?.remainingSkipDays !== undefined
										? regularConfig.statistics.remainingSkipDays
										: regularConfig.allowSkipDays || 0}
								</span>
							</div>
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
					<div className={element('regular-info-title')}>
						{seriesInfo.isCompleted ? (
							<Svg icon="regular-checked" className={element('regular-info-icon')} />
						) : seriesInfo.isInterrupted ? (
							<Svg icon="regular-cancel" className={element('regular-info-icon')} />
						) : seriesInfo.value > 0 ? (
							<Svg icon="regular" className={element('regular-info-icon')} />
						) : (
							<Svg icon="regular-empty" className={element('regular-info-icon')} />
						)}
						<span>
							{seriesInfo.isCompleted ? 'Серия выполнена' : seriesInfo.isInterrupted ? 'Серия прервана' : 'Текущая серия'}
						</span>
						{(seriesInfo.isCompleted || seriesInfo.isInterrupted || seriesInfo.value > 0) && (
							<span
								className={element('regular-info-streak', {
									active: true,
								})}
							>
								{seriesInfo.unit}
							</span>
						)}
					</div>

					{/* Календарь дней недели - показываем только если серия не прервана и не завершена */}
					{!seriesInfo.isInterrupted && !seriesInfo.isCompleted && (
						<div className={element('regular-series-days')}>
							{Array.from({length: 7}, (_, i) => {
								const dayName = getDayName(i);
								let isSelected = false;
								let isBlocked = false;
								let isBlockedByStartDate = false; // Блокировка из-за даты начала (показываем пустым, без крестика)
								let isCompletedDay = false;
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
												isBlocked?: boolean;
												isBlockedByStartDate?: boolean;
												isSkipped?: boolean;
												isAllowed?: boolean;
											}) => d.dayIndex === i
										);
										if (dayData) {
											isSelected = dayData.isAllowed !== false; // Все дни недели доступны, но нужно проверить, не до start_date
											// Для daily целей: isBlockedByStartDate - пустой день (не показываем крестик)
											// isBlocked по расписанию не используется для daily
											isBlocked = false; // Для daily целей нет блокировки по расписанию
											isBlockedByStartDate = dayData.isBlockedByStartDate || false;
											isCompletedDay = !isBlockedByStartDate && (dayData.isCompleted || false); // Выполнено, только если не заблокирован по дате начала
											isSkipped = !isBlockedByStartDate && (dayData.isSkipped || false); // Использован разрешенный пропуск (для цвета фона)
										}
									} else {
										// Fallback: если weekDays нет, используем старую логику (только текущий день)
										isSelected = i === currentDayIndex;
										if (isSelected) {
											// Для текущего дня используем данные из обновленной статистики
											if (localStatistics?.currentPeriodProgress?.type === 'daily') {
												isCompletedDay = localStatistics.currentPeriodProgress.completedToday || false;
											} else {
												const dailyFallbackStats = localStatistics || regularConfig.statistics;
												if (dailyFallbackStats?.currentPeriodProgress?.type === 'daily') {
													isCompletedDay = dailyFallbackStats.currentPeriodProgress.completedToday || false;
												} else {
													// Fallback на локальное состояние
													isCompletedDay = isRegularGoalCompletedToday || regularProgress?.completed || false;
												}
											}
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
												isBlocked?: boolean;
												isBlockedByStartDate?: boolean;
												isSkipped?: boolean;
												isAllowed?: boolean;
											}) => d.dayIndex === i
										);
										if (dayData) {
											isSelected = dayData.isAllowed !== false; // Все дни недели доступны по умолчанию, но нужно проверить, не до start_date
											// Для weekly целей: isBlockedByStartDate - пустой день (не показываем крестик)
											// isBlocked по расписанию не используется для weekly (все дни доступны)
											isBlockedByStartDate = dayData.isBlockedByStartDate || false;
											isBlocked = false; // Для weekly целей нет блокировки по расписанию
											isCompletedDay = !isBlockedByStartDate && (dayData.isCompleted || false); // Выполнено или использован пропуск, только
											//  если не заблокирован по дате начала
											isSkipped = !isBlockedByStartDate && (dayData.isSkipped || false); // Использован разрешенный пропуск (для цвета фона)
										}
									}
									// Если weekDays нет или пуст, используем fallback логику
									if (!weekDays || weekDays.length === 0) {
										// Fallback: для weekly целей все дни недели доступны по умолчанию
										// Проверяем, не до start_date (если start_date установлен)
										const weeklyFallbackStats = localStatistics || regularConfig.statistics;
										const startDate = weeklyFallbackStats?.startDate
											? new Date(`${weeklyFallbackStats.startDate}T00:00:00`)
											: null;
										const today = new Date();
										today.setHours(0, 0, 0, 0);

										// Вычисляем понедельник текущей недели (Python weekday: понедельник = 0)
										const dayOfWeek = today.getDay(); // JS: воскресенье = 0, понедельник = 1
										const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Преобразуем в формат понедельник = 0
										const weekStart = new Date(today);
										weekStart.setDate(today.getDate() - diff);
										weekStart.setHours(0, 0, 0, 0);

										const dayDate = new Date(weekStart);
										dayDate.setDate(weekStart.getDate() + i);
										dayDate.setHours(0, 0, 0, 0);

										if (startDate) {
											startDate.setHours(0, 0, 0, 0);
											isSelected = dayDate >= startDate;
											isBlockedByStartDate = dayDate < startDate; // Блокировка из-за даты начала
											isBlocked = false; // Для weekly нет блокировки по расписанию
										} else {
											// Если start_date еще не установлен, все дни доступны
											isSelected = true;
											isBlockedByStartDate = false;
											isBlocked = false;
										}

										isCompletedDay = false;
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
												isBlocked?: boolean;
												isBlockedByStartDate?: boolean;
												isSkipped?: boolean;
												isAllowed?: boolean;
											}) => d.dayIndex === i
										);
										if (dayData) {
											const daySelected = dayData.isAllowed !== false;
											isSelected = daySelected;
											isBlocked = !daySelected; // все невыбранные дни — с крестиками
											isBlockedByStartDate = false;
											isCompletedDay = daySelected && !isBlocked && (dayData.isCompleted || false);
											isSkipped = daySelected && !isBlocked && (dayData.isSkipped || false);
										}
									} else {
										// Fallback: определяем выбранные дни по общему графику, без учета startDate
										const daySelected = isDaySelected(i);
										isSelected = daySelected;
										isBlocked = !daySelected; // все невыбранные дни — с крестиками
										isBlockedByStartDate = false;
										isCompletedDay = false;
										isSkipped = false;
									}
								}

								// Синяя рамка и выделение всегда на текущем дне (isCurrentDay),
								// Не показываем рамку только для блокировки по дате начала (isBlockedByStartDate).
								const showBorder = isCurrentDay && !isBlockedByStartDate;

								return (
									<div key={i} className={element('regular-series-day-wrapper')}>
										<div
											className={element('regular-series-day', {
												selected: showBorder,
												// Класс blocked применяется только для блокировки по расписанию (custom/weekly)
												// Для блокировки по дате начала (isBlockedByStartDate) не применяем класс blocked
												blocked: isBlocked && !isBlockedByStartDate, // Блокировка по расписанию - показываем крестик
												completed: isCompletedDay && !isSkipped && !isBlocked && !isBlockedByStartDate, // Обычное выполнение (зеленый)
												skipped: isSkipped && !isBlocked && !isBlockedByStartDate, // Использован пропуск (серый)
											})}
										>
											{/* Для заблокированных по расписанию дней показываем крестик */}
											{isBlocked && !isBlockedByStartDate && (
												<Svg icon="cross" className={element('regular-series-day-icon')} />
											)}
											{/* Для выполненных дней показываем галочку */}
											{!isBlocked && !isBlockedByStartDate && (isCompletedDay || isSkipped) && (
												<Svg icon="done" className={element('regular-series-day-icon-selected')} />
											)}
											{/* Для заблокированных по дате начала дней ничего не показываем (пустой день) */}
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

					{/* Прогресс - показывается только для целей с определенной длительностью и не завершенных */}
					{progressPercentage !== null && !seriesInfo.isCompleted && (
						<>
							<div className={element('regular-series-progress')}>
								<span className={element('regular-series-progress-label')}>Прогресс:</span>
								<div className={element('regular-series-progress-bar')}>
									<Progress done={progressPercentage} all={100} goal />
								</div>
							</div>
							<Line className={element('line')} margin={isScreenMobile ? '8px 0' : undefined} />
						</>
					)}

					{/* Строка "Выполнено раз: X" - показывается если серия была выполнена хотя бы раз (даже если цель удалена) */}
					{regularConfig.completedSeriesCount !== undefined && regularConfig.completedSeriesCount > 0 && (
						<>
							<div className={element('regular-series-completed-count')}>
								<span className={element('regular-series-completed-count-label')}>Выполнено раз:</span>
								<span className={element('regular-series-completed-count-value')}>
									{regularConfig.completedSeriesCount}
								</span>
							</div>
							<Line className={element('line')} margin={isScreenMobile ? '8px 0' : undefined} />
						</>
					)}
					{/* Строка "Макс. серия: X" - показывается если серия прервана или выполнена */}
					{(seriesInfo.isCompleted || seriesInfo.isInterrupted) && (
						<>
							<div className={element('regular-series-max-streak')}>
								<span className={element('regular-series-max-streak-label')}>Макс. серия:</span>
								<span className={element('regular-series-max-streak-value')}>
									{(localStatistics || regularConfig?.statistics)?.maxStreak || 0}
								</span>
							</div>
							<Line className={element('line')} margin={isScreenMobile ? '8px 0' : undefined} />
						</>
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
						<div className={element('regular-info-row')}>
							<span className={element('regular-info-label')}>Сброс прогресса:</span>
							<span className={element('regular-info-value')}>{regularConfig.resetOnSkip ? 'Да' : 'Нет'}</span>
						</div>
						<div className={element('regular-info-row')}>
							<span className={element('regular-info-label')}>Разрешенные пропуски:</span>
							<span className={element('regular-info-value')}>
								{localStatistics?.remainingSkipDays !== undefined
									? localStatistics.remainingSkipDays
									: regularConfig.statistics?.remainingSkipDays !== undefined
									? regularConfig.statistics.remainingSkipDays
									: regularConfig.allowSkipDays || 0}
							</span>
						</div>
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
								// Если серия завершена, показываем кнопку "Выполнено" и "Выполнить ещё раз"
								<>
									<Button
										theme="green"
										onClick={handleResetCompletedSeries}
										icon="regular-checked"
										className={element('btn')}
										size={isScreenMobile || isScreenSmallTablet ? 'medium' : undefined}
										hoverContent="Отменить выполнение"
										hoverIcon="cross"
									>
										Выполнено
									</Button>
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
								// Если серия прервана, показываем кнопку "Начать заново"
								<Button
									theme="blue"
									onClick={handleRestartGoal}
									icon="regular-empty"
									className={element('btn')}
									size={isScreenMobile || isScreenSmallTablet ? 'medium' : undefined}
								>
									Начать заново
								</Button>
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
										icon={isRegularGoalBlockedTodayBySchedule ? undefined : 'regular'}
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
											? 'Сегодня выполнить цель нельзя'
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
							{/* Кнопка "изменить параметры" - показывается только если разрешено редактирование */}
							{regularConfig && isAdded && !isList && regularConfig.allowCustomSettings && (
								<Button
									theme="blue-light"
									onClick={() => setIsEditSettingsModalOpen(true)}
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

			<div className={element('info')}>
				{/* Кнопки для регулярной цели */}
				{regularConfig && isAdded && !isList && (
					<>
						{!seriesInfo.isInterrupted && !seriesInfo.isCompleted && (
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
							className={element('btn')}
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
							Поделиться в Telegram
						</Button>
					</>
				)}

				{/* Отображение прогресса для целей в процессе (только для невыполненных целей) */}
				{!isList && isAdded && !isCompleted && progress && (progress.progressPercentage > 0 || progress.dailyNotes) && (
					<div className={element('progress-section')}>
						<div className={element('progress-header')}>
							<span className={element('progress-label')}>Прогресс выполнения</span>
							<span className={element('progress-value')}>{progress.progressPercentage}%</span>
						</div>
						<div
							className={element('progress-bar')}
							onClick={handleProgressBarClick}
							onKeyDown={handleProgressBarKeyDown}
							role="button"
							tabIndex={0}
							aria-label={`Изменить прогресс цели, текущий прогресс ${progress.progressPercentage}%`}
							style={{cursor: 'pointer'}}
						>
							<Progress done={progress.progressPercentage} all={100} goal />
						</div>
						{progress.progressPercentage < 100 && (
							<Button
								theme="blue-light"
								onClick={openProgressModal}
								icon="trending-up"
								className={element('btn')}
								size={isScreenMobile || isScreenSmallTablet ? 'medium' : undefined}
							>
								Изменить прогресс
							</Button>
						)}
					</div>
				)}

				{/* Кнопка "Начать выполнение" для добавленных целей с прогрессом 0% без заметок */}
				{!isList &&
					isAdded &&
					!isCompleted &&
					(!progress || (progress.progressPercentage === 0 && !progress.dailyNotes)) &&
					!regularConfig && (
						<Button
							theme="green"
							onClick={handleStartProgress}
							icon="play"
							className={element('btn')}
							size={isScreenMobile || isScreenSmallTablet ? 'medium' : undefined}
						>
							Начать выполнение
						</Button>
					)}

				{/* Кнопка "Выполнить" для целей с прогрессом или без него */}
				{!isList && isAdded && !regularConfig && (
					<Button
						theme={isCompleted ? 'green' : 'blue'}
						onClick={() => handleMarkGoal(isCompleted)}
						icon="plus"
						className={element('btn', {done: true})}
						hoverContent={isCompleted ? 'Отменить выполнение' : ''}
						hoverIcon={isCompleted ? 'cross' : ''}
						size={isScreenMobile || isScreenSmallTablet ? 'medium' : undefined}
					>
						{isCompleted ? 'Выполнено' : 'Выполнить'}
					</Button>
				)}
				{!isList && isAdded && !regularConfig && (
					<Button
						theme="blue-light"
						onClick={openFolderSelector}
						icon="folder-open"
						className={element('btn')}
						size={isScreenMobile || isScreenSmallTablet ? 'medium' : undefined}
					>
						Добавить в папку
					</Button>
				)}
				{isList && isAdded && !isCompleted && (
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
				{((location && !isList) || (isList && !!location?.length)) && (
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

				{!isAdded && !isList && (
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
				{!isList && isCompleted && (
					<Button
						theme="blue-light"
						onClick={openAddReview}
						icon="comment"
						className={element('btn')}
						size={isScreenMobile || isScreenSmallTablet ? 'medium' : undefined}
					>
						Написать отзыв
					</Button>
				)}
				{isAdded && !regularConfig && (
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
				{isList && (
					<Button theme="blue-light" className={element('btn')} onClick={handleRandomPick} icon="magic">
						Случайная цель
					</Button>
				)}

				{/* Показываем таймер, если цель добавлена и не является списком */}
				{isAdded && !isCompleted && !isList && (
					<>
						<Line className={element('line')} />
						<GoalTimer timer={timer} goalCode={code} onTimerUpdate={handleTimerUpdate} />
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
