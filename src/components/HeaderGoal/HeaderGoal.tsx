import {FC} from 'react';
import {useBem} from '@/hooks/useBem';
import './header-goal.scss';

interface HeaderGoalProps {
	className?: string;
	title: string;
	category: string;
	image: string;
}

export const HeaderGoal: FC<HeaderGoalProps> = (props) => {
	const {className, title, category, image} = props;

	const [block, element] = useBem('header-goal', className);

	return (
		<header
			className={block({category})}
			style={{backgroundImage: `url(${image})`}}
		>
			<div className={element('wrapper')}>
				<h1 className={element('title')}>{title}</h1>
				<div>Путешествия</div>
			</div>
		</header>
	);
};
