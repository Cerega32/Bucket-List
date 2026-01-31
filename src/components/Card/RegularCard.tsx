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

type RegularDayState = 'completed' | 'active' | 'inactive' | 'blocked';

interface RegularCardPropsBase {
	className?: string;
	horizontal?: boolean;
}

interface RegularCardPropsRegular extends RegularCardPropsBase {
	variant?: 'regular';
	regularGoal: IGoal;
	statistics: IRegularGoalStatistics;
	onMarkRegular: () => Promise<void> | void;
	progressGoal?: never;
	onOpenProgressModal?: never;
	// onMarkCompleted?: never;
}

interface RegularCardPropsProgress extends RegularCardPropsBase {
	variant: 'progress';
	progressGoal: IGoalProgress;
	onOpenProgressModal: () => void;
	onMarkToday: () => void;
	// onMarkCompleted: () => void;
	regularGoal?: never;
	statistics?: never;
	onMarkRegular?: never;
}

type RegularCardProps = RegularCardPropsRegular | RegularCardPropsProgress;

const WEEK_DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const getCurrentDayOfWeek = (): number => {
	const today = new Date();
	const day = today.getDay();
	return day === 0 ? 6 : day - 1;
};

const getSeriesText = (statistics: IRegularGoalStatistics): string => {
	const value = statistics.currentStreak || 0;
	const isWeekly = statistics.currentPeriodProgress?.type === 'weekly';

	if (isWeekly) {
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

	return 'Текущая серия';
};

const getSeriesIcon = (statistics: IRegularGoalStatistics): string => {
	const hasValue = (statistics.currentStreak || 0) > 0;

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
		const isCompleted = !isBlockedByStartDate && (dayData.isCompleted || false);
		const isSkipped = !isBlockedByStartDate && (dayData.isSkipped || false);
		const isCurrent = index === currentDayIndex;

		if (isCompleted || isSkipped) {
			return 'completed';
		}

		// Заблокированные по расписанию дни показываем как blocked (для крестика),
		// но подсветку текущего дня будем решать в JSX.
		if (isBlocked && !isBlockedByStartDate) {
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

const getCurrentProgress = (statistics: IRegularGoalStatistics) => {
	if (!statistics.currentPeriodProgress) return null;

	const progress = statistics.currentPeriodProgress;

	if (progress.type === 'daily') {
		return {
			completed: progress.completedToday || false,
			text: progress.completedToday ? 'Выполнено сегодня' : 'Не выполнено сегодня',
			streak: progress.streak || 0,
		};
	}

	if (progress.type === 'weekly') {
		return {
			completed: (progress.currentWeekCompletions || 0) >= (progress.requiredPerWeek || 1),
			text: `${progress.currentWeekCompletions || 0} из ${progress.requiredPerWeek || 1} на этой неделе`,
			progress: progress.weekProgress || 0,
		};
	}

	return null;
};

// --- Progress variant helpers ---
const getProgressSeriesText = (progress: IGoalProgress): string => {
	const entries = progress.recentEntries || progress.entries || [];
	const markedCount = new Set(entries.map((e) => e.date.split('T')[0])).size;
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
	const entries = progress.recentEntries || progress.entries || [];
	const entryDates = new Set(entries.map((e) => e.date.split('T')[0]));

	const now = new Date();
	const startOfWeek = new Date(now);
	startOfWeek.setDate(now.getDate() - ((now.getDay() || 7) - 1));
	const dayDate = new Date(startOfWeek);
	dayDate.setDate(startOfWeek.getDate() + index);
	const dateStr = formatLocalDate(dayDate);

	const hasEntry = entryDates.has(dateStr);
	const isToday = index === currentDayIndex;

	if (hasEntry) return 'completed';
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

	const {regularGoal: goal, statistics, onMarkRegular} = props;
	const currentProgress = getCurrentProgress(statistics);
	const isCompletedToday = !!currentProgress?.completed;
	const completionPercent = Math.round(statistics.completionPercentage || 0);
	const currentDayIndex = getCurrentDayOfWeek();
	const isBlockedOrUnavailableToday = !statistics.canCompleteToday && !isCompletedToday;

	return (
		<section className={block({horizontal, regular: true})}>
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
							const isBlocked = state === 'blocked';
							const isSelected = state === 'active' || (isBlocked && isToday);

							return (
								<div key={day} className={element('series-day-wrapper')}>
									<div
										className={element('series-day', {
											selected: isSelected && !isCompleted,
											blocked: isBlocked,
											completed: isCompleted,
										})}
									>
										{isCompleted && <Svg icon="done" className={element('series-day-icon-selected')} />}
										{!isCompleted && isBlocked && <Svg icon="cross" className={element('series-day-icon')} />}
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
						theme={isCompletedToday ? 'green' : isBlockedOrUnavailableToday ? 'blue-light' : 'blue'}
						onClick={isBlockedOrUnavailableToday ? undefined : onMarkRegular}
						icon={isBlockedOrUnavailableToday ? undefined : 'regular'}
						className={element('primary-button')}
						disabled={isBlockedOrUnavailableToday}
						hoverContent={isCompletedToday ? 'Отменить выполнение' : undefined}
						hoverIcon={isCompletedToday ? 'cross' : undefined}
					>
						{isCompletedToday
							? 'Выполнено сегодня'
							: isBlockedOrUnavailableToday
							? 'Сегодня выполнить цель нельзя'
							: 'Выполнить сегодня'}
					</Button>
				</div>
			</div>
		</section>
	);
};
