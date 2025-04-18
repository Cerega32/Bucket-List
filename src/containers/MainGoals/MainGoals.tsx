import {FC, useEffect, useState} from 'react';

import {Info100Goals} from '@/components/Info100Goals/Info100Goals';
import {Loader} from '@/components/Loader/Loader';
import {MainCards} from '@/components/MainCards/MainCards';
import {Title} from '@/components/Title/Title';
import {useBem} from '@/hooks/useBem';
import {IMainGoals} from '@/store/UserStore';
import {IComplexity} from '@/typings/goal';
import {IPage} from '@/typings/page';
import {get100Goals} from '@/utils/api/get/get100Goals';
import {markGoal} from '@/utils/api/post/markGoal';
import './main-goals.scss';

export const MainGoals: FC<IPage> = () => {
	const [block, element] = useBem('main-goals');
	const [isLoading, setIsLoading] = useState(true);

	const [mainGoals, setMainGoals] = useState<IMainGoals>({
		easyGoals: {data: [], countCompleted: 0},
		mediumGoals: {data: [], countCompleted: 0},
		hardGoals: {data: [], countCompleted: 0},
	});

	useEffect(() => {
		(async () => {
			setIsLoading(true);
			const res = await get100Goals();
			if (res.success) {
				setMainGoals(res.data);
			}
			setIsLoading(false);
		})();
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
			<Loader isLoading={isLoading}>
				<>
					<div className={element('info')}>
						<div className={element('description')}>
							<Title className={element('title')} tag="h1">
								Твои 100 целей на жизнь!
							</Title>
							<p>
								Сколько всего вы бы хотели сделать, увидеть, испытать за свою жизнь, но мечты постоянно откладываются?
								Превратите свои мечты в цели, и скоро вы заметите, как ваша жизнь изменилась. Мы уже сделали это за вас -
								дерзайте!
							</p>
						</div>
						<Info100Goals // TODO проверить кнопку
							className={element('stats')}
							totalAddedEasy={mainGoals.easyGoals.data.length}
							totalAddedMedium={mainGoals.mediumGoals.data.length}
							totalAddedHard={mainGoals.hardGoals.data.length}
							totalCompletedEasy={mainGoals.easyGoals.countCompleted}
							totalCompletedMedium={mainGoals.mediumGoals.countCompleted}
							totalCompletedHard={mainGoals.hardGoals.countCompleted}
						/>
					</div>
					<MainCards
						className={element('goals')}
						goals={mainGoals.easyGoals.data}
						complexity="easy"
						withBtn
						updateGoal={updateGoal}
					/>
					<MainCards
						className={element('goals')}
						goals={mainGoals.mediumGoals.data}
						complexity="medium"
						withBtn
						updateGoal={updateGoal}
					/>
					<MainCards
						className={element('goals')}
						goals={mainGoals.hardGoals.data}
						complexity="hard"
						withBtn
						updateGoal={updateGoal}
					/>
				</>
			</Loader>
		</main>
	);
};
