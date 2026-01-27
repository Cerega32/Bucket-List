import {FC} from 'react';
import {Link} from 'react-router-dom';

import {useBem} from '@/hooks/useBem';
import {ModalStore} from '@/store/ModalStore';
import {UserStore} from '@/store/UserStore';
import {IGoal, IRegularGoalStatistics, IShortGoal, IShortList} from '@/typings/goal';
import {pluralize} from '@/utils/text/pluralize';

import {Button} from '../Button/Button';
import {Gradient} from '../Gradient/Gradient';
import {Line} from '../Line/Line';
import {Progress} from '../Progress/Progress';
import {Svg} from '../Svg/Svg';
import {Tag} from '../Tag/Tag';
import {Tags} from '../Tags/Tags';
import {Title} from '../Title/Title';

import './card.scss';

type RegularDayState = 'completed' | 'active' | 'inactive';

interface BaseCardProps {
	className?: string;
	horizontal?: boolean;
}

interface CardListProps extends BaseCardProps {
	isList: true;
	goal: IShortList;
	onClickAdd: () => Promise<void>;
	onClickDelete: () => Promise<void>;
	onClickMark?: never;
	mode?: 'default';
}

interface CardGoalProps extends BaseCardProps {
	isList?: never;
	goal: IShortGoal;
	onClickAdd: () => Promise<void>;
	onClickDelete: () => Promise<void>;
	onClickMark: () => Promise<void>;
	mode?: 'default';
}

interface CardRegularProps extends BaseCardProps {
	mode: 'regular';
	regularGoal: IGoal;
	statistics: IRegularGoalStatistics;
	onMarkRegular: () => Promise<void> | void;
}

type CardProps = CardListProps | CardGoalProps | CardRegularProps;

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
	const progress = statistics.currentPeriodProgress as any;
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
		const isAllowed = dayData.isAllowed !== false && !isBlockedByStartDate;
		const isCurrent = index === currentDayIndex;

		if (isCompleted || isSkipped) {
			return 'completed';
		}

		if (isCurrent && isAllowed && !isBlocked) {
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

export const Card: FC<CardProps> = (props) => {
	const {className, horizontal, ...restProps} = props;

	const [block, element] = useBem('card', className);

	// Режим карточки регулярной цели
	if ('mode' in restProps && restProps.mode === 'regular') {
		const {regularGoal: goal, statistics, onMarkRegular} = restProps;

		const currentProgress = getCurrentProgress(statistics);
		const isCompletedToday = !!currentProgress?.completed;
		const completionPercent = Math.round(statistics.completionPercentage || 0);
		const canCompleteToday = statistics.canCompleteToday && !isCompletedToday;

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
								const isSelected = state === 'active';
								const isCompleted = state === 'completed';

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
							<Progress done={completionPercent} all={100} goal />
						</div>
					</div>
					<Line />
					<div className={element('actions')}>
						<Button
							theme={isCompletedToday ? 'green' : 'blue'}
							onClick={canCompleteToday ? onMarkRegular : undefined}
							icon="regular"
							className={element('primary-button')}
							disabled={!canCompleteToday}
						>
							{isCompletedToday ? 'Выполнено сегодня' : 'Выполнить сегодня'}
						</Button>
					</div>
				</div>
			</section>
		);
	}

	// Обычная карточка целей/списков
	const {goal, isList, onClickAdd, onClickDelete, onClickMark} = restProps as CardListProps | CardGoalProps;

	const {isAuth} = UserStore;
	const {setIsOpen, setWindow} = ModalStore;

	const onClickAddHandler = () => {
		if (!isAuth) {
			setIsOpen(true);
			setWindow('login');
			return;
		}
		onClickAdd();
	};

	return (
		<section className={block({horizontal})}>
			<Link to={`/${isList ? 'list' : 'goals'}/${goal.code}`} className={element('gradient')}>
				<Gradient img={{src: goal.image, alt: goal.title}} category={goal.category.nameEn} show={goal.completedByUser}>
					<div className={element('img-tags')}>
						{goal.addedByUser && !goal.completedByUser && <Tag icon="watch" theme="light" />}
						{goal.completedByUser && <Tag icon="done" theme="light" classNameIcon={element('img-tag-icon-done')} />}
						<Tag text={goal.category.name} category={goal.category.nameEn} className={element('img-tag-category')} />
					</div>
				</Gradient>
			</Link>
			<div className={element('info')}>
				<Link to={`/${isList ? 'list' : 'goals'}/${goal.code}`} className={element('info-link')}>
					<Title tag="h3" className={element('title')}>
						{goal.title}
					</Title>
					<p className={element('text')}>{goal.shortDescription}</p>
				</Link>
				<Line />
				<div className={element('tags-wrapper')}>
					<Tags
						complexity={goal.complexity}
						added={goal.totalAdded}
						estimatedTime={goal.estimatedTime}
						theme="integrate"
						className={element('tags', {
							added: goal.addedByUser,
						})}
						showSeparator
					/>
					<div className={element('buttons-wrapper')}>
						{isList && 'userCompletedGoals' in goal && 'goalsCount' in goal && (
							<Progress done={goal.userCompletedGoals} all={goal.goalsCount} />
						)}
						<div className={element('buttons')}>
							{!goal.addedByUser && <Button theme="blue" icon="plus" size="small" onClick={onClickAddHandler} />}
							{goal.addedByUser && <Button theme="blue-light" icon="trash" size="small" onClick={onClickDelete} />}
							{(goal.addedByUser || goal.completedByUser) && !isList && onClickMark && (
								<Button theme={goal.completedByUser ? 'green' : 'blue-light'} size="small" onClick={onClickMark}>
									<Svg
										icon="done"
										width="16px"
										height="16px"
										className={element('btn-done', {
											active: goal.completedByUser,
										})}
									/>
								</Button>
							)}
						</div>
					</div>
				</div>
			</div>
		</section>
	);
};
