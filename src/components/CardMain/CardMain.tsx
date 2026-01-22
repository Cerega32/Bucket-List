import {FC} from 'react';
import {Link} from 'react-router-dom';

import {useBem} from '@/hooks/useBem';
import {IShortGoal} from '@/typings/goal';

import {Button} from '../Button/Button';
import {Gradient} from '../Gradient/Gradient';
import {Line} from '../Line/Line';
import {Tag} from '../Tag/Tag';
import {Title} from '../Title/Title';

import './card-main.scss';

interface CardMainProps {
	className?: string;
	goal: IShortGoal;
	big?: boolean;
	withBtn?: boolean;
	updateGoal?: () => void;
	colored?: boolean;
}
export const CardMain: FC<CardMainProps> = (props) => {
	const {className, goal, big, withBtn, updateGoal, colored} = props;

	const [block, element] = useBem('card-main', className);

	const handleButtonClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
		event.preventDefault();
		if (updateGoal) {
			updateGoal();
		}
	};

	return (
		<section className={block({big, withBtn})}>
			<Link to={`/goals/${goal.code}`} className={element('gradient')}>
				<Gradient
					img={{src: goal.image, alt: goal.title}}
					category={goal.category.nameEn}
					blacked={!colored && !goal.completedByUser}
					withBlack={goal.completedByUser}
				>
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
							{withBtn && (
								<>
									<Line className={element('line')} />
									<Button
										className={element('btn')}
										icon="done"
										theme={goal.completedByUser ? 'green' : 'blue'}
										onClick={handleButtonClick}
									>
										Выполнено
									</Button>
								</>
							)}
						</div>
					</div>
				</Gradient>
			</Link>
		</section>
	);
};
