import {FC, useEffect, useState} from 'react';

import {FieldCheckbox} from '@/components/FieldCheckbox/FieldCheckbox';
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
	const [hideCompleted, setHideCompleted] = useState(false);
	const [allGoalsCompleted, setAllGoalsCompleted] = useState(false);

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

	useEffect(() => {
		if (mainGoals.easyGoals.data.length === 0) {
			return;
		}

		setAllGoalsCompleted(
			mainGoals.easyGoals.countCompleted === mainGoals.easyGoals.data.length &&
				mainGoals.mediumGoals.countCompleted === mainGoals.mediumGoals.data.length &&
				mainGoals.hardGoals.countCompleted === mainGoals.hardGoals.data.length
		);
	}, [mainGoals]);

	if (!mainGoals) {
		return null;
	}

	const updateGoal = async (_i: number, complexity: IComplexity, code: string, done: boolean): Promise<void> => {
		const res = await markGoal(code, !done);

		if (res.success) {
			const updatedGoal = {
				completedByUser: !done,
				totalAdded: res.data.totalAdded,
				totalCompleted: res.data.totalCompleted,
			};

			const goalsKey = `${complexity}Goals` as keyof IMainGoals;
			const targetGoals = mainGoals[goalsKey];
			const originalIndex = targetGoals.data.findIndex((goal) => goal.code === code);
			if (originalIndex === -1) {
				return;
			}

			const newGoals = {
				data: [
					...targetGoals.data.slice(0, originalIndex),
					{...targetGoals.data[originalIndex], ...updatedGoal},
					...targetGoals.data.slice(originalIndex + 1),
				],
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
							<p className={element('description-text')}>
								Сколько всего вы бы хотели сделать, увидеть, испытать за свою жизнь, но мечты постоянно откладываются?
							</p>
							<p className={element('description-text')}>
								Превратите свои мечты в цели, и скоро вы заметите, как ваша жизнь изменилась. Мы уже сделали это за вас -
								дерзайте!
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
					<div className={element('filter')}>
						{allGoalsCompleted && (
							<div className={element('all-completed-container')}>
								<p className={element('all-completed')}>
									Поздравляем! Ты достиг всего, что задумал. Но не спеши грустить — впереди ещё целый мир открытий, идей и
									впечатлений, которые ждут именно тебя, а мы уже готовы помочь тебе сделать следующий шаг.
								</p>
								<img // TODO
									className={element('all-completed-image')} // eslint-disable-next-line max-len
									src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHYxaXJnZWF2NXB2ODVpeXF2MGFnMHBvaXU4czBoYTJtZHpwOXQzeCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/g9582DNuQppxC/giphy.gif"
									alt="Наши поздравления"
								/>
							</div>
						)}
						<FieldCheckbox
							id="hide-completed-main"
							text="Скрыть выполненные"
							checked={hideCompleted}
							setChecked={setHideCompleted}
						/>
					</div>
					<MainCards
						className={element('goals')}
						goals={hideCompleted ? mainGoals.easyGoals.data.filter((goal) => !goal.completedByUser) : mainGoals.easyGoals.data}
						complexity="easy"
						withBtn
						updateGoal={updateGoal}
						allGoalsCompleted={allGoalsCompleted}
					/>
					<MainCards
						className={element('goals')}
						goals={
							hideCompleted ? mainGoals.mediumGoals.data.filter((goal) => !goal.completedByUser) : mainGoals.mediumGoals.data
						}
						complexity="medium"
						withBtn
						updateGoal={updateGoal}
						allGoalsCompleted={allGoalsCompleted}
					/>
					<MainCards
						className={element('goals')}
						goals={hideCompleted ? mainGoals.hardGoals.data.filter((goal) => !goal.completedByUser) : mainGoals.hardGoals.data}
						complexity="hard"
						withBtn
						updateGoal={updateGoal}
						allGoalsCompleted={allGoalsCompleted}
					/>
				</>
			</Loader>
		</main>
	);
};
