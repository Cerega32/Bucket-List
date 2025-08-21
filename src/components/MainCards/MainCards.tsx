import {FC} from 'react';

import {useBem} from '@/hooks/useBem';
import {IComplexity, IGoal} from '@/typings/goal';
import {getComplexityCategory, getComplexityCategoryPlural} from '@/utils/values/complexity';

import {CardMain} from '../CardMain/CardMain';
import {Svg} from '../Svg/Svg';
import {Title} from '../Title/Title';

import './main-cards.scss';

interface MainCardsProps {
	className?: string;
	goals: Array<IGoal>;
	complexity: IComplexity;
	withBtn?: boolean;
	updateGoal?: (i: number, complexity: IComplexity, code: string, done: boolean) => void;
	allGoalsCompleted?: boolean;
}

export const MainCards: FC<MainCardsProps> = (props) => {
	const {className, goals, complexity, withBtn, updateGoal, allGoalsCompleted} = props;

	const [block, element] = useBem('main-cards', className);

	return (
		<section className={block()}>
			<Title className={element('title')} tag="h2">
				<Svg icon={complexity} width="22px" height="22px" />
				{getComplexityCategory[complexity]}
			</Title>
			<section className={element('cards')}>
				{goals.length > 0 &&
					goals?.map((goal, i) => (
						<CardMain
							key={goal.code}
							goal={goal}
							className={element('card', {big: i < 3})}
							big={i < 3}
							withBtn={withBtn}
							updateGoal={() => updateGoal && updateGoal(i, complexity, goal.code, goal.completedByUser)}
						/>
					))}
				{allGoalsCompleted && <p className={element('empty')}>{getComplexityCategoryPlural[complexity]}</p>}
			</section>
		</section>
	);
};
