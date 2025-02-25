import {FC} from 'react';
import {Link} from 'react-router-dom';

import {useBem} from '@/hooks/useBem';
import {IWeeklyLeader} from '@/typings/user';
import {pluralize} from '@/utils/text/pluralize';

import {Avatar} from '../Avatar/Avatar';

import './leader-board.scss';

interface LeaderBoardProps {
	users: Array<IWeeklyLeader>;
	className?: string;
}

export const LeaderBoard: FC<LeaderBoardProps> = (props) => {
	const {users, className} = props;
	const [block, element] = useBem('leader-board', className);

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
								<Link to={`/user/${user.id}/showcase`} className={element('row-link')}>
									<Avatar noBorder className={element('avatar')} size="medium" avatar={user.avatar} />
									<p>{user.name}</p>
									<p className={element('info')}>
										{pluralize(user.level, ['уровень'])}&nbsp;
										{pluralize(user.totalCompletedGoals, ['цель выполнена', 'цели выполнено', 'целей выполнено'])}
									</p>
								</Link>
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
