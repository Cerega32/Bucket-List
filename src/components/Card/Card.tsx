import {FC} from 'react';
import {Link} from 'react-router-dom';

import {useBem} from '@/hooks/useBem';
import useScreenSize from '@/hooks/useScreenSize';
import {ModalStore} from '@/store/ModalStore';
import {NotificationStore} from '@/store/NotificationStore';
import {UserStore} from '@/store/UserStore';
import {IShortGoal, IShortList} from '@/typings/goal';

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

export const Card: FC<CardProps> = (props) => {
	const {className, horizontal, disableNavigation, disableMark, allowAddWithoutAuth, ...restProps} = props;

	const [block, element] = useBem('card', className);
	const {isScreenXs} = useScreenSize();

	const {goal, isList, onClickAdd, onClickDelete, onClickMark} = restProps as CardListProps | CardGoalProps;

	const {isAuth} = UserStore;
	const {setIsOpen, setWindow} = ModalStore;

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
		await onClickDelete();

		if (!isAuth) {
			NotificationStore.addNotification({
				type: 'warning',
				title: 'Цель удалена',
				message: 'Мы убрали её из вашего списка.',
			});
		}
	};

	const getProgress = () => {
		if (!isList) return null;
		if ('userCompletedGoals' in goal && 'goalsCount' in goal) {
			return `${Math.round((goal.userCompletedGoals / goal.goalsCount) * 100)}%`;
		}
		return null;
	};

	return (
		<section className={block({horizontal, list: isList})}>
			{disableNavigation ? (
				<div className={element('gradient')}>
					<Gradient img={{src: goal.image, alt: goal.title}} category={goal.category.nameEn} show={goal.completedByUser}>
						<div className={element('img-tags-wrapper')}>
							<div className={element('img-tags')}>
								{goal.addedByUser &&
									!goal.completedByUser &&
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
								{goal.completedByUser && (
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
					<Gradient img={{src: goal.image, alt: goal.title}} category={goal.category.nameEn} show={goal.completedByUser}>
						<div className={element('img-tags-wrapper')}>
							<div className={element('img-tags')}>
								{goal.addedByUser &&
									!goal.completedByUser &&
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
								{goal.completedByUser && (
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
						{isList && goal.addedByUser && 'userCompletedGoals' in goal && 'goalsCount' in goal && (
							<Progress done={goal.userCompletedGoals} all={goal.goalsCount} />
						)}
						{(() => {
							const showAddButton = !goal.addedByUser;
							const showDeleteButton = goal.addedByUser && !(isList && goal.code === '100-goals');
							const isRegularGoal = !isList && 'regularConfig' in goal && !!goal.regularConfig;
							const showMarkButton =
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
											<Button theme={goal.completedByUser ? 'green' : 'blue'} size="small" onClick={onClickMark}>
												{goal.completedByUser ? 'Выполнено' : 'Выполнить'}
											</Button>
										) : (
											<Button
												theme={goal.completedByUser ? 'green' : 'blue-light'}
												size="small"
												onClick={onClickMark}
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
		</section>
	);
};
