import {FC} from 'react';

import {Skeleton} from '@/components/Skeleton/Skeleton';
import {Title} from '@/components/Title/Title';
import {useBem} from '@/hooks/useBem';

import './main-goals-skeleton.scss';

interface MainGoalsSkeletonProps {
	className?: string;
	cardsPerSection?: number;
}

export const MainGoalsSkeleton: FC<MainGoalsSkeletonProps> = (props) => {
	const {className, cardsPerSection = 11} = props;
	const [block, element] = useBem('main-goals-skeleton', className);

	return (
		<div className={block()}>
			<div className={element('info')}>
				<div className={element('description')}>
					<Title className={element('title')} tag="h1">
						Твои 100 целей на жизнь!
					</Title>
					<p className={element('description-text')}>
						Сколько всего вы бы хотели сделать, увидеть, испытать за свою жизнь, но мечты постоянно откладываются?
					</p>
					<p className={element('description-text')}>
						Превратите свои мечты в цели, и скоро вы заметите, как ваша жизнь изменилась. Мы уже сделали это за вас - дерзайте!
					</p>
				</div>
				<Skeleton className={element('stats')} borderRadius={16} height={150} width="40%" />
			</div>

			<div className={element('filter')}>
				<Skeleton width={180} height={24} />
			</div>

			{(['easy', 'medium', 'hard'] as const).map((complexity) => (
				<section key={complexity} className={element('section')}>
					<div className={element('section-title')}>
						<Skeleton circle width={22} height={22} />
						<Skeleton width={200} height={24} />
					</div>
					<div className={element('cards')}>
						{Array.from({length: cardsPerSection}).map((_, i) => (
							<Skeleton key={i} className={element('card')} borderRadius={8} />
						))}
					</div>
				</section>
			))}
		</div>
	);
};
