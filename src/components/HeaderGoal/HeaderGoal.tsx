import {FC} from 'react';
import {useBem} from '@/hooks/useBem';
import './header-goal.scss';
import {TitleWithTags} from '../TitleWithTags/TitleWithTags';
import {IGoal} from '@/typings/goal';

interface HeaderGoalProps {
	className?: string;
	title: string;
	category: string;
	image: string;
	goal: IGoal;
}

export const HeaderGoal: FC<HeaderGoalProps> = (props) => {
	const {className, title, category, image, goal} = props;

	const [block, element] = useBem('header-goal', className);

	return (
		<header
			className={block({category})}
			style={{backgroundImage: `url(${image})`}}
		>
			<TitleWithTags
				category={goal.category}
				complexity={goal.complexity}
				totalCompleted={goal.totalCompleted}
				title={title}
				className={element('wrapper')}
			/>
		</header>
	);
};
