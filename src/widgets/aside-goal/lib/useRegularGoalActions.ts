import {useEffect, useState} from 'react';

import {
	markRegularProgress,
	resetCompletedSeries,
	resetRegularGoal,
	restartAfterCompletion,
	restartRegularGoal,
} from '@/entities/goal/api/goals';
import {refreshHeaderGoalCounts} from '@/entities/goal/lib/refreshHeaderGoalCounts';
import {IGoal, IRegularGoalConfig, IRegularGoalStatistics} from '@/entities/goal/model/types';
import {addRegularGoalToUser} from '@/entities/regular-goal/api/addRegularGoalToUser';
import {updateRegularGoalSettings} from '@/entities/regular-goal/api/updateRegularGoalSettings';
import {weeklyProratedHintForFirstDayOnCalendar} from '@/entities/regular-goal/lib/weeklyProratedHint';
import {RegularGoalSettings} from '@/features/set-regular-goal/SetRegularGoalModal';
import {NotificationStore} from '@/shared/model/NotificationStore';
import {
	calcDurationDisplay,
	calcFrequencyDisplay,
	calcIsRegularGoalBlockedTodayBySchedule,
	calcProgressPercentage,
	calcRegularProgress,
	calcSeriesInfo,
	cloneRegularStatistics,
	deriveRegularGoalCompletedToday,
	IRegularProgressInfo,
	ISeriesInfo,
} from '@/widgets/aside-goal/lib/asideGoalCalculations';

interface UseRegularGoalActionsParams {
	regularConfig: IRegularGoalConfig | undefined;
	added: boolean;
	isAdded: boolean;
	setIsAdded: (value: boolean) => void;
	code: string;
	page: string | undefined;
	onGoalCompleted: (() => void) | undefined;
	onHistoryRefresh: (() => void) | undefined;
	onGoalUpdate: ((updatedGoal?: IGoal | Partial<IGoal>) => void) | undefined;
}

interface IWeeklyProratedStartHint {
	tDays: number;
	minCompletions: number;
	N: number;
}

interface UseRegularGoalActionsReturn {
	localStatistics: IRegularGoalStatistics | null;
	isRegularGoalCompletedToday: boolean;
	isAddingRegularGoal: boolean;
	setIsAddingRegularGoal: (value: boolean) => void;

	regularProgress: IRegularProgressInfo | null;
	isRegularGoalBlockedTodayBySchedule: boolean;
	seriesInfo: ISeriesInfo;
	hasRegularSeriesStarted: boolean;
	showRegularMaxStreak: boolean;
	showRegularCompletedCount: boolean;
	regularDisplayProgress: number | null;
	showRegularProgress: boolean;
	hasRegularSeriesMeta: boolean;
	showRegularCalendar: boolean;
	showRegularLineBeforeDetails: boolean;
	daysUntilEarnedSkip: number | null;
	weeklyProratedStartHint: IWeeklyProratedStartHint | null;

	getDurationDisplay: () => string;
	getFrequencyDisplay: () => string;
	isDaySelected: (dayIndex: number) => boolean;

	handleResetCompletedSeries: () => void;
	handleMarkRegularGoal: () => Promise<void>;
	handleCompleteSeries: () => void;
	handleSaveSettings: (settings: RegularGoalSettings) => void;
	handleConfirmResetSeries: () => Promise<void>;
	handleSaveAddSettings: (settings: RegularGoalSettings) => Promise<void>;
	handleConfirmCompleteSeries: (markAsCompleted?: boolean) => Promise<void>;
	handleConfirmResetCompletedSeries: () => Promise<void>;
	handleRestartAfterCompletion: () => Promise<void>;
	handleCompleteInterruptedSeries: () => Promise<void>;
	handleRestartGoal: () => Promise<void>;

	isCompleteSeriesModalOpen: boolean;
	closeCompleteSeriesModal: () => void;
	isResetCompletedSeriesModalOpen: boolean;
	closeResetCompletedSeriesModal: () => void;
	isEditSettingsModalOpen: boolean;
	openEditSettingsModal: () => void;
	closeEditSettingsModal: () => void;
	isConfirmResetSeriesModalOpen: boolean;
	closeConfirmResetSeriesModal: () => void;
	isAddRegularGoalModalOpen: boolean;
	openAddRegularGoalModal: () => void;
	closeAddRegularGoalModal: () => void;
}

/** Состояние, эффекты синхронизации и обработчики действий регулярной цели (серии, настройки, добавление) */
export const useRegularGoalActions = (params: UseRegularGoalActionsParams): UseRegularGoalActionsReturn => {
	const {regularConfig, added, isAdded, setIsAdded, code, page, onGoalCompleted, onHistoryRefresh, onGoalUpdate} = params;

	const [localStatistics, setLocalStatistics] = useState<IRegularGoalStatistics | null>(regularConfig?.statistics || null);
	const [isRegularGoalCompletedToday, setIsRegularGoalCompletedToday] = useState(false);
	const [isAddingRegularGoal, setIsAddingRegularGoal] = useState(false);
	const [isCompleteSeriesModalOpen, setIsCompleteSeriesModalOpen] = useState(false);
	const [isResetCompletedSeriesModalOpen, setIsResetCompletedSeriesModalOpen] = useState(false);
	const [isEditSettingsModalOpen, setIsEditSettingsModalOpen] = useState(false);
	const [isConfirmResetSeriesModalOpen, setIsConfirmResetSeriesModalOpen] = useState(false);
	const [pendingSettings, setPendingSettings] = useState<RegularGoalSettings | null>(null);
	const [isAddRegularGoalModalOpen, setIsAddRegularGoalModalOpen] = useState(false);

	// Синхронизируем localStatistics с regularConfig при его изменении
	useEffect(() => {
		if (regularConfig?.statistics) {
			setLocalStatistics(regularConfig.statistics);
		}
	}, [regularConfig?.statistics]);

	// Сбрасываем локальные состояния регулярной цели при удалении цели
	useEffect(() => {
		if (!added && regularConfig) {
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
			const newStatistics = cloneRegularStatistics(regularConfig.statistics);

			setLocalStatistics(newStatistics);
			setIsRegularGoalCompletedToday(
				deriveRegularGoalCompletedToday(newStatistics, regularConfig, {fallback: isRegularGoalCompletedToday})
			);
		} else {
			// Если статистики нет (цель добавлена, но еще не начата), сбрасываем локальное состояние
			setLocalStatistics(null);
			setIsRegularGoalCompletedToday(false);
		}
	}, [regularConfig, added]);

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
	// Пересчитываем regularProgress при каждом рендере (функция легковесная)
	const regularProgress = calcRegularProgress(regularConfig, localStatistics, isRegularGoalCompletedToday);

	// "Заблокировано сегодня"
	const isRegularGoalBlockedTodayBySchedule = calcIsRegularGoalBlockedTodayBySchedule(regularConfig, isAdded, localStatistics);

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
					const newStatistics = cloneRegularStatistics(statisticsData);

					// Сначала обновляем статистику
					setLocalStatistics(newStatistics);

					// Затем обновляем локальное состояние выполнения на основе обновленной статистики
					// Это гарантирует, что состояние синхронизировано с данными из API
					setIsRegularGoalCompletedToday(
						deriveRegularGoalCompletedToday(newStatistics, regularConfig, {fallback: isRegularGoalCompletedToday})
					);
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

				// Обновляем счётчик регулярных целей в шапке и лимиты в профиле
				refreshHeaderGoalCounts();
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

				// Обновляем счётчик регулярных целей в шапке и лимиты в профиле
				refreshHeaderGoalCounts();

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
					const newStatistics = cloneRegularStatistics(statisticsData);

					// Обновляем локальную статистику из ответа API
					setLocalStatistics(newStatistics);

					// Обновляем локальное состояние выполнения на основе обновленной статистики
					setIsRegularGoalCompletedToday(deriveRegularGoalCompletedToday(newStatistics, regularConfig));
				} else {
					// Fallback: сбрасываем локальное состояние выполнения
					setIsRegularGoalCompletedToday(false);
				}

				// Обновляем счётчик регулярных целей в шапке и лимиты в профиле
				refreshHeaderGoalCounts();

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
					const newStatistics = cloneRegularStatistics(statisticsData);

					setLocalStatistics(newStatistics);

					// Обновляем локальное состояние выполнения
					setIsRegularGoalCompletedToday(
						deriveRegularGoalCompletedToday(newStatistics, regularConfig, {checkWeeklyOrCustom: false})
					);
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
					const newStatistics = cloneRegularStatistics(statisticsData);

					setLocalStatistics(newStatistics);

					// Обновляем локальное состояние выполнения
					setIsRegularGoalCompletedToday(
						deriveRegularGoalCompletedToday(newStatistics, regularConfig, {checkWeeklyOrCustom: false})
					);
				} else {
					setIsRegularGoalCompletedToday(false);
				}

				// Обновляем счётчик регулярных целей в шапке и лимиты в профиле
				refreshHeaderGoalCounts();

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
					setLocalStatistics(cloneRegularStatistics(statisticsData));
				}
				refreshHeaderGoalCounts();
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
					const newStatistics = cloneRegularStatistics(statisticsData);

					// Обновляем локальную статистику из ответа API
					setLocalStatistics(newStatistics);

					// Обновляем локальное состояние выполнения на основе обновленной статистики
					setIsRegularGoalCompletedToday(deriveRegularGoalCompletedToday(newStatistics, regularConfig));
				} else {
					// Fallback: сбрасываем локальное состояние выполнения
					setIsRegularGoalCompletedToday(false);
				}

				// Обновляем счётчик регулярных целей в шапке и лимиты в профиле
				refreshHeaderGoalCounts();

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

	// Функция для форматирования длительности
	const getDurationDisplay = () => calcDurationDisplay(regularConfig, localStatistics, isAdded);

	// Функция для форматирования периодичности для отображения в карточке
	const getFrequencyDisplay = () => calcFrequencyDisplay(regularConfig, localStatistics, isAdded);

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
	const seriesInfo = calcSeriesInfo(localStatistics, regularConfig);
	const regularStatsForActions = localStatistics || regularConfig?.statistics;
	const hasRegularSeriesStarted =
		(regularStatsForActions?.totalCompletions ?? 0) > 0 || Boolean(regularStatsForActions?.lastCompletionDate);
	const progressPercentage = calcProgressPercentage(regularConfig, localStatistics, regularProgress);
	const regularDurationType = regularStatsForActions?.regularGoalData?.durationType || regularConfig?.durationType;
	const regularResetOnSkip = regularStatsForActions?.regularGoalData?.resetOnSkip ?? regularConfig?.resetOnSkip ?? false;
	const showRegularMaxStreak =
		Boolean(regularConfig) &&
		regularDurationType === 'indefinite' &&
		!seriesInfo.isCompleted &&
		(seriesInfo.isInterrupted || (!regularResetOnSkip && (seriesInfo.maxStreak === 0 || seriesInfo.maxStreak > seriesInfo.value)));
	const showRegularCompletedCount = regularConfig?.completedSeriesCount !== undefined && regularConfig.completedSeriesCount > 0;
	const isRegularCompletedWithFinite = seriesInfo.isCompleted && regularDurationType !== 'indefinite';
	const regularDisplayProgress = isRegularCompletedWithFinite ? 100 : progressPercentage;
	const showRegularProgress =
		Boolean(regularConfig) &&
		regularDurationType !== 'indefinite' &&
		regularDisplayProgress !== null &&
		(isRegularCompletedWithFinite || !seriesInfo.isCompleted);
	const hasRegularSeriesMeta = showRegularMaxStreak || showRegularCompletedCount || showRegularProgress;
	const showRegularCalendar = !seriesInfo.isInterrupted && !seriesInfo.isCompleted;
	const showRegularLineBeforeDetails =
		hasRegularSeriesMeta || seriesInfo.isCompleted || seriesInfo.isInterrupted || showRegularCompletedCount;
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

	const handleCloseConfirmResetSeriesModal = () => {
		setIsConfirmResetSeriesModalOpen(false);
		setPendingSettings(null);
	};

	return {
		localStatistics,
		isRegularGoalCompletedToday,
		isAddingRegularGoal,
		setIsAddingRegularGoal,

		regularProgress,
		isRegularGoalBlockedTodayBySchedule,
		seriesInfo,
		hasRegularSeriesStarted,
		showRegularMaxStreak,
		showRegularCompletedCount,
		regularDisplayProgress,
		showRegularProgress,
		hasRegularSeriesMeta,
		showRegularCalendar,
		showRegularLineBeforeDetails,
		daysUntilEarnedSkip,
		weeklyProratedStartHint,

		getDurationDisplay,
		getFrequencyDisplay,
		isDaySelected,

		handleResetCompletedSeries,
		handleMarkRegularGoal,
		handleCompleteSeries,
		handleSaveSettings,
		handleConfirmResetSeries,
		handleSaveAddSettings,
		handleConfirmCompleteSeries,
		handleConfirmResetCompletedSeries,
		handleRestartAfterCompletion,
		handleCompleteInterruptedSeries,
		handleRestartGoal,

		isCompleteSeriesModalOpen,
		closeCompleteSeriesModal: () => setIsCompleteSeriesModalOpen(false),
		isResetCompletedSeriesModalOpen,
		closeResetCompletedSeriesModal: () => setIsResetCompletedSeriesModalOpen(false),
		isEditSettingsModalOpen,
		openEditSettingsModal: () => setIsEditSettingsModalOpen(true),
		closeEditSettingsModal: () => setIsEditSettingsModalOpen(false),
		isConfirmResetSeriesModalOpen,
		closeConfirmResetSeriesModal: handleCloseConfirmResetSeriesModal,
		isAddRegularGoalModalOpen,
		openAddRegularGoalModal: () => setIsAddRegularGoalModalOpen(true),
		closeAddRegularGoalModal: () => setIsAddRegularGoalModalOpen(false),
	};
};
