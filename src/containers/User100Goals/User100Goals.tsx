import {observer} from 'mobx-react-lite';
import {FC, useEffect} from 'react';

import {Info100Goals} from '@/components/Info100Goals/Info100Goals';
import {Loader} from '@/components/Loader/Loader';
import {MainCards} from '@/components/MainCards/MainCards';
import {useBem} from '@/hooks/useBem';
import {UserStore} from '@/store/UserStore';
import {get100Goals} from '@/utils/api/get/get100Goals';
import './user-100-goals.scss';

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
		return <Loader isLoading className={block()} />;
	}

	return (
		<Loader isLoading={false} className={block()}>
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
		</Loader>
	);
});
