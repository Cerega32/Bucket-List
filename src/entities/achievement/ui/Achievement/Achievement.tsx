import {FC, useState} from 'react';

import {IAchievement} from '@/entities/achievement/model/types';
import {useBem} from '@/shared/lib/hooks/useBem';
import {Title} from '@/shared/ui/Title/Title';
import '@/entities/achievement/ui/Achievement/achievement.scss';

interface AchievementProps {
	className?: string;
	achievement: IAchievement;
}

const DEFAULT_ICON = '/assets/achievements/target-default.svg';

export const Achievement: FC<AchievementProps> = (props) => {
	const {className, achievement} = props;

	const [block, element] = useBem('achievement', className);
	const [imageError, setImageError] = useState(false);

	const handleImageError = () => {
		setImageError(true);
	};

	const imageSrc = imageError || !achievement.image || !achievement.isAchieved ? DEFAULT_ICON : achievement.image;

	return (
		<div className={block({unlocked: achievement.isAchieved})}>
			<span className={element('image-wrapper')}>
				<img className={element('image')} src={imageSrc} alt={achievement.title} onError={handleImageError} />
			</span>
			<div>
				<Title tag="h4">{achievement.title}</Title>
				<p>{achievement.description}</p>
			</div>
		</div>
	);
};
