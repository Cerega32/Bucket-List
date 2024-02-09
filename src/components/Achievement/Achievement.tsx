import {FC} from 'react';

import {Title} from '../Title/Title';

import {useBem} from '@/hooks/useBem';
import './achievement.scss';
import {IAchievement} from '@/typings/achievements';

interface AchievementProps {
	className?: string;
	achievement: IAchievement;
}

export const Achievement: FC<AchievementProps> = (props) => {
	const {className, achievement} = props;

	const [block, element] = useBem('achievement', className);

	return (
		<div className={block()}>
			<span className={element('image-wrapper')}>
				<img className={element('image')} src={achievement.image} alt={achievement.title} />
			</span>
			<div>
				<Title tag="h4">{achievement.title}</Title>
				<p>{achievement.description}</p>
			</div>
		</div>
	);
};
