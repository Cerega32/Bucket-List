import {forwardRef} from 'react';

import {useBem} from '@/hooks/useBem';
import useScreenSize from '@/hooks/useScreenSize';
import {ICategory, IGoal} from '@/typings/goal';
import './header-goal.scss';

import {TitleWithTags} from '../TitleWithTags/TitleWithTags';

interface HeaderGoalProps {
	className?: string;
	title: string;
	category: ICategory;
	image: string;
	goal: IGoal;
	background: string;
	shrink: boolean;
}

export const HeaderGoal = forwardRef<HTMLElement, HeaderGoalProps>((props, ref) => {
	const {className, title, category, image, goal, background, shrink} = props;
	const [block, element] = useBem('header-goal', className);
	const {isScreenMobile, isScreenSmallTablet} = useScreenSize();

	return (
		<header ref={ref} className={block({category: category.nameEn, shrink})} style={{backgroundImage: `url(${background})`}}>
			{(isScreenMobile || isScreenSmallTablet) && <img src={image} alt={title} className={element('image')} />}
			<TitleWithTags
				category={category}
				complexity={goal.complexity}
				totalCompleted={goal.totalCompleted}
				title={title}
				className={element('wrapper')}
				short={shrink}
				categoryRank={goal.categoryRank}
			/>
		</header>
	);
});

HeaderGoal.displayName = 'HeaderGoal';
