import {observer} from 'mobx-react-lite';
import {FC, useEffect, useState} from 'react';

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

	const {mainGoals, setMainGoals} = UserStore;
	const [isLoading, setIsLoading] = useState(true);

	const getGoals = async (): Promise<void> => {
		setIsLoading(true);
		const res = await get100Goals(id);
		if (res.success) {
			setMainGoals(res.data);
		}
		setIsLoading(false);
	};

	useEffect(() => {
		getGoals();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<Loader isLoading={isLoading} className={block()}>
			<Info100Goals
				className={element('stats')}
				totalAddedEasy={mainGoals.easyGoals.data.length}
				totalAddedMedium={mainGoals.mediumGoals.data.length}
				totalAddedHard={mainGoals.hardGoals.data.length}
				totalCompletedEasy={mainGoals.easyGoals.countCompleted}
				totalCompletedMedium={mainGoals.mediumGoals.countCompleted}
				totalCompletedHard={mainGoals.hardGoals.countCompleted}
			/>
			<MainCards className={element('goals')} goals={mainGoals.easyGoals.data} complexity="easy" />
			<MainCards className={element('goals')} goals={mainGoals.mediumGoals.data} complexity="medium" />
			<MainCards className={element('goals')} goals={mainGoals.hardGoals.data} complexity="hard" />
		</Loader>
	);
});
