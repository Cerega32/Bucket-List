import {FC} from 'react';
import {useBem} from '@/hooks/useBem';
import './header-goal.scss';
import {TitleWithTags} from '../TitleWithTags/TitleWithTags';
import {ICategory, IGoal} from '@/typings/goal';

interface HeaderGoalProps {
	className?: string;
	title: string;
	category: ICategory;
	image: string;
	goal: IGoal;
}

export const HeaderGoal: FC<HeaderGoalProps> = (props) => {
	const {className, title, category, image, goal} = props;

	const [block, element] = useBem('header-goal', className);
	console.log(category);
	return (
		<header
			className={block({category: category.nameEn})}
			style={{backgroundImage: `url(${image})`}}
		>
			<TitleWithTags
				category={category}
				complexity={goal.complexity}
				totalCompleted={goal.totalCompleted}
				title={title}
				className={element('wrapper')}
			/>
		</header>
	);
};
