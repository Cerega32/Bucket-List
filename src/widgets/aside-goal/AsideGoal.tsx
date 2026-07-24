import {observer} from 'mobx-react-lite';
import {type KeyboardEvent, FC, useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';

import {goalsToMapPoints, mapApi} from '@/entities/goal/api/mapApi';
import {refreshHeaderGoalCounts} from '@/entities/goal/lib/refreshHeaderGoalCounts';
import {GoalStore} from '@/entities/goal/model/GoalStore';
import '@/entities/comment/ui/CommentImagesGallery/comment-images-gallery.scss';
import {GoalTimer} from '@/entities/goal/ui/GoalTimer/GoalTimer';
import {SCRATCH_MAP_PAGE_URL} from '@/entities/goal-list/lib/scratchMapList';
import {blockRegularGoalsAddIfLimitReached, isPremiumSubscriptionActive} from '@/entities/regular-goal/lib/checkRegularGoalsAddLimit';
import {
	addDays,
	endOfISOWeekFromMonday,
	startOfISOWeek,
	weeklyProratedHintForFirstDayOnCalendar,
} from '@/entities/regular-goal/lib/weeklyProratedHint';
import {WeekDaySchedule} from '@/entities/regular-goal/ui/WeekDaySelector/WeekDaySelector';
import {requireEmailConfirmed} from '@/entities/user/lib/requireEmailConfirmed';
import {UserStore} from '@/entities/user/model/UserStore';
import {useBem} from '@/shared/lib/hooks/useBem';
import useScreenSize from '@/shared/lib/hooks/useScreenSize';
import {pluralize} from '@/shared/lib/text/pluralize';
import {ModalStore} from '@/shared/model/ModalStore';
import {NotificationStore} from '@/shared/model/NotificationStore';
import {Button} from '@/shared/ui/Button/Button';
import {GRADIENT_DEFAULT_IMAGE} from '@/shared/ui/Gradient/Gradient';
import {LightboxWithScrollLock} from '@/shared/ui/LightboxWithScrollLock/LightboxWithScrollLock';
import {Line} from '@/shared/ui/Line/Line';
import {Progress} from '@/shared/ui/Progress/Progress';
import {Svg} from '@/shared/ui/Svg/Svg';
import {Tag} from '@/shared/ui/Tag/Tag';
import {
	getCurrentDayOfWeek,
	getDayName,
	getProgressMarkedDaysCount,
	getProgressMaxStreak,
	getProgressWeekDaysCompleted,
	getProgressWeeksCount,
} from '@/widgets/aside-goal/lib/asideGoalCalculations';
import {useGoalProgressActions} from '@/widgets/aside-goal/lib/useGoalProgressActions';
import {useGoalTimer} from '@/widgets/aside-goal/lib/useGoalTimer';
import {useRegularGoalActions} from '@/widgets/aside-goal/lib/useRegularGoalActions';
import {AsideGoalProps, AsideListsProps} from '@/widgets/aside-goal/model/types';
import {AsideGoalModals} from '@/widgets/aside-goal/ui/AsideGoalModals/AsideGoalModals';

import '@/widgets/aside-goal/aside-goal.scss';

export const AsideGoal: FC<AsideGoalProps | AsideListsProps> = observer((props) => {
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
	const hasScratchMap = isList ? (props as AsideListsProps).hasScratchMap : false;
	const onGoalUpdate = !isList ? (props as AsideGoalProps).onGoalUpdate : undefined;
	const goalUserProgress = !isList ? (props as AsideGoalProps).userProgress : undefined;
	const [isAddingListGoal, setIsAddingListGoal] = useState(false);
	const [isAdded, setIsAdded] = useState(added);

	const navigate = useNavigate();

	const {myComment} = GoalStore;
	const hasMyComment = isList ? (props as AsideListsProps).hasMyComment : (props as AsideGoalProps).hasMyComment;
	const hasOwnComment = isList
		? Boolean(hasMyComment || (myComment?.goalInfo?.isList && myComment.goalInfo.code === code))
		: Boolean(myComment || hasMyComment);

	const [isGoalImageLightboxOpen, setIsGoalImageLightboxOpen] = useState(false);
	const [isShareModalOpen, setIsShareModalOpen] = useState(false);
	const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
	const [isMapLoading, setIsMapLoading] = useState(false);

	const [block, element] = useBem('aside-goal', className);
	const isPremium = isPremiumSubscriptionActive(UserStore.userSelf);
	const canEditProgress = isPremium;

	// Синхронизируем локальное состояние added с пропсом
	useEffect(() => {
		setIsAdded(added);
	}, [added]);

	const {setIsOpen, setWindow, setFuncModal, setModalProps} = ModalStore;
	const {isAuth} = UserStore;
	const {isScreenMobile, isScreenSmallTablet} = useScreenSize();

	const {timer, handleTimerUpdate} = useGoalTimer({code, isAdded, isList: !!isList});

	const {
		progress,
		isCompleted,
		isProgressGoalComplete,
		handleOpenProgressModalOrStart,
		handleProgressBarClick,
		handleProgressBarKeyDown,
		handleMarkToday,
		handleMarkGoalClick,
		isDeleteProgressModalOpen,
		openDeleteProgressModal,
		closeDeleteProgressModal,
		handleConfirmDeleteProgress,
		isUncompleteWithProgressModalOpen,
		closeUncompleteWithProgressModal,
		handleConfirmUncompleteWithProgress,
	} = useGoalProgressActions({
		isList: !!isList,
		isAdded,
		goalId,
		goalUserProgress,
		canEditProgress,
		regularConfig,
		title,
		code,
		image,
		done,
		page,
		updateGoal: updateGoal as (code: string, operation: string, done?: boolean) => Promise<void | boolean>,
		onGoalCompleted,
		onHistoryRefresh,
		onGoalUpdate,
	});

	const {
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
		closeCompleteSeriesModal,
		isResetCompletedSeriesModalOpen,
		closeResetCompletedSeriesModal,
		isEditSettingsModalOpen,
		openEditSettingsModal,
		closeEditSettingsModal,
		isConfirmResetSeriesModalOpen,
		closeConfirmResetSeriesModal,
		isAddRegularGoalModalOpen,
		openAddRegularGoalModal,
		closeAddRegularGoalModal,
	} = useRegularGoalActions({
		regularConfig,
		added,
		isAdded,
		setIsAdded,
		code,
		page,
		onGoalCompleted,
		onHistoryRefresh,
		onGoalUpdate,
	});

	const handleRandomPick = () => {
		ModalStore.setWindow('random-goal-picker');
		ModalStore.setModalProps({goals: list, listCode});
		ModalStore.setIsOpen(true);
	};

	const currentDayIndex = getCurrentDayOfWeek();

	const imageSrc = image != null && String(image).trim() !== '' ? String(image).trim() : GRADIENT_DEFAULT_IMAGE;
	const canOpenGoalImageLightbox = imageSrc !== GRADIENT_DEFAULT_IMAGE;

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

	const openMapModal = async () => {
		if (!isList) {
			setWindow('goal-map');
			setIsOpen(true);
			setModalProps({
				location,
				userVisitedLocation: isCompleted,
			});
			return;
		}

		if (hasScratchMap) {
			if (!UserStore.isAuth) {
				setIsOpen(true);
				setWindow('login');
				return;
			}
			navigate(SCRATCH_MAP_PAGE_URL);
			return;
		}

		const listMapCode = listCode || code;
		setIsMapLoading(true);
		try {
			const data = await mapApi.getGoalListMapData(listMapCode);
			const goals = goalsToMapPoints(data.goals);
			if (!goals.length) {
				NotificationStore.addNotification({
					type: 'error',
					title: 'Карта недоступна',
					message: 'В этом списке нет целей с координатами',
				});
				return;
			}
			setWindow('goal-map-multi');
			setIsOpen(true);
			setModalProps({goals});
		} catch {
			if (location?.length) {
				setWindow('goal-map-multi');
				setIsOpen(true);
				setModalProps({goals: location});
				return;
			}
			NotificationStore.addNotification({
				type: 'error',
				title: 'Не удалось загрузить карту',
				message: 'Попробуйте ещё раз позже',
			});
		} finally {
			setIsMapLoading(false);
		}
	};

	const openFolderSelector = () => {
		if (!requireEmailConfirmed()) {
			return;
		}
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

	const handleShare = () => {
		setIsShareModalOpen(true);
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
			if (
				blockRegularGoalsAddIfLimitReached({
					onPremium: () => navigate('/user/self/subs'),
				})
			) {
				return;
			}

			// Если настройки нельзя изменить, используем обычный endpoint /add/ с базовыми настройками
			if (!regularConfig.allowCustomSettings) {
				setIsAddingRegularGoal(true);
				try {
					// Используем обычный endpoint для добавления цели с базовыми настройками
					await updateGoal(code, 'add');
					setIsAdded(true);

					// Обновляем счётчик регулярных целей в шапке и лимиты в профиле
					refreshHeaderGoalCounts();

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
			openAddRegularGoalModal();
			return;
		}
		await updateGoal(code, 'add');
	};

	const renderPremiumProgressButton = (label: string) => (
		<Button
			type="Link"
			href="/premium"
			theme="blue-light"
			icon="lock"
			className={`${element('btn')} ${element('progress-premium-btn')}`}
			size={isScreenMobile || isScreenSmallTablet ? 'medium' : undefined}
		>
			<span className={element('progress-premium-btn-content')} title="Доступно с Premium">
				{label}
				<Tag text="Premium" theme="gold" className={element('progress-premium-tag')} />
			</span>
		</Button>
	);

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
							<Line className={element('line')} />
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
								return skipDays > 0 || regularConfig.resetOnSkip ? (
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
					{showRegularCalendar && (
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
					{showRegularCalendar && <Line className={element('line')} />}
					{!showRegularCalendar && hasRegularSeriesMeta && <Line className={element('line')} />}

					{hasRegularSeriesMeta && (
						<>
							{showRegularProgress && (
								<div className={element('regular-series-progress', {tight: hasRegularSeriesMeta})}>
									<span className={element('regular-series-progress-label')}>Прогресс:</span>
									<div className={element('regular-series-progress-bar')}>
										<Progress done={regularDisplayProgress as number} all={100} goal />
									</div>
								</div>
							)}
							<div
								className={element('regular-info-details', {
									tight: showRegularProgress,
								})}
							>
								{showRegularCompletedCount && (
									<div className={element('regular-info-row')}>
										<span className={element('regular-info-label')}>Выполнено раз:</span>
										<span className={element('regular-info-value')}>{regularConfig.completedSeriesCount}</span>
									</div>
								)}
								{showRegularMaxStreak && (
									<div className={element('regular-info-row')}>
										<span className={element('regular-info-label')}>Макс. серия без пропусков:</span>
										<span className={element('regular-info-value')}>{seriesInfo.maxStreakUnit}</span>
									</div>
								)}
							</div>
						</>
					)}
					{showRegularLineBeforeDetails && <Line className={element('line')} />}
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
							return skipDays > 0 || regularConfig.resetOnSkip ? (
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
					<Line className={element('line')} />
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
									onClick={openEditSettingsModal}
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
					<Line className={element('line')} />

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
							<Line className={element('line')} />

							{/* Прогресс */}
							{canEditProgress ? (
								<button
									type="button"
									className={element('progress-bar')}
									onClick={handleProgressBarClick}
									onKeyDown={handleProgressBarKeyDown}
									aria-label={`Изменить прогресс цели, текущий прогресс ${progress.progressPercentage}%`}
								>
									<div className={element('regular-series-progress')}>
										<span className={element('regular-series-progress-label')}>Прогресс:</span>
										<div className={element('regular-series-progress-bar')}>
											<Progress done={progress.progressPercentage} all={100} goal />
										</div>
									</div>
								</button>
							) : (
								<div className={element('progress-bar', {readonly: true})} style={{cursor: 'default'}}>
									<div className={element('regular-series-progress')}>
										<span className={element('regular-series-progress-label')}>Прогресс:</span>
										<div className={element('regular-series-progress-bar')}>
											<Progress done={progress.progressPercentage} all={100} goal />
										</div>
									</div>
								</div>
							)}
							<Line className={element('line')} />
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
					<Line className={element('line')} />

					{/* Кнопки прогресса: при 100% — только сброс прогресса */}
					<div className={element('regular-series-actions')}>
						{!isProgressGoalComplete &&
							(canEditProgress ? (
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
							) : (
								renderPremiumProgressButton('Изменить прогресс')
							))}
						{goalId && canEditProgress && (
							<Button
								theme="blue-light"
								onClick={openDeleteProgressModal}
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
						<Line className={element('line')} />
						<Button
							theme="blue-light"
							icon="share"
							onClick={handleShare}
							className={element('btn')}
							size={isScreenMobile || isScreenSmallTablet ? 'medium' : undefined}
						>
							Поделиться
						</Button>
						{isAuth && (
							<Button
								theme="blue-light"
								icon="dice-five"
								onClick={() => {
									if (!requireEmailConfirmed()) {
										return;
									}
									setIsMergeModalOpen(true);
								}}
								className={element('btn')}
								size={isScreenMobile || isScreenSmallTablet ? 'medium' : undefined}
							>
								Нашли дубль цели?
							</Button>
						)}
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
				{!isList &&
					isAdded &&
					!isCompleted &&
					!regularConfig &&
					!progress &&
					(canEditProgress ? (
						<Button
							theme="blue-light"
							onClick={handleOpenProgressModalOrStart}
							icon="signal"
							className={element('btn')}
							size={isScreenMobile || isScreenSmallTablet ? 'medium' : undefined}
						>
							Задать прогресс
						</Button>
					) : (
						renderPremiumProgressButton('Задать прогресс')
					))}
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
						{(hasScratchMap || !!location?.length) && (
							<Button
								theme="blue-light"
								icon="map"
								onClick={openMapModal}
								className={element('btn')}
								size={isScreenMobile || isScreenSmallTablet ? 'medium' : undefined}
								disabled={!hasScratchMap && isMapLoading}
							>
								{hasScratchMap ? 'Скретч-карта' : isMapLoading ? 'Загрузка...' : 'Открыть карту'}
							</Button>
						)}
						{isAdded && isCompleted && !hasOwnComment && openAddReview ? (
							<Button
								theme="blue-light"
								onClick={openAddReview}
								icon="comment"
								className={element('btn')}
								size={isScreenMobile || isScreenSmallTablet ? 'medium' : undefined}
							>
								Оставить впечатление
							</Button>
						) : (
							!isCompleted && (
								<Button theme="blue-light" className={element('btn')} onClick={handleRandomPick} icon="magic">
									Случайная цель
								</Button>
							)
						)}
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
						{isAuth && (
							<Button
								theme="blue-light"
								icon="dice-five"
								onClick={() => {
									if (!requireEmailConfirmed()) {
										return;
									}
									setIsMergeModalOpen(true);
								}}
								className={element('btn')}
								size={isScreenMobile || isScreenSmallTablet ? 'medium' : undefined}
							>
								Нашли дубль цели?
							</Button>
						)}
					</>
				)}
			</div>
			<AsideGoalModals
				isList={!!isList}
				isAdded={isAdded}
				code={code}
				title={title}
				image={image}
				regularConfig={regularConfig}
				localStatistics={localStatistics}
				isShareModalOpen={isShareModalOpen}
				onCloseShareModal={() => setIsShareModalOpen(false)}
				isMergeModalOpen={isMergeModalOpen}
				onCloseMergeModal={() => setIsMergeModalOpen(false)}
				isCompleteSeriesModalOpen={isCompleteSeriesModalOpen}
				onCloseCompleteSeriesModal={closeCompleteSeriesModal}
				onConfirmCompleteSeries={handleConfirmCompleteSeries}
				isResetCompletedSeriesModalOpen={isResetCompletedSeriesModalOpen}
				onCloseResetCompletedSeriesModal={closeResetCompletedSeriesModal}
				onConfirmResetCompletedSeries={handleConfirmResetCompletedSeries}
				isDeleteProgressModalOpen={isDeleteProgressModalOpen}
				onCloseDeleteProgressModal={closeDeleteProgressModal}
				onConfirmDeleteProgress={handleConfirmDeleteProgress}
				isUncompleteWithProgressModalOpen={isUncompleteWithProgressModalOpen}
				onCloseUncompleteWithProgressModal={closeUncompleteWithProgressModal}
				onConfirmUncompleteWithProgress={handleConfirmUncompleteWithProgress}
				isEditSettingsModalOpen={isEditSettingsModalOpen}
				onCloseEditSettingsModal={closeEditSettingsModal}
				onSaveSettings={handleSaveSettings}
				isConfirmResetSeriesModalOpen={isConfirmResetSeriesModalOpen}
				onCloseConfirmResetSeriesModal={closeConfirmResetSeriesModal}
				onConfirmResetSeries={handleConfirmResetSeries}
				isAddRegularGoalModalOpen={isAddRegularGoalModalOpen}
				onCloseAddRegularGoalModal={closeAddRegularGoalModal}
				onSaveAddSettings={handleSaveAddSettings}
			/>
		</aside>
	);
});
