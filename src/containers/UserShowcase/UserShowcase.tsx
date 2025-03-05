import {observer} from 'mobx-react-lite';
import {FC, useEffect, useState} from 'react';

import {Achievement} from '@/components/Achievement/Achievement';
import {Button} from '@/components/Button/Button';
import {CommentsGoal} from '@/components/CommentsGoal/CommentsGoal';
import {Info100Goals} from '@/components/Info100Goals/Info100Goals';
import {Title} from '@/components/Title/Title';
import {useBem} from '@/hooks/useBem';
import {UserStore} from '@/store/UserStore';
import {IAchievement} from '@/typings/achievements';
import {IComment} from '@/typings/comments';
import {get100Goals} from '@/utils/api/get/get100Goals';
import {GET} from '@/utils/fetch/requests';
import './user-showcase.scss';

interface UserShowcaseProps {
	id: string;
}

export const UserShowcase: FC<UserShowcaseProps> = observer((props) => {
	const {id} = props;
	const [block, element] = useBem('user-showcase');

	// const {addedGoals, addedLists} = UserStore;
	const [comments, setComments] = useState<Array<IComment>>([]);

	const {mainGoals, setMainGoals} = UserStore;

	const getGoals = async (): Promise<void> => {
		const res = await get100Goals(id);
		if (res.success) {
			setMainGoals(res.data);
		}
	};

	const [achievements, setAchievements] = useState<Array<IAchievement>>([]);

	useEffect(() => {
		(async () => {
			const res = await GET('achievements', {get: {user_id: id}});
			if (res.success) {
				setAchievements(res.data.data);
			}
		})();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		getGoals();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		(async () => {
			const res = await GET(`comments/${id}`, {auth: true});
			if (res.success) {
				setComments(res.data.data);
			}
		})();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<section className={block()}>
			<CommentsGoal comments={comments} setComments={setComments} isUser />
			<aside className={element('sidebar')}>
				<div className={element('title')}>
					<Title tag="h2">100 целей</Title>
					<Button theme="blue-light" size="small" type="Link" href={`/user/${id}/100-goal`}>
						Смотреть все
					</Button>
				</div>
				<Info100Goals
					className={element('stats')}
					totalAddedEasy={mainGoals.easyGoals.data.length}
					totalAddedMedium={mainGoals.mediumGoals.data.length}
					totalAddedHard={mainGoals.hardGoals.data.length}
					totalCompletedEasy={mainGoals.easyGoals.countCompleted}
					totalCompletedMedium={mainGoals.mediumGoals.countCompleted}
					totalCompletedHard={mainGoals.hardGoals.countCompleted}
					column
				/>
				<div className={element('title')}>
					<Title tag="h2">Достижения</Title>
					<Button theme="blue-light" size="small" type="Link" href={`/user/${id}/achievements`}>
						Смотреть все
					</Button>
				</div>
				{achievements.map((achievement) => (
					<Achievement key={achievement.id} className={element('achievement')} achievement={achievement} />
				))}
			</aside>
		</section>
	);
});
