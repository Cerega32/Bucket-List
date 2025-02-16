import {FC} from 'react';

import {useBem} from '@/hooks/useBem';
import {IWeeklyLeader} from '@/typings/user';
import {pluralize} from '@/utils/text/pluralize';

import {Avatar} from '../Avatar/Avatar';

import './leader-board.scss';

interface LeaderBoardProps {
	users: Array<IWeeklyLeader>;
}

export const LeaderBoard: FC<LeaderBoardProps> = (props) => {
	const {users} = props;
	const [block, element] = useBem('leader-board');

	return (
		<section className={block()}>
			<table className={element('table')}>
				<thead className={element('header')}>
					<tr>
						<th className={element('head-item')}>#</th>
						<th className={element('head-item')}>Пользователь</th>
						<th className={element('head-item')}>Целей выполнено</th>
						<th className={element('head-item')}>Добавлено отзывов</th>
						<th className={element('head-item')}>Опыта заработано</th>
					</tr>
				</thead>
				<tbody>
					{users.map((user) => (
						<tr className={element('row')} key={user.id}>
							<td className={element('item')}>{user.place}</td>
							<td className={element('item')}>
								<Avatar noBorder className={element('avatar')} size="medium" avatar={user.avatar} />
								<p>{user.name}</p>
								<p className={element('info')}>
									{pluralize(user.level, ['уровень'])}&nbsp;
									{pluralize(user.totalCompletedGoals, ['цель выполнена', 'цели выполнено', 'целей выполнено'])}
								</p>
							</td>
							<td className={element('item')}>{user.weekCompletedGoals}</td>
							<td className={element('item')}>{user.reviewsAddedWeek}</td>
							<td className={element('item')}>{user.experienceEarnedWeek}</td>
						</tr>
					))}
				</tbody>
			</table>
		</section>
	);
};
