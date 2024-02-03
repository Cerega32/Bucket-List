import {FC, ReactElement} from 'react';

import {Card} from '../Card/Card';

import {useBem} from '@/hooks/useBem';

import {IComplexity, IGoal} from '@/typings/goal';

import './main-cards.scss';
import {CardMain} from '../CardMain/CardMain';
import {Title} from '../Title/Title';
import {Svg} from '../Svg/Svg';

import {getComplexityCategory} from '@/utils/values/complexity';

interface MainCardsProps {
	className?: string;
	goals: Array<IGoal>;
	complexity: IComplexity;
}

export const MainCards: FC<MainCardsProps> = (props) => {
	const {className, goals, complexity} = props;

	const [block, element] = useBem('main-cards', className);

	return (
		<section className={block()}>
			<Title className={element('title')} tag="h2">
				<Svg icon={complexity} width="22px" height="22px" />
				{getComplexityCategory[complexity]}
			</Title>
			<section className={element('cards')}>
				{goals?.map((goal, i) => (
					<CardMain goal={goal} className={element('card', {big: i < 3})} big={i < 3} />
				))}
			</section>
		</section>
	);
};
