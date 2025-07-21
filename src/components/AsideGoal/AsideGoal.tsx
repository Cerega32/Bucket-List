import {FC, useEffect, useState} from 'react';

import {useBem} from '@/hooks/useBem';
import useScreenSize from '@/hooks/useScreenSize';
import {ModalStore} from '@/store/ModalStore';
import {ILocation, IRegularGoalConfig} from '@/typings/goal';
import {getGoalTimer, TimerInfo} from '@/utils/api/get/getGoalTimer';
import {createGoalProgress, getGoalProgress, IGoalProgress, markRegularProgress, resetGoalProgress} from '@/utils/api/goals';
import {GoalWithLocation} from '@/utils/mapApi';

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
}

export interface AsideListsProps extends AsideProps {
	updateGoal: (code: string, operation: 'add' | 'delete' | 'mark-all') => Promise<void | boolean>;
	isList: true;
	openAddReview?: never;
	editGoal?: never;
	canEdit?: boolean;
	location?: GoalWithLocation[];
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
	} = props;
	const {onGoalCompleted} = 'onGoalCompleted' in props ? props : {onGoalCompleted: undefined};
	const [timer, setTimer] = useState<TimerInfo | null>(null);
	const [progress, setProgress] = useState<IGoalProgress | null>(null);
	const [isCompleted, setIsCompleted] = useState(done);
	const [isRegularGoalCompletedToday, setIsRegularGoalCompletedToday] = useState(false);

	const [block, element] = useBem('aside-goal', className);

	// Синхронизируем локальное состояние с пропсом
	useEffect(() => {
		setIsCompleted(done);
	}, [done]);

	// Инициализируем состояние выполнения регулярной цели на основе статистики
	useEffect(() => {
		if (regularConfig?.statistics?.currentPeriodProgress) {
			const progressData = regularConfig.statistics.currentPeriodProgress;
			if (progressData.type === 'daily') {
				setIsRegularGoalCompletedToday(progressData.completedToday || false);
			}
		}
	}, [regularConfig]);

	const {setIsOpen, setWindow, setFuncModal, setModalProps} = ModalStore;
	const {isScreenMobile, isScreenSmallTablet} = useScreenSize();

	// Загрузка информации о таймере
	useEffect(() => {
		const loadTimer = async () => {
			if (added && !isList) {
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
	}, [code, added, isList]);

	// Загрузка прогресса цели
	useEffect(() => {
		const loadProgress = async () => {
			if (added && !isList && goalId) {
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
	}, [added, isList, goalId]);

	const handleTimerUpdate = (updatedTimer: TimerInfo | null) => {
		setTimer(updatedTimer);
	};

	const handleStartProgress = async () => {
		if (!isList && added && goalId && (!progress || progress.progressPercentage === 0)) {
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
		if (!regularConfig || !added) return;

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
		if (!isList && added && goalId) {
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

	// Функция для получения текста периодичности
	const getFrequencyText = () => {
		if (!regularConfig) return '';

		switch (regularConfig.frequency) {
			case 'daily':
				return 'Ежедневно';
			case 'weekly':
				return `${regularConfig.weeklyFrequency} раз в неделю`;
			case 'custom':
				return 'Пользовательский график';
			default:
				return '';
		}
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

		return null;
	};

	const regularProgress = getRegularProgress();

	return (
		<aside className={block()}>
			<img src={image} alt={title} className={element('image')} />
			<div className={element('info')}>
				{/* Информация о регулярной цели */}
				{regularConfig && added && !isList && (
					<div className={element('regular-section')}>
						<div className={element('regular-header')}>
							<Svg icon="calendar" className={element('regular-icon')} />
							<span className={element('regular-title')}>Регулярная цель</span>
						</div>
						<p className={element('regular-frequency')}>{getFrequencyText()}</p>

						{regularProgress && (
							<div className={element('regular-progress')}>
								{regularProgress.progress !== undefined ? (
									<>
										<div className={element('progress-text')}>{regularProgress.text}</div>
										<Progress done={regularProgress.progress} all={100} goal />
									</>
								) : (
									<div className={element('daily-status', {completed: regularProgress.completed})}>
										<Svg icon={regularProgress.completed ? 'done' : 'clock'} className={element('status-icon')} />
										<span>{regularProgress.text}</span>
										{regularProgress.streak > 0 && (
											<span className={element('streak')}>Серия: {regularProgress.streak}</span>
										)}
									</div>
								)}
							</div>
						)}

						{regularConfig &&
							added &&
							regularConfig.frequency === 'daily' &&
							!isRegularGoalCompletedToday &&
							!regularConfig.statistics?.currentPeriodProgress?.completedToday && (
								<Button
									theme="green"
									onClick={handleMarkRegularGoal}
									icon="plus"
									className={element('btn')}
									size={isScreenMobile || isScreenSmallTablet ? 'medium' : undefined}
								>
									Отметить сегодня
								</Button>
							)}

						<Line className={element('line')} />
					</div>
				)}

				{/* Отображение прогресса для целей в процессе (только для невыполненных целей) */}
				{!isList && added && !isCompleted && progress && (progress.progressPercentage > 0 || progress.dailyNotes) && (
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
					added &&
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
				{!isList && added && !regularConfig && (
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
				{!isList && added && (
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
				{isList && added && !isCompleted && (
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

				{!added && (
					<Button
						onClick={() => updateGoal(code, 'add')}
						icon="plus"
						className={element('btn')}
						theme="blue"
						size={isScreenMobile || isScreenSmallTablet ? 'medium' : undefined}
					>
						Добавить к себе
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
				{added && (
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

				{/* Показываем таймер, если цель добавлена и не является списком */}
				{added && !isCompleted && !isList && (
					<>
						<Line className={element('line')} />
						<GoalTimer timer={timer} goalCode={code} onTimerUpdate={handleTimerUpdate} />
					</>
				)}

				<Line className={element('line')} margin={isScreenMobile ? '8px 0' : undefined} />
				<Button
					theme="blue-light"
					icon="mount"
					onClick={handleShare}
					className={element('btn')}
					size={isScreenMobile || isScreenSmallTablet ? 'medium' : undefined}
				>
					Поделиться
				</Button>
			</div>
		</aside>
	);
};
