import {observer} from 'mobx-react-lite';
import {FC, useEffect, useState} from 'react';

import {Achievement} from '@/components/Achievement/Achievement';
import {Button} from '@/components/Button/Button';
import {CommentsGoal} from '@/components/CommentsGoal/CommentsGoal';
import {EmptyState} from '@/components/EmptyState/EmptyState';
import {Info100Goals} from '@/components/Info100Goals/Info100Goals';
import {Loader} from '@/components/Loader/Loader';
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
	const [isLoading, setIsLoading] = useState(true);

	const {mainGoals, setMainGoals} = UserStore;

	const [achievements, setAchievements] = useState<Array<IAchievement>>([]);

	useEffect(() => {
		(async () => {
			setIsLoading(true);
			try {
				const [goalsRes, achievementsRes, commentsRes] = await Promise.all([
					get100Goals(id),
					GET('achievements', {get: {user_id: id}}),
					GET(`comments/${id}`, {auth: true}),
				]);

				if (goalsRes.success) {
					setMainGoals(goalsRes.data);
				}
				if (achievementsRes.success) {
					// Фильтруем только полученные достижения и берем первые 3
					const achieved = achievementsRes.data.data.filter((achievement: IAchievement) => achievement.isAchieved).slice(0, 3);
					setAchievements(achieved);
				}
				if (commentsRes.success) {
					setComments(commentsRes.data.data);
				}
			} finally {
				setIsLoading(false);
			}
		})();
	}, [id]);

	return (
		<Loader isLoading={isLoading} className={block()}>
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
				{achievements.length === 0 ? (
					<EmptyState
						title="Пока нет достижений"
						description="Выполняйте цели, чтобы получать достижения"
						size="small"
						className={element('empty-achievements')}
					/>
				) : (
					achievements.map((achievement) => (
						<Achievement key={achievement.id} className={element('achievement')} achievement={achievement} />
					))
				)}
			</aside>
		</Loader>
	);
});
