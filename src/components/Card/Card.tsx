import {type MouseEvent, FC} from 'react';
import {Link} from 'react-router-dom';

import {useBem} from '@/hooks/useBem';
import useScreenSize from '@/hooks/useScreenSize';
import {ModalStore} from '@/store/ModalStore';
import {NotificationStore} from '@/store/NotificationStore';
import {UserStore} from '@/store/UserStore';
import {IShortGoal, IShortList} from '@/typings/goal';
import {isScratchMapList, SCRATCH_MAP_PAGE_URL} from '@/utils/scratchMapList';
import {emitConfettiFromElement} from '@/utils/ui/emitConfetti';

import {Button} from '../Button/Button';
import {Gradient} from '../Gradient/Gradient';
import {Line} from '../Line/Line';
import {Progress} from '../Progress/Progress';
import {Svg} from '../Svg/Svg';
import {Tag} from '../Tag/Tag';
import {Tags} from '../Tags/Tags';
import {Title} from '../Title/Title';

import './card.scss';

interface BaseCardProps {
	className?: string;
	horizontal?: boolean;
	disableNavigation?: boolean;
	disableMark?: boolean;
	allowAddWithoutAuth?: boolean;
	skipDeleteConfirm?: boolean;
	hideActions?: boolean;
}

interface CardListProps extends BaseCardProps {
	isList: true;
	goal: IShortList;
	onClickAdd: () => Promise<void>;
	onClickDelete: () => Promise<void>;
	onClickMark?: never;
}

interface CardGoalProps extends BaseCardProps {
	isList?: never;
	goal: IShortGoal;
	onClickAdd: () => Promise<void>;
	onClickDelete: () => Promise<void>;
	onClickMark: () => Promise<void>;
}

type CardProps = CardListProps | CardGoalProps;

const isListFullyCompleted = (goal: IShortList): boolean => goal.goalsCount > 0 && goal.userCompletedGoals >= goal.goalsCount;

const isCardCompleted = (goal: IShortGoal | IShortList, isList: boolean | undefined): boolean =>
	goal.completedByUser || (!!isList && isListFullyCompleted(goal as IShortList));

export const Card: FC<CardProps> = (props) => {
	const {className, horizontal, disableNavigation, disableMark, allowAddWithoutAuth, skipDeleteConfirm, hideActions, ...restProps} =
		props;

	const [block, element] = useBem('card', className);
	const {isScreenXs} = useScreenSize();

	const {goal, isList, onClickAdd, onClickDelete, onClickMark} = restProps as CardListProps | CardGoalProps;

	const isCompleted = isCardCompleted(goal, isList);
	const showScratchMap = Boolean(isList && isScratchMapList(goal as IShortList));

	const {isAuth} = UserStore;
	const {setIsOpen, setWindow, setFuncModal, setModalProps} = ModalStore;

	const onClickAddHandler = async () => {
		if (!isAuth && !allowAddWithoutAuth) {
			setIsOpen(true);
			setWindow('login');
			return;
		}
		await onClickAdd();

		if (!isAuth) {
			NotificationStore.addNotification({
				type: 'success',
				title: 'Цель добавлена',
				message: 'Мы сохранили её, вы увидите цель в личном кабинете после завершения регистрации.',
			});
		}
	};

	const onClickDeleteHandler = async () => {
		if (!isAuth) {
			await onClickDelete();
			NotificationStore.addNotification({
				type: 'warning',
				title: 'Цель удалена',
				message: 'Мы убрали её из вашего списка.',
			});
			return;
		}

		if (skipDeleteConfirm) {
			await onClickDelete();
			return;
		}

		setModalProps({});
		setWindow(isList ? 'delete-list' : 'delete-goal');
		setIsOpen(true);
		setFuncModal(() => onClickDelete());
	};

	const onClickMarkHandler = async (e: MouseEvent<HTMLButtonElement>) => {
		const buttonEl = e.currentTarget;
		const shouldCelebrate = !isCompleted;
		await onClickMark?.();
		if (shouldCelebrate) {
			emitConfettiFromElement(buttonEl);
		}
	};

	const getProgress = () => {
		if (!isList) return null;
		if ('userCompletedGoals' in goal && 'goalsCount' in goal) {
			if (goal.goalsCount === 0 || goal.userCompletedGoals >= goal.goalsCount) {
				return null;
			}
			return `${Math.round((goal.userCompletedGoals / goal.goalsCount) * 100)}%`;
		}
		return null;
	};

	return (
		<section className={block({horizontal, list: isList})}>
			{disableNavigation ? (
				<div className={element('gradient')}>
					<Gradient img={{src: goal.image, alt: goal.title}} category={goal.category.nameEn} show={isCompleted}>
						<div className={element('img-tags-wrapper')}>
							<div className={element('img-tags')}>
								{goal.addedByUser &&
									!isCompleted &&
									(() => {
										const progress = getProgress();
										return (
											<Tag
												icon="watch"
												theme="blue"
												classNameIcon={element('img-tag-icon-done')}
												title={progress ? `В процессе ${progress}` : 'В процессе'}
												text={progress ?? undefined}
											/>
										);
									})()}
								{isCompleted && (
									<Tag icon="done" theme="green" classNameIcon={element('img-tag-icon-done')} title="Выполнено" />
								)}
								{!isList && goal.regularConfig && (
									<Tag
										icon={goal.completedByUser ? 'regular' : 'regular-empty'}
										theme="gold"
										classNameIcon={element('img-tag-icon-done')}
										title="Регулярная цель"
									/>
								)}
								{showScratchMap && (
									<Tag
										icon="map"
										theme="green"
										classNameIcon={element('img-tag-icon-done')}
										title="Интерактивная скретч-карта в профиле"
									/>
								)}
								<Tag text={goal.category.name} category={goal.category.nameEn} className={element('img-tag-category')} />
							</div>
							{goal.catalogApproved === false && (
								<Tag
									text="Ожидает проверки"
									theme="gray"
									className={element('img-tag-pending')}
									title="Ожидает публикации в каталоге"
								/>
							)}
						</div>
					</Gradient>
				</div>
			) : (
				<Link to={`/${isList ? 'list' : 'goals'}/${goal.code}`} className={element('gradient')}>
					<Gradient img={{src: goal.image, alt: goal.title}} category={goal.category.nameEn} show={isCompleted}>
						<div className={element('img-tags-wrapper')}>
							<div className={element('img-tags')}>
								{goal.addedByUser &&
									!isCompleted &&
									(() => {
										const progress = getProgress();
										return (
											<Tag
												icon="watch"
												theme="blue"
												classNameIcon={element('img-tag-icon-done')}
												title={progress ? `В процессе ${progress}` : 'В процессе'}
												text={progress ?? undefined}
											/>
										);
									})()}
								{isCompleted && (
									<Tag icon="done" theme="green" classNameIcon={element('img-tag-icon-done')} title="Выполнено" />
								)}
								{!isList && goal.regularConfig && (
									<Tag
										icon={goal.completedByUser ? 'regular' : 'regular-empty'}
										theme="gold"
										classNameIcon={element('img-tag-icon-done')}
										title="Регулярная цель"
									/>
								)}
								{showScratchMap && (
									<Tag
										icon="map"
										theme="green"
										classNameIcon={element('img-tag-icon-done')}
										title="Интерактивная скретч-карта в профиле"
									/>
								)}
								<Tag text={goal.category.name} category={goal.category.nameEn} className={element('img-tag-category')} />
							</div>
							{goal.catalogApproved === false && (
								<Tag
									text="Ожидает проверки"
									theme="gray"
									className={element('img-tag-pending')}
									title="Ожидает публикации в каталоге"
								/>
							)}
						</div>
					</Gradient>
				</Link>
			)}
			<div className={element('info')}>
				{disableNavigation ? (
					<div className={element('info-link')}>
						<Title tag="h3" className={element('title')}>
							{goal.title}
						</Title>
						<p className={element('text')}>{goal.shortDescription}</p>
					</div>
				) : (
					<Link to={`/${isList ? 'list' : 'goals'}/${goal.code}`} className={element('info-link')}>
						<Title tag="h3" className={element('title')}>
							{goal.title}
						</Title>
						<p className={element('text')}>{goal.shortDescription}</p>
					</Link>
				)}
				<div className={element('down-wrapper')}>
					<Line />
					<div className={element('tags-wrapper')}>
						<Tags
							complexity={goal.complexity}
							added={goal.totalAdded}
							estimatedTime={goal.estimatedTime}
							listTotal={isList && 'goalsCount' in goal ? goal.goalsCount : undefined}
							onlyCount
							theme="integrate"
							className={element('tags', {
								added: goal.addedByUser,
							})}
							showSeparator
						/>
						<div className={element('buttons-wrapper')}>
							{isList && goal.addedByUser && 'userCompletedGoals' in goal && 'goalsCount' in goal && (
								<Progress done={goal.userCompletedGoals} all={goal.goalsCount} />
							)}
							{showScratchMap && (
								<Button theme="blue-light" icon="map" size="small" type="Link" href={SCRATCH_MAP_PAGE_URL} />
							)}
							{(() => {
								const showAddButton = !hideActions && !goal.addedByUser;
								const showDeleteButton = !hideActions && goal.addedByUser && !(isList && goal.code === '100-goals');
								const isRegularGoal = !isList && 'regularConfig' in goal && !!goal.regularConfig;
								const showMarkButton =
									!hideActions &&
									!disableMark &&
									!isRegularGoal &&
									(goal.addedByUser || goal.completedByUser) &&
									!isList &&
									typeof onClickMark === 'function';

								if (!showAddButton && !showDeleteButton && !showMarkButton) {
									return null;
								}

								return (
									<div className={element('buttons')}>
										{showAddButton &&
											(isScreenXs ? (
												<Button theme="blue" size="small" onClick={onClickAddHandler}>
													Добавить
												</Button>
											) : (
												<Button theme="blue" icon="plus" size="small" onClick={onClickAddHandler} />
											))}
										{showDeleteButton &&
											(isScreenXs ? (
												<Button theme="blue-light" size="small" onClick={onClickDeleteHandler}>
													Удалить
												</Button>
											) : (
												<Button theme="blue-light" icon="trash" size="small" onClick={onClickDeleteHandler} />
											))}
										{showMarkButton &&
											(isScreenXs ? (
												<Button
													theme={goal.completedByUser ? 'green' : 'blue'}
													size="small"
													onClick={onClickMarkHandler}
												>
													{goal.completedByUser ? 'Выполнено' : 'Выполнить'}
												</Button>
											) : (
												<Button
													theme={goal.completedByUser ? 'green' : 'blue-light'}
													size="small"
													onClick={onClickMarkHandler}
												>
													<Svg
														icon="done"
														width="16px"
														height="16px"
														className={element('btn-done', {
															active: goal.completedByUser,
														})}
													/>
												</Button>
											))}
									</div>
								);
							})()}
						</div>
					</div>
				</div>
			</div>
		</section>
	);
};
