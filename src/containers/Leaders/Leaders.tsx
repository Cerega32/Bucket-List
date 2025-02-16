import {FC, useEffect, useState} from 'react';

import {LeaderBoard} from '@/components/LeaderBoard/LeaderBoard';
import {Title} from '@/components/Title/Title';
import {useBem} from '@/hooks/useBem';
import {IWeeklyLeader} from '@/typings/user';
import {getWeeklyLeaders} from '@/utils/api/get/getWeeklyLeaders';

export const Leaders: FC = () => {
	const [block, element] = useBem('leaders');
	const [leaders, setLeaders] = useState<Array<IWeeklyLeader>>([]);

	useEffect(() => {
		(async () => {
			const response = await getWeeklyLeaders();
			console.log(response);
			if (response.success) {
				setLeaders(response.data.leaders);
			}
		})();
	}, []);

	return (
		<main className={block()}>
			<div>
				<Title className={element('title')} tag="h1">
					Лидеры прошлой недели
				</Title>
				<p>
					Выполняйте цели, пишите отзывы, зарабатывайте очки и попадайте в число лучших пользователей за неделю. Соревнуйтесь с
					другими и зарабатывайте награды в свой профиль. Покажите всем, что вы живёте полной жизнью!
				</p>
			</div>
			<div>Анастасия Волочкова</div>
			<LeaderBoard users={[...leaders, ...leaders, ...leaders, ...leaders, ...leaders, ...leaders, ...leaders]} />
		</main>
	);
};
