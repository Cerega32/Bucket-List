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
	highlightUserId?: number;
	extraUser?: IWeeklyLeader;
}

export const LeaderBoard: FC<LeaderBoardProps> = (props) => {
	const {users, className, highlightUserId, extraUser} = props;
	const [block, element] = useBem('leader-board', className);

	const renderRow = (user: IWeeklyLeader, highlighted?: boolean) => (
		<tr className={element('row', {current: highlighted})} key={user.id}>
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
	);

	return (
		<section className={block()}>
			<table className={element('table')}>
				<thead className={element('header')}>
					<tr>
						<th className={element('head-item')}>#</th>
						<th className={element('head-item')}>Пользователь</th>
						<th className={element('head-item')}>Целей выполнено</th>
						<th className={element('head-item')}>Добавлено впечатлений</th>
						<th className={element('head-item')}>Опыта заработано</th>
					</tr>
				</thead>
				<tbody>
					{users.map((user) => renderRow(user, highlightUserId === user.id))}
					{extraUser && (
						<>
							<tr className={element('separator-row')}>
								<td colSpan={5} className={element('separator')}>
									<span className={element('separator-text')}>Ваше место</span>
								</td>
							</tr>
							{renderRow(extraUser, true)}
						</>
					)}
				</tbody>
			</table>
		</section>
	);
};
