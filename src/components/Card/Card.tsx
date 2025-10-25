import {FC} from 'react';
import {Link} from 'react-router-dom';

import {useBem} from '@/hooks/useBem';
import {ModalStore} from '@/store/ModalStore';
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

interface CardProps {
	className?: string;
	horizontal?: boolean;
	onClickAdd: () => Promise<void>;
	onClickDelete: () => Promise<void>;
}

interface CardListProps extends CardProps {
	isList: true;
	goal: IShortList;
	onClickMark?: never;
}

interface CardGoalProps extends CardProps {
	isList?: never;
	goal: IShortGoal;
	onClickMark: () => Promise<void>;
}

export const Card: FC<CardListProps | CardGoalProps> = (props) => {
	const {className, goal, horizontal, isList, onClickAdd, onClickDelete, onClickMark} = props;

	const [block, element] = useBem('card', className);

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
					{isList && <Progress done={goal.userCompletedGoals} all={goal.goalsCount} />}
					<div className={element('buttons')}>
						{!goal.addedByUser && <Button theme="blue" icon="plus" size="small" onClick={onClickAddHandler} />}
						{goal.addedByUser && <Button theme="blue-light" icon="trash" size="small" onClick={onClickDelete} />}
						{(goal.addedByUser || goal.completedByUser) && !isList && (
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
		</section>
	);
};
