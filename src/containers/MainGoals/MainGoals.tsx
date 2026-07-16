import {observer} from 'mobx-react-lite';
import {FC, useEffect, useState} from 'react';

import {Banner} from '@/components/Banner/Banner';
import {FieldCheckbox} from '@/components/FieldCheckbox/FieldCheckbox';
import {Info100Goals} from '@/components/Info100Goals/Info100Goals';
import {MainCards} from '@/components/MainCards/MainCards';
import {Title} from '@/components/Title/Title';
import {useBem} from '@/hooks/useBem';
import {IMainGoals, UserStore} from '@/store/UserStore';
import {IComplexity} from '@/typings/goal';
import {IPage} from '@/typings/page';
import {get100Goals} from '@/utils/api/get/get100Goals';
import {markGoal} from '@/utils/api/post/markGoal';

import {MainGoalsSkeleton} from './MainGoalsSkeleton';
import './main-goals.scss';

const ALL_GOALS_COMPLETED_MESSAGE =
	'Поздравляем — ты выполнил все 100 целей. Это редкий подвиг, и впереди ещё целый мир новых открытий: ' +
	'создавай свои цели, списки, а также пользуйся готовым каталогом. Самое главное — продолжай путь вместе с нами. ' +
	'Скоро ты получишь своё достижение!';
const ALL_GOALS_COMPLETED_GIF =
	'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHYxaXJnZWF2NXB2ODVpeXF2MGFnMHBvaXU4czBoYTJtZHpwOXQzeCZlcD12MV9naWZzX3NlYXJjaCZjdD1n' +
	'/g9582DNuQppxC/giphy.gif';

const MainGoalsComponent: FC<IPage> = () => {
	const [block, element] = useBem('main-goals');
	const {isAuth} = UserStore;
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
	}, [isAuth]);

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

	const isCategoryCompleted = (key: keyof IMainGoals) => {
		const section = mainGoals[key];
		return section.data.length > 0 && section.countCompleted === section.data.length;
	};

	if (isLoading) {
		return (
			<main className={block()}>
				<MainGoalsSkeleton />
			</main>
		);
	}

	return (
		<main className={block()}>
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
					<Banner
						variant="filled"
						size="large"
						type="gold"
						icon={null}
						className={element('all-completed-banner')}
						title="Сотня покорена!"
						message={ALL_GOALS_COMPLETED_MESSAGE}
						endContent={<img src={ALL_GOALS_COMPLETED_GIF} alt="Наши поздравления" />}
					/>
				)}
				<FieldCheckbox id="hide-completed-main" text="Скрыть выполненные" checked={hideCompleted} setChecked={setHideCompleted} />
			</div>
			<MainCards
				className={element('goals')}
				goals={hideCompleted ? mainGoals.easyGoals.data.filter((goal) => !goal.completedByUser) : mainGoals.easyGoals.data}
				complexity="easy"
				topInfoClassName="gradient__top-info--main-goals"
				withBtn
				updateGoal={updateGoal}
				categoryCompleted={isCategoryCompleted('easyGoals')}
			/>
			<MainCards
				className={element('goals')}
				goals={hideCompleted ? mainGoals.mediumGoals.data.filter((goal) => !goal.completedByUser) : mainGoals.mediumGoals.data}
				complexity="medium"
				topInfoClassName="gradient__top-info--main-goals"
				withBtn
				updateGoal={updateGoal}
				categoryCompleted={isCategoryCompleted('mediumGoals')}
			/>
			<MainCards
				className={element('goals')}
				goals={hideCompleted ? mainGoals.hardGoals.data.filter((goal) => !goal.completedByUser) : mainGoals.hardGoals.data}
				complexity="hard"
				topInfoClassName="gradient__top-info--main-goals"
				withBtn
				updateGoal={updateGoal}
				categoryCompleted={isCategoryCompleted('hardGoals')}
			/>
		</main>
	);
};

export const MainGoals = observer(MainGoalsComponent);
