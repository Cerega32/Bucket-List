import {FC, useState} from 'react';

import {useBem} from '@/hooks/useBem';
import {IGoal} from '@/typings/goal';

import {Button} from '../Button/Button';
import {CardMain} from '../CardMain/CardMain';
import {SwitchButton} from '../SwitchButton/SwitchButton';
import './main-popular.scss';

interface MainPopularProps {
	className?: string;
	goalsForDay: IGoal[];
	goalsForAllTime: IGoal[];
}

export const MainPopular: FC<MainPopularProps> = (props) => {
	const {className, goalsForDay, goalsForAllTime} = props;

	const [block, element] = useBem('main-popular', className);
	const [active, setActive] = useState('top');

	return (
		<section className={block()}>
			<div className={element('header')}>
				<SwitchButton
					buttons={[
						{id: 'top', name: 'Топ целей'},
						{id: 'today', name: 'Популярные сегодня'},
					]}
					active={active}
					onChange={setActive}
				/>
				<Button icon="rocket" theme="no-border" type="Link" href="/categories/all">
					Выбрать свою цель
				</Button>
			</div>
			<div className={element('content')}>
				{active === 'top' &&
					goalsForAllTime?.map((goal, i) => (
						<CardMain key={goal.code} goal={goal} className={element('card', {big: i < 3})} big={i < 3} colored />
					))}
				{active === 'today' &&
					goalsForDay?.map((goal, i) => (
						<CardMain key={goal.code} goal={goal} className={element('card', {big: i < 3})} big={i < 3} colored />
					))}
			</div>
		</section>
	);
};
