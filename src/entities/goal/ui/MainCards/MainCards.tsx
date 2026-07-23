import {FC} from 'react';

import {getComplexityCategory, getComplexityCategoryCompletedHint, getComplexityCategoryPlural} from '@/entities/goal/lib/complexity';
import {IComplexity, IGoal} from '@/entities/goal/model/types';
import {CardMain} from '@/entities/goal/ui/CardMain/CardMain';
import {useBem} from '@/shared/lib/hooks/useBem';
import {Banner, BannerType} from '@/shared/ui/Banner/Banner';
import {Svg} from '@/shared/ui/Svg/Svg';
import {Title} from '@/shared/ui/Title/Title';

import '@/entities/goal/ui/MainCards/main-cards.scss';

const complexityBannerType: Record<IComplexity, BannerType> = {
	easy: 'success',
	medium: 'warning',
	hard: 'danger',
};

interface MainCardsProps {
	className?: string;
	goals: Array<IGoal>;
	complexity: IComplexity;
	withBtn?: boolean;
	updateGoal?: (i: number, complexity: IComplexity, code: string, done: boolean) => void;
	categoryCompleted?: boolean;
	topInfoClassName?: string;
	disableNavigation?: boolean;
}

export const MainCards: FC<MainCardsProps> = (props) => {
	const {className, goals, complexity, withBtn, updateGoal, categoryCompleted, topInfoClassName, disableNavigation} = props;

	const [block, element] = useBem('main-cards', className);

	return (
		<section className={block()}>
			<Title className={element('title')} tag="h2">
				<Svg icon={complexity} width="22px" height="22px" />
				{getComplexityCategory[complexity]}
			</Title>
			{categoryCompleted && (
				<Banner
					variant="filled"
					type={complexityBannerType[complexity]}
					iconVariant="target"
					className={element('banner')}
					title={getComplexityCategoryPlural[complexity]}
					message={getComplexityCategoryCompletedHint[complexity]}
				/>
			)}
			<section className={element('cards')}>
				{goals.length > 0 &&
					goals?.map((goal, i) => (
						<CardMain
							key={goal.code}
							goal={goal}
							className={element('card')}
							withBtn={withBtn}
							topInfoClassName={topInfoClassName}
							disableNavigation={disableNavigation}
							updateGoal={() => updateGoal && updateGoal(i, complexity, goal.code, goal.completedByUser)}
						/>
					))}
			</section>
		</section>
	);
};
