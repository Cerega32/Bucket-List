import {FC} from 'react';
import {Link} from 'react-router-dom';

import {useBem} from '@/hooks/useBem';
import {IGoal, IRegularGoalStatistics} from '@/typings/goal';
import {IGoalProgress} from '@/utils/api/goals';
import {pluralize} from '@/utils/text/pluralize';

import {Button} from '../Button/Button';
import {Line} from '../Line/Line';
import {Progress} from '../Progress/Progress';
import {Svg} from '../Svg/Svg';
import {Tag} from '../Tag/Tag';
import {Title} from '../Title/Title';

import './card.scss';

type RegularDayState = 'completed' | 'allowedSkip' | 'active' | 'inactive' | 'blocked';

interface RegularCardPropsBase {
	className?: string;
	horizontal?: boolean;
}

interface RegularCardPropsRegular extends RegularCardPropsBase {
	variant?: 'regular';
	regularGoal: IGoal;
	statistics: IRegularGoalStatistics;
	onMarkRegular: () => Promise<void> | void;
	onRestart?: () => Promise<void> | void;
	progressGoal?: never;
	onOpenProgressModal?: never;
	// onMarkCompleted?: never;
}

interface RegularCardPropsProgress extends RegularCardPropsBase {
	variant: 'progress';
	progressGoal: IGoalProgress;
	onOpenProgressModal: () => void;
	onMarkToday: () => void;
	onMarkCompleted?: () => void | Promise<void>;
	regularGoal?: never;
	statistics?: never;
	onMarkRegular?: never;
}

type RegularCardProps = RegularCardPropsRegular | RegularCardPropsProgress;

const WEEK_DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const REGULAR_CUSTOM_DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

const getCurrentDayOfWeek = (): number => {
	const today = new Date();
	const day = today.getDay();
	return day === 0 ? 6 : day - 1;
};

const getSeriesText = (statistics: IRegularGoalStatistics): string => {
	const isWeeksDuration = statistics.regularGoalData?.durationType === 'weeks';
	let current = statistics.currentStreak || 0;
	const max = statistics.maxStreak || 0;

	// Для завершённой серии используем completedWeeks/totalCompletions
	if (statistics.isSeriesCompleted) {
		if (isWeeksDuration) {
			current = statistics.completedWeeks > 0 ? statistics.completedWeeks : current;
		} else {
			current = statistics.totalCompletions > 0 ? statistics.totalCompletions : current;
		}
	}

	const value = max > current ? max : current;

	if (isWeeksDuration) {
		return pluralize(value, ['неделя', 'недели', 'недель']);
	}

	return pluralize(value, ['день', 'дня', 'дней']);
};

const getSeriesTitle = (statistics: IRegularGoalStatistics): string => {
	if (statistics.isSeriesCompleted) {
		return 'Серия выполнена';
	}

	if (statistics.isInterrupted) {
		return 'Серия прервана';
	}

	const current = statistics.currentStreak || 0;
	const max = statistics.maxStreak || 0;
	if (max > current) {
		return 'Макс. серия';
	}

	return 'Текущая серия';
};

const getSeriesIcon = (statistics: IRegularGoalStatistics): string => {
	const current = statistics.currentStreak || 0;
	const max = statistics.maxStreak || 0;
	const hasValue = current > 0 || max > 0;

	if (statistics.isSeriesCompleted) {
		return 'regular-checked';
	}

	if (statistics.isInterrupted) {
		return 'regular-cancel';
	}

	if (hasValue) {
		return 'regular';
	}

	return 'regular-empty';
};

const getWeekDayState = (statistics: IRegularGoalStatistics, index: number): RegularDayState => {
	const progress = statistics.currentPeriodProgress;
	if (!progress) return 'inactive';

	const currentDayIndex = getCurrentDayOfWeek();
	const weekDays = Array.isArray(progress.weekDays) ? progress.weekDays : null;

	// Если есть подробные данные по дням недели - используем их (та же логика, что и в AsideGoal)
	if (weekDays && weekDays.length > 0) {
		const dayData = weekDays.find(
			(d: {
				dayIndex: number;
				isCompleted?: boolean;
				isBlocked?: boolean;
				isBlockedByStartDate?: boolean;
				isSkipped?: boolean;
				isAllowed?: boolean;
			}) => d.dayIndex === index
		);

		if (!dayData) return 'inactive';

		const isBlockedByStartDate = dayData.isBlockedByStartDate || false;
		const isBlocked = dayData.isBlocked || false;
		const cs = statistics.regularGoalData?.customSchedule;
		let blockedCross = isBlocked && !isBlockedByStartDate;
		if (progress.type === 'custom' && cs && typeof cs === 'object') {
			const inSchedule = cs[REGULAR_CUSTOM_DAY_KEYS[index]] === true;
			blockedCross = !inSchedule || !!isBlocked;
		}
		const isCompleted = !isBlockedByStartDate && (dayData.isCompleted || false);
		const isSkipped = !isBlockedByStartDate && (dayData.isSkipped || false);
		const isCurrent = index === currentDayIndex;

		if (isSkipped) {
			return 'allowedSkip';
		}

		if (isCompleted) {
			return 'completed';
		}

		// custom: крестик для дня вне графика всегда (даже до start_date, где API даёт isBlocked=false)
		if (blockedCross) {
			return 'blocked';
		}

		// Текущий день считаем активным, если он не заблокирован по дате начала.
		if (isCurrent && !isBlockedByStartDate) {
			return 'active';
		}

		return 'inactive';
	}

	// Fallback, когда weekDays нет (упрощённая логика)
	if (progress.type === 'daily') {
		if (index !== currentDayIndex) return 'inactive';
		return progress.completedToday ? 'completed' : 'active';
	}

	if (progress.type === 'weekly') {
		const required = progress.requiredPerWeek || 1;
		const completed = progress.currentWeekCompletions || 0;

		if (index < completed) return 'completed';
		if (index < required) return 'active';
		return 'inactive';
	}

	return 'inactive';
};

// --- Progress variant helpers ---
const getProgressSeriesText = (progress: IGoalProgress): string => {
	if (typeof progress.workedDaysCount === 'number') {
		if (progress.workedDaysCount === 0) return '—';
		return pluralize(progress.workedDaysCount, ['день', 'дня', 'дней']);
	}
	const entries = progress.recentEntries || progress.entries || [];
	const byDate = new Map<string, boolean>();
	entries.forEach((e) => {
		const key = e.date.split('T')[0];
		if (!key) return;
		const wd = e.workDone ?? false;
		byDate.set(key, (byDate.get(key) ?? false) || wd);
	});
	const markedCount = [...byDate.values()].filter(Boolean).length;
	if (markedCount === 0) return '—';
	return pluralize(markedCount, ['день', 'дня', 'дней']);
};

const formatLocalDate = (d: Date): string => {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
};

const getProgressWeekDayState = (progress: IGoalProgress, index: number): RegularDayState => {
	const currentDayIndex = getCurrentDayOfWeek();
	if (progress.weekWorkDone && progress.weekWorkDone.length === 7) {
		const hasWorked = progress.weekWorkDone[index] ?? false;
		const isToday = index === currentDayIndex;
		if (hasWorked) return 'completed';
		if (isToday && progress.isWorkingToday) return 'active';
		if (isToday) return 'active';
		return 'inactive';
	}
	const entries = progress.recentEntries || progress.entries || [];

	const now = new Date();
	const startOfWeek = new Date(now);
	startOfWeek.setDate(now.getDate() - ((now.getDay() || 7) - 1));
	const dayDate = new Date(startOfWeek);
	dayDate.setDate(startOfWeek.getDate() + index);
	const dateStr = formatLocalDate(dayDate);

	const hasWorked = entries.some((e) => e.date.split('T')[0] === dateStr && (e.workDone ?? false));
	const isToday = index === currentDayIndex;

	if (hasWorked) return 'completed';
	if (isToday && progress.isWorkingToday) return 'active';
	if (isToday) return 'active';
	return 'inactive';
};

export const RegularCard: FC<RegularCardProps> = (props) => {
	const {className, horizontal, variant} = props;
	const [block, element] = useBem('card', className);
	const isProgress = variant === 'progress';

	if (isProgress) {
		const {progressGoal: goal, onOpenProgressModal, onMarkToday} = props;
		const currentDayIndex = getCurrentDayOfWeek();
		const percent = Math.round(goal.progressPercentage);

		return (
			<section className={block({horizontal, regular: true})}>
				<Link to={`/goals/${goal.goalCode}`} className={element('image-wrapper')}>
					<img src={goal.goalImage} alt={goal.goalTitle} className={element('image')} />
					<Tag text={goal.goalCategory} category={goal.goalCategoryNameEn} className={element('category-badge')} />
				</Link>
				<div className={element('body')}>
					<Link to={`/goals/${goal.goalCode}`} className={element('info-link')}>
						<Title tag="h3" className={element('title-regular')}>
							{goal.goalTitle}
						</Title>
					</Link>
					<Line />
					<div className={element('series')}>
						<div className={element('series-header')}>
							<div className={element('series-title')}>
								<Svg icon="signal" className={element('series-icon', {progress: true})} />
								<span>Прогресс</span>
							</div>
							<span className={element('series-value')}>{getProgressSeriesText(goal)}</span>
						</div>
						<div className={element('series-days')}>
							{WEEK_DAYS.map((day, index) => {
								const state = getProgressWeekDayState(goal, index);
								const isToday = index === currentDayIndex;
								const isCompleted = state === 'completed';
								const isSelected = state === 'active' || isToday;

								return (
									<div key={day} className={element('series-day-wrapper')}>
										<div
											className={element('series-day', {
												selected: isSelected && !isCompleted,
												completed: isCompleted,
											})}
										>
											{isCompleted && <Svg icon="done" className={element('series-day-icon-selected')} />}
										</div>
										<span
											className={element('series-day-name', {
												selected: isSelected,
											})}
										>
											{day}
										</span>
									</div>
								);
							})}
						</div>
					</div>
					<Line />
					<div className={element('progress-block')}>
						<div className={element('progress-header')}>
							<span className={element('progress-label')}>Прогресс:</span>
							<Progress done={percent} all={100} goal />
						</div>
					</div>
					<Line />
					<div className={element('actions')}>
						<Button
							theme={goal.isWorkingToday ? 'green' : 'blue'}
							onClick={onMarkToday}
							icon={goal.isWorkingToday ? 'regular' : 'regular-empty'}
							className={element('primary-button')}
							hoverContent={goal.isWorkingToday ? 'Снять отметку' : undefined}
							hoverIcon={goal.isWorkingToday ? 'cross' : undefined}
						>
							{goal.isWorkingToday ? 'Отмечено сегодня' : 'Отметить сегодня'}
						</Button>
						<Button theme="blue-light" onClick={onOpenProgressModal} icon="signal">
							Изменить прогресс
						</Button>
					</div>
				</div>
			</section>
		);
	}

	const {regularGoal: goal, statistics, onMarkRegular, onRestart} = props;
	const isInterrupted = !!statistics.isInterrupted;
	const completionPercent = Math.round(statistics.completionPercentage || 0);
	const currentDayIndex = getCurrentDayOfWeek();

	// Логика как в AsideGoal:
	// 1. Заблокировано по расписанию (custom, isAllowed === false) → "Сегодня нельзя"
	// 2. daily → completedToday, weekly/custom → !canCompleteToday → "Выполнено"
	const progress = statistics.currentPeriodProgress;
	const isBlockedBySchedule = (() => {
		if (progress?.type !== 'custom') return false;
		const weekDays = Array.isArray(progress.weekDays) ? progress.weekDays : null;
		if (!weekDays) return false;
		const todayData = weekDays.find((d: {dayIndex: number}) => d.dayIndex === currentDayIndex);
		return todayData?.isAllowed === false;
	})();
	const isCompletedToday = isBlockedBySchedule
		? false
		: progress?.type === 'daily'
		? !!progress.completedToday
		: !statistics.canCompleteToday;
	const isBlockedOrUnavailableToday = isBlockedBySchedule;

	return (
		<section className={block({horizontal, regular: true, interrupted: isInterrupted})}>
			<Link to={`/goals/${goal.code}`} className={element('image-wrapper')}>
				<img src={goal.image} alt={goal.title} className={element('image')} />
				<Tag text={goal.category.name} category={goal.category.nameEn} className={element('category-badge')} />
			</Link>
			<div className={element('body')}>
				<Link to={`/goals/${goal.code}`} className={element('info-link')}>
					<Title tag="h3" className={element('title-regular')}>
						{goal.title}
					</Title>
				</Link>
				<Line />
				<div className={element('series')}>
					<div className={element('series-header')}>
						<div className={element('series-title')}>
							<Svg icon={getSeriesIcon(statistics)} className={element('series-icon')} />
							<span>{getSeriesTitle(statistics)}</span>
						</div>
						<span className={element('series-value')}>{getSeriesText(statistics)}</span>
					</div>
					<div className={element('series-days')}>
						{WEEK_DAYS.map((day, index) => {
							const state = getWeekDayState(statistics, index);
							const isToday = index === currentDayIndex;
							const isCompleted = state === 'completed';
							const isAllowedSkip = state === 'allowedSkip';
							const isBlocked = state === 'blocked';
							const isSelected = state === 'active' || (isBlocked && isToday);

							return (
								<div key={day} className={element('series-day-wrapper')}>
									<div
										className={element('series-day', {
											selected: isSelected && !isCompleted,
											blocked: isBlocked,
											completed: isCompleted,
											skipped: isAllowedSkip,
										})}
									>
										{(isCompleted || isAllowedSkip) && (
											<Svg icon="done" className={element('series-day-icon-selected')} />
										)}
										{!isCompleted && !isAllowedSkip && isBlocked && (
											<Svg icon="cross" className={element('series-day-icon')} />
										)}
									</div>
									<span
										className={element('series-day-name', {
											selected: isSelected,
										})}
									>
										{day}
									</span>
								</div>
							);
						})}
					</div>
				</div>
				<Line />
				<div className={element('progress-block')}>
					<div className={element('progress-header')}>
						<span className={element('progress-label')}>Прогресс:</span>
						<Progress done={completionPercent} all={100} goal />
					</div>
				</div>
				<Line />
				<div className={element('actions')}>
					<Button
						theme={isInterrupted ? 'blue' : isCompletedToday ? 'green' : isBlockedOrUnavailableToday ? 'blue-light' : 'blue'}
						onClick={isInterrupted && onRestart ? onRestart : isBlockedOrUnavailableToday ? undefined : onMarkRegular}
						icon={isInterrupted && onRestart ? 'regular-empty' : isBlockedOrUnavailableToday ? undefined : 'regular'}
						className={element('primary-button')}
						disabled={!isInterrupted && isBlockedOrUnavailableToday}
						hoverContent={isCompletedToday && !isInterrupted ? 'Отменить выполнение' : undefined}
						hoverIcon={isCompletedToday && !isInterrupted ? 'cross' : undefined}
					>
						{isInterrupted && onRestart
							? 'Начать заново'
							: isCompletedToday
							? 'Выполнено сегодня'
							: isBlockedOrUnavailableToday
							? 'Сегодня нельзя выполнить'
							: 'Выполнить сегодня'}
					</Button>
				</div>
			</div>
		</section>
	);
};
