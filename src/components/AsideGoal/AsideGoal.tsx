import {FC, useEffect, useState} from 'react';

import {WeekDaySchedule} from '@/components/WeekDaySelector/WeekDaySelector';
import {useBem} from '@/hooks/useBem';
import useScreenSize from '@/hooks/useScreenSize';
import {ModalStore} from '@/store/ModalStore';
import {NotificationStore} from '@/store/NotificationStore';
import {ILocation, IRegularGoalConfig, IShortGoal} from '@/typings/goal';
import {getGoalTimer, TimerInfo} from '@/utils/api/get/getGoalTimer';
import {
	createGoalProgress,
	getGoalProgress,
	IGoalProgress,
	markRegularProgress,
	resetGoalProgress,
	resetRegularGoal,
} from '@/utils/api/goals';
import {addRegularGoalToUser, RegularGoalSettings} from '@/utils/api/post/addRegularGoalToUser';
import {GoalWithLocation} from '@/utils/mapApi';
import {pluralize} from '@/utils/text/pluralize';

import {Button} from '../Button/Button';
import {GoalTimer} from '../GoalTimer/GoalTimer';
import {Line} from '../Line/Line';
import {Progress} from '../Progress/Progress';
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
	} = props;
	const {onGoalCompleted} = 'onGoalCompleted' in props ? props : {onGoalCompleted: undefined};
	const [timer, setTimer] = useState<TimerInfo | null>(null);
	const [progress, setProgress] = useState<IGoalProgress | null>(null);
	const [isCompleted, setIsCompleted] = useState(done);
	const [isRegularGoalCompletedToday, setIsRegularGoalCompletedToday] = useState(false);
	const [isAddingRegularGoal, setIsAddingRegularGoal] = useState(false);
	const [isAdded, setIsAdded] = useState(added);

	const [block, element] = useBem('aside-goal', className);

	// Синхронизируем локальное состояние с пропсом
	useEffect(() => {
		setIsCompleted(done);
	}, [done]);

	// Синхронизируем локальное состояние added с пропсом
	useEffect(() => {
		setIsAdded(added);
	}, [added]);

	// Инициализируем состояние выполнения регулярной цели на основе статистики
	useEffect(() => {
		if (regularConfig?.statistics) {
			// Для daily проверяем completedToday
			if (regularConfig.statistics.currentPeriodProgress?.type === 'daily') {
				setIsRegularGoalCompletedToday(regularConfig.statistics.currentPeriodProgress.completedToday || false);
			} else if (regularConfig.frequency === 'custom' || regularConfig.frequency === 'weekly') {
				// Для custom и weekly: если нельзя выполнить сегодня, значит уже выполнено
				setIsRegularGoalCompletedToday(!regularConfig.statistics.canCompleteToday);
			}
		}
	}, [regularConfig]);

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

	// Обработчик для отметки регулярной цели
	const handleMarkRegularGoal = async () => {
		if (!regularConfig || !isAdded) return;

		try {
			const response = await markRegularProgress({
				regular_goal_id: regularConfig.id,
				completed: true,
				notes: '',
			});

			if (response.success && response.data) {
				// Обновляем локальное состояние
				setIsRegularGoalCompletedToday(true);

				// Если есть колбэк для обновления родительского компонента, вызываем его
				if (onGoalCompleted) {
					onGoalCompleted();
				}
			}
		} catch (error) {
			console.error('Ошибка отметки регулярной цели:', error);
		}
	};

	// Обработчик завершения серии регулярной цели
	const handleCompleteSeries = async () => {
		if (!regularConfig || !isAdded) return;

		if (!window.confirm('Вы уверены, что хотите завершить текущую серию? Прогресс будет сброшен.')) {
			return;
		}

		try {
			const response = await resetRegularGoal(regularConfig.id);

			if (response.success) {
				NotificationStore.addNotification({
					type: 'success',
					title: 'Успех',
					message: 'Серия успешно завершена',
				});

				// Если есть колбэк для обновления родительского компонента, вызываем его
				if (onGoalCompleted) {
					onGoalCompleted();
				}
			} else {
				throw new Error(response.error || 'Ошибка при завершении серии');
			}
		} catch (error) {
			NotificationStore.addNotification({
				type: 'error',
				title: 'Ошибка',
				message: error instanceof Error ? error.message : 'Не удалось завершить серию',
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
		if (isList) {
			setWindow('delete-goal');
		} else {
			setWindow('delete-goal');
		}
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
				onFolderSelected: (folderId: number, folderName: string) => {
					console.log(`Цель "${title}" добавлена в папку "${folderName}"`);
				},
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
			// Если настройки нельзя изменить, используем базовые настройки без модалки
			if (!regularConfig.allowCustomSettings) {
				setIsAddingRegularGoal(true);
				try {
					const requestData: RegularGoalSettings = {
						frequency: regularConfig.frequency,
						durationType: regularConfig.durationType,
						durationValue: regularConfig.durationValue,
						endDate: regularConfig.endDate || undefined,
						resetOnSkip: regularConfig.resetOnSkip,
						allowSkipDays: regularConfig.allowSkipDays,
						...(regularConfig.frequency === 'weekly' && regularConfig.weeklyFrequency
							? {weeklyFrequency: regularConfig.weeklyFrequency}
							: {}),
						...(regularConfig.frequency === 'custom' && regularConfig.customSchedule
							? {customSchedule: regularConfig.customSchedule as WeekDaySchedule}
							: {}),
					};

					const response = await addRegularGoalToUser(code, requestData);

					if (response.success) {
						setIsAdded(true);
						NotificationStore.addNotification({
							type: 'success',
							title: 'Успех',
							message: 'Регулярная цель успешно добавлена!',
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
				return;
			}

			// Если настройки можно изменить, показываем модалку
			const initialSettings = {
				frequency: regularConfig.frequency,
				weeklyFrequency: regularConfig.weeklyFrequency,
				customSchedule: regularConfig.customSchedule,
				durationType: regularConfig.durationType,
				durationValue: regularConfig.durationValue,
				endDate: regularConfig.endDate || undefined,
				resetOnSkip: regularConfig.resetOnSkip,
				allowSkipDays: regularConfig.allowSkipDays,
				markAsCompletedAfterSeries: false, // По умолчанию false
			};

			setWindow('set-regular-goal');
			setModalProps({
				title: 'Задать регулярность цели',
				initialSettings,
				onSave: async (settings: RegularGoalSettings) => {
					setIsAddingRegularGoal(true);
					try {
						// Явно передаем все поля, включая customSchedule
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
							...(settings.durationType === 'until_date' && settings.endDate !== undefined
								? {endDate: settings.endDate}
								: {}),
						};

						const response = await addRegularGoalToUser(code, requestData);

						if (response.success) {
							// Обновляем локальное состояние, чтобы UI обновился сразу
							setIsAdded(true);

							NotificationStore.addNotification({
								type: 'success',
								title: 'Успех',
								message: 'Регулярная цель успешно добавлена с вашими настройками!',
							});
							setIsOpen(false);
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
				},
			});
			setIsOpen(true);
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
				return `${regularConfig.durationValue || 0} ${pluralize(regularConfig.durationValue || 0, ['день', 'дня', 'дней'])}`;
			case 'weeks':
				return `${regularConfig.durationValue || 0} ${pluralize(regularConfig.durationValue || 0, ['неделя', 'недели', 'недель'])}`;
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

		// Если цель добавлена и есть статистика, используем данные из статистики (пользовательские настройки)
		if (isAdded && regularConfig.statistics?.regularGoalData) {
			frequency = regularConfig.statistics.regularGoalData.frequency || frequency;
			customSchedule = regularConfig.statistics.regularGoalData.customSchedule || customSchedule;
			weeklyFrequency = regularConfig.statistics.regularGoalData.weeklyFrequency || weeklyFrequency;
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

	// Получение информации о текущем прогрессе регулярной цели
	const getRegularProgress = () => {
		if (!regularConfig) return null;

		// Если есть статистика, используем её
		if (regularConfig.statistics?.currentPeriodProgress) {
			const regularProgressData = regularConfig.statistics.currentPeriodProgress;

			if (regularProgressData.type === 'daily') {
				// Учитываем локальное состояние (если цель была отмечена в текущей сессии)
				const completedToday = isRegularGoalCompletedToday || regularProgressData.completedToday;
				return {
					text: completedToday ? 'Выполнено сегодня' : 'Не выполнено сегодня',
					completed: completedToday,
					streak: regularProgressData.streak || 0,
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
			return {
				text: isRegularGoalCompletedToday ? 'Выполнено сегодня' : 'Не выполнено сегодня',
				completed: isRegularGoalCompletedToday,
				streak: 0,
			};
		}

		if (regularConfig.frequency === 'weekly') {
			return {
				text: `0 из ${regularConfig.weeklyFrequency || 1} на этой неделе`,
				progress: 0,
			};
		}

		// Для custom частоты используем weekly логику, если есть статистика
		if (regularConfig.frequency === 'custom' && regularConfig.statistics?.currentPeriodProgress) {
			const regularProgressData = regularConfig.statistics.currentPeriodProgress;
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
		if (!regularConfig?.statistics) {
			// Если статистики нет, возвращаем 0 с правильной единицей
			const unit = regularConfig?.frequency === 'daily' ? 'дней' : 'недель';
			return {value: 0, unit};
		}

		const streak = regularConfig.statistics.currentStreak || 0;

		// Для daily - серия в днях, для weekly/custom - в неделях
		if (regularConfig.frequency === 'daily') {
			return {
				value: streak,
				unit: streak === 1 ? 'день' : streak >= 2 && streak <= 4 ? 'дня' : 'дней',
			};
		}
		// Для weekly и custom - серия в неделях
		// currentStreak уже должен быть в правильных единицах, но на всякий случай проверяем
		return {
			value: streak,
			unit: streak === 1 ? 'неделя' : streak >= 2 && streak <= 4 ? 'недели' : 'недель',
		};
	};

	const regularProgress = getRegularProgress();

	// Получение процента прогресса
	const getProgressPercentage = (): number => {
		if (!regularConfig || !regularProgress) return 0;

		if (regularConfig.frequency === 'daily') {
			return regularProgress.completed ? 100 : 0;
		}

		if (regularConfig.frequency === 'weekly' && regularProgress.progress !== undefined) {
			return regularProgress.progress;
		}

		// Для custom можно использовать процент завершенных дней недели
		if (regularConfig.frequency === 'custom' && regularConfig.customSchedule) {
			// Если есть статистика по неделе, используем её
			if (regularProgress?.progress !== undefined) {
				return regularProgress.progress;
			}
			return 0;
		}

		return 0;
	};

	// Проверка, является ли день выбранным (для custom)
	const isDaySelected = (dayIndex: number): boolean => {
		if (!regularConfig) return false;

		// Получаем актуальную частоту и customSchedule (могут быть в статистике для пользовательских настроек)
		let {frequency} = regularConfig;
		let {customSchedule} = regularConfig;

		// Если цель добавлена и есть статистика, используем данные из статистики (пользовательские настройки)
		if (isAdded && regularConfig.statistics?.regularGoalData) {
			frequency = regularConfig.statistics.regularGoalData.frequency || frequency;
			customSchedule = regularConfig.statistics.regularGoalData.customSchedule || customSchedule;
		}

		if (frequency !== 'custom' || !customSchedule) {
			return false;
		}

		const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
		const dayKey = dayKeys[dayIndex];
		return customSchedule[dayKey] === true;
	};

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
								<span className={element('regular-info-value')}>{regularConfig.allowSkipDays || 0}</span>
							</div>
						</div>
					)}
				</div>
			)}

			{/* Блок сведений о текущей серии - показывается если цель добавлена */}
			{regularConfig && isAdded && !isList && (
				<div className={element('regular-info-header')}>
					<div className={element('regular-info-title')}>
						{seriesInfo.value > 0 ? (
							<Svg icon="regular" className={element('regular-info-icon')} />
						) : (
							<Svg icon="regular-empty" className={element('regular-info-icon')} />
						)}
						<span>Текущая серия</span>
						<span
							className={element('regular-info-streak', {
								active: seriesInfo.value > 0,
							})}
						>
							{seriesInfo.value} {seriesInfo.unit}
						</span>
					</div>

					{/* Календарь дней недели */}
					<div className={element('regular-series-days')}>
						{Array.from({length: 7}, (_, i) => {
							const dayName = getDayName(i);
							let isSelected = false;
							let isBlocked = false;
							let isCompletedDay = false;
							const isCurrentDay = i === currentDayIndex;

							if (regularConfig.frequency === 'daily') {
								isSelected = i === currentDayIndex;
								isCompletedDay = isSelected && (regularProgress?.completed || false);
							} else if (regularConfig.frequency === 'custom') {
								// Определяем выбранные дни по общему графику из regularGoalData (пользовательские настройки)
								// weekDays используем только для определения статуса выполнения
								isSelected = isDaySelected(i);
								isBlocked = !isDaySelected(i);

								// Используем данные из weekDays для определения статуса выполнения
								const weekDays = regularConfig.statistics?.currentPeriodProgress?.weekDays;
								if (weekDays && weekDays.length > 0) {
									const dayData = weekDays.find((d) => d.dayIndex === i);
									if (dayData) {
										isCompletedDay = dayData.isCompleted || false;
									}
								}
							}
							// Для weekly все дни отображаются, но не выделяются

							// Синяя рамка только для текущего дня, если он выбран и не выполнен
							const showBorder = isSelected && !isCompletedDay && !isBlocked && isCurrentDay;

							return (
								<div key={i} className={element('regular-series-day-wrapper')}>
									<div
										className={element('regular-series-day', {
											selected: showBorder,
											blocked: isBlocked,
											completed: isCompletedDay,
										})}
									>
										{isBlocked && <Svg icon="cross" className={element('regular-series-day-icon')} />}
										{isCompletedDay && <Svg icon="done" className={element('regular-series-day-icon-selected')} />}
									</div>
									<span
										className={element('regular-series-day-name', {
											selected: isSelected && !isBlocked && isCurrentDay,
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
					<div className={element('regular-series-progress')}>
						<span className={element('regular-series-progress-label')}>Прогресс:</span>
						<div className={element('regular-series-progress-bar')}>
							<Progress done={progressPercentage} all={100} goal />
						</div>
					</div>
					<Line className={element('line')} margin={isScreenMobile ? '8px 0' : undefined} />

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
							<span className={element('regular-info-value')}>{regularConfig.allowSkipDays || 0}</span>
						</div>
					</div>
					<Line className={element('line')} margin={isScreenMobile ? '8px 0' : undefined} />
					{/* Блок кнопок для регулярной цели */}
					{regularConfig && isAdded && !isList && (
						<div className={element('regular-series-actions')}>
							{(regularConfig.frequency === 'daily' ||
								regularConfig.frequency === 'weekly' ||
								regularConfig.frequency === 'custom') && (
								<Button
									theme={
										(regularConfig.frequency === 'daily' &&
											(isRegularGoalCompletedToday || regularProgress?.completed)) ||
										(regularConfig.frequency === 'weekly' && regularProgress?.progress === 100) ||
										(regularConfig.frequency === 'custom' && regularProgress?.progress === 100)
											? 'green'
											: 'blue'
									}
									onClick={handleMarkRegularGoal}
									icon="regular"
									className={element('btn')}
									size={isScreenMobile || isScreenSmallTablet ? 'medium' : undefined}
								>
									{regularConfig.frequency === 'daily' && (isRegularGoalCompletedToday || regularProgress?.completed)
										? 'Выполнено сегодня'
										: regularConfig.frequency === 'daily'
										? 'Выполнить сегодня'
										: regularProgress?.progress === 100
										? 'Выполнено сегодня'
										: 'Выполнить сегодня'}
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
						<Button
							theme="blue-light"
							onClick={handleCompleteSeries}
							icon="stop-circle"
							className={element('btn')}
							size={isScreenMobile || isScreenSmallTablet ? 'medium' : undefined}
						>
							Завершить серию
						</Button>
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
						icon="folder"
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
		</aside>
	);
};
