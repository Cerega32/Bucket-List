import {FC} from 'react';
import {Link} from 'react-router-dom';

import {Gradient} from '../Gradient/Gradient';
import {Tag} from '../Tag/Tag';

import {Title} from '../Title/Title';

import {useBem} from '@/hooks/useBem';
import {IShortGoal} from '@/typings/goal';

import './card-main.scss';

interface CardMainProps {
	className?: string;
	goal: IShortGoal;
	big?: boolean;
}

export const CardMain: FC<CardMainProps> = (props) => {
	const {className, goal, big} = props;

	const [block, element] = useBem('card-main', className);

	return (
		<section className={block({big})}>
			<Link to={`/goals/${goal.code}`} className={element('gradient')}>
				<Gradient img={{src: goal.image, alt: goal.title}} category={goal.category.nameEn} blacked={!goal.completedByUser}>
					<div className={element('info')}>
						<div className={element('img-tags')}>
							{goal.completedByUser && <Tag icon="done" theme="light" classNameIcon={element('img-tag-icon-done')} />}
							<Tag text={goal.category.name} category={goal.category.nameEn} className={element('img-tag-category')} />
						</div>
						<div>
							<Title tag="h3" className={element('title')} theme="white">
								{goal.title}
							</Title>
							<p className={element('text')}>{goal.shortDescription}</p>
						</div>
					</div>
				</Gradient>
			</Link>
			{/* <div className={element('info')}>
				<Line />
				<div className={element('tags-wrapper')}>
					<div className={element('buttons')}>
						{!goal.addedByUser && <Button theme="blue" icon="plus" size="small" onClick={onClickAdd} />}
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
			</div> */}
		</section>
	);
};
