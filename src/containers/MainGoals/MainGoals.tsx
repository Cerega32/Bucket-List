import {FC, useEffect, useState} from 'react';
import {useParams} from 'react-router-dom';

import {Info100Goals} from '@/components/Info100Goals/Info100Goals';
import {MainCards} from '@/components/MainCards/MainCards';

import {Title} from '@/components/Title/Title';
import {useBem} from '@/hooks/useBem';
import {ThemeStore} from '@/store/ThemeStore';
import {ICategoryGoals, IMainGoals} from '@/store/UserStore';
import {IComplexity, IGoal} from '@/typings/goal';
import './main-goals.scss';
import {IPage} from '@/typings/page';
import {get100Goals} from '@/utils/api/get/get100Goals';
import {getGoal} from '@/utils/api/get/getGoal';
import {addGoal} from '@/utils/api/post/addGoal';
import {markGoal} from '@/utils/api/post/markGoal';
import {removeGoal} from '@/utils/api/post/removeGoal';

export const MainGoals: FC<IPage> = () => {
	const [block, element] = useBem('main-goals');

	const {setHeader} = ThemeStore;

	const [mainGoals, setMainGoals] = useState<IMainGoals>({
		easyGoals: {data: [], countCompleted: 0},
		mediumGoals: {data: [], countCompleted: 0},
		hardGoals: {data: [], countCompleted: 0},
	});

	useEffect(() => {
		(async () => {
			const res = await get100Goals();
			if (res.success) {
				setMainGoals(res.data);
			}
		})();
	}, []);

	useEffect(() => {
		setHeader('white');
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	if (!mainGoals) {
		return null;
	}

	const updateGoal = async (i: number, complexity: IComplexity, code: string, done: boolean): Promise<void> => {
		const res = await markGoal(code, !done);

		if (res.success) {
			const updatedGoal = {
				completedByUser: !done,
				totalAdded: res.data.totalAdded,
				totalCompleted: res.data.totalCompleted,
			};

			const goalsKey = `${complexity}Goals` as keyof IMainGoals;
			const targetGoals = mainGoals[goalsKey];

			const newGoals = {
				data: [...targetGoals.data.slice(0, i), {...targetGoals.data[i], ...updatedGoal}, ...targetGoals.data.slice(i + 1)],
				countCompleted: targetGoals.countCompleted + (done ? -1 : 1),
			};

			setMainGoals({...mainGoals, [goalsKey]: newGoals});
		}
	};

	return (
		<main className={block()}>
			<div className={element('info')}>
				<div className={element('description')}>
					<Title className={element('title')} tag="h1">
						Твои 100 целей на жизнь!
					</Title>
					<p>
						Сколько всего вы бы хотели сделать, увидеть, испытать за свою жизнь, но мечты постоянно откладываются? Превратите
						свои мечты в цели, и скоро вы заметите, как ваша жизнь изменилась. Мы уже сделали это за вас - дерзайте!
					</p>
				</div>
				<Info100Goals
					className={element('stats')}
					totalAddedEasy={mainGoals.easyGoals.data.length}
					totalAddedMedium={mainGoals.mediumGoals.data.length}
					totalAddedHard={mainGoals.hardGoals.data.length}
					totalCompletedEasy={mainGoals.easyGoals.countCompleted}
					totalCompletedMedium={mainGoals.mediumGoals.countCompleted}
					totalCompletedHard={mainGoals.hardGoals.countCompleted}
				/>
			</div>
			<MainCards className={element('goals')} goals={mainGoals.easyGoals.data} complexity="easy" withBtn updateGoal={updateGoal} />
			<MainCards
				className={element('goals')}
				goals={mainGoals.mediumGoals.data}
				complexity="medium"
				withBtn
				updateGoal={updateGoal}
			/>
			<MainCards className={element('goals')} goals={mainGoals.hardGoals.data} complexity="hard" withBtn updateGoal={updateGoal} />
		</main>
	);
};
