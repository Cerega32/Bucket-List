import {observer} from 'mobx-react-lite';
import {FC, useEffect} from 'react';

import {get100Goals} from '@/entities/goal/api/get100Goals';
import {MainCards} from '@/entities/goal/ui/MainCards/MainCards';
import {UserStore} from '@/entities/user/model/UserStore';
import {User100GoalsSkeleton} from '@/entities/user/ui/User100GoalsSkeleton/User100GoalsSkeleton';
import {useBem} from '@/shared/lib/hooks/useBem';
import {Info100Goals} from '@/widgets/info-100-goals/Info100Goals';
import '@/widgets/user-100-goals/user-100-goals.scss';

interface User100GoalsProps {
	id: string;
}

export const User100Goals: FC<User100GoalsProps> = observer((props) => {
	const {id} = props;
	const [block, element] = useBem('user-100-goals');

	const {mainGoals, setMainGoals, mainGoalsLoadedForId, setMainGoalsLoadedForId} = UserStore;

	useEffect(() => {
		if (mainGoalsLoadedForId === id) return undefined;
		let cancelled = false;
		setMainGoalsLoadedForId(null);
		setMainGoals({
			easyGoals: {data: [], countCompleted: 0},
			mediumGoals: {data: [], countCompleted: 0},
			hardGoals: {data: [], countCompleted: 0},
		});
		(async () => {
			const res = await get100Goals(id);
			if (cancelled) return;
			if (res.success) {
				setMainGoals(res.data);
			}
			setMainGoalsLoadedForId(id);
		})();
		return () => {
			cancelled = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [id]);

	const isFresh = mainGoalsLoadedForId === id;

	if (!isFresh) {
		return <User100GoalsSkeleton className={block()} />;
	}

	return (
		<div className={block()}>
			<Info100Goals
				className={element('stats')}
				totalAddedEasy={mainGoals.easyGoals.data.length}
				totalAddedMedium={mainGoals.mediumGoals.data.length}
				totalAddedHard={mainGoals.hardGoals.data.length}
				totalCompletedEasy={mainGoals.easyGoals.countCompleted}
				totalCompletedMedium={mainGoals.mediumGoals.countCompleted}
				totalCompletedHard={mainGoals.hardGoals.countCompleted}
			/>
			<MainCards
				className={element('goals')}
				goals={mainGoals.easyGoals.data}
				complexity="easy"
				topInfoClassName="gradient__top-info--main-goals"
			/>
			<MainCards
				className={element('goals')}
				goals={mainGoals.mediumGoals.data}
				complexity="medium"
				topInfoClassName="gradient__top-info--main-goals"
			/>
			<MainCards
				className={element('goals')}
				goals={mainGoals.hardGoals.data}
				complexity="hard"
				topInfoClassName="gradient__top-info--main-goals"
			/>
		</div>
	);
});
