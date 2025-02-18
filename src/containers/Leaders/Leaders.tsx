import {FC, useEffect, useState} from 'react';

import {InfoGoal} from '@/components/InfoGoal/InfoGoal';
import {LeaderBoard} from '@/components/LeaderBoard/LeaderBoard';
import {LeaderPedestal} from '@/components/LeaderPedestal/LeaderPedestal';
import {Title} from '@/components/Title/Title';
import {useBem} from '@/hooks/useBem';
import {IInfoStats, IWeeklyLeader} from '@/typings/user';
import {getWeeklyLeaders} from '@/utils/api/get/getWeeklyLeaders';
import {defaultInfoStats} from '@/utils/data/default';
import './leaders.scss';

export const Leaders: FC = () => {
	const [block, element] = useBem('leaders');
	const [leaders, setLeaders] = useState<Array<IWeeklyLeader>>([]);
	const [infoStats, setInfoStats] = useState<IInfoStats>(defaultInfoStats);

	useEffect(() => {
		(async () => {
			const response = await getWeeklyLeaders();
			if (response.success) {
				setLeaders(response.data.leaders);
				setInfoStats(response.data.totalStats);
			}
		})();
	}, []);

	return (
		<main className={block()}>
			<div className={element('wrapper')}>
				<Title className={element('title')} tag="h1">
					Лидеры прошлой недели
				</Title>
				<p className={element('description')}>
					Выполняйте цели, пишите отзывы, зарабатывайте очки и попадайте в число лучших пользователей за неделю. Соревнуйтесь с
					другими и зарабатывайте награды в свой профиль. Покажите всем, что вы живёте полной жизнью!
				</p>
				<InfoGoal
					className={element('info')}
					items={[
						{title: 'Целей выполнено', value: infoStats.goalsCompleted},
						{title: 'Добавлено отзывов', value: infoStats.reviewsAdded},
						{title: 'Опыта заработано', value: infoStats.experienceEarned},
					]}
					backgroundOff
				/>
			</div>
			{leaders.length > 0 ? (
				<>
					<LeaderPedestal
						users={[...leaders, ...leaders, ...leaders, ...leaders, ...leaders, ...leaders, ...leaders].slice(0, 3)}
					/>
					<LeaderBoard
						className={element('board')}
						users={[...leaders, ...leaders, ...leaders, ...leaders, ...leaders, ...leaders, ...leaders]}
					/>
				</>
			) : (
				<div className={element('empty')}>Никто еще не стал лидером недели. Но вы можете стать им!</div>
			)}
		</main>
	);
};
