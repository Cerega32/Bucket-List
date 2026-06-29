import {FC} from 'react';
import {Link} from 'react-router-dom';

import {InfoTooltip} from '@/components/InfoTooltip/InfoTooltip';
import {useBem} from '@/hooks/useBem';
import {IWeeklyLeader} from '@/typings/user';
import {pluralize} from '@/utils/text/pluralize';

import {Avatar} from '../Avatar/Avatar';

import './leader-board.scss';

const ACTIVITY_TOOLTIP_PARAGRAPHS = [
	'Что сюда входит:',
	'- Бонус за серию выполнения целей.',
	'- Выполнение списков целей (с учётом сложности).',
	'- Создание целей, списков и папок.',
	'- Прогресс по целям и получение достижений.',
];

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
			<td className={element('item')}>{user.activityExperienceWeek}</td>
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
						<th className={element('head-item')}>
							<span className={element('head-label')}>
								Активность
								<InfoTooltip paragraphs={ACTIVITY_TOOLTIP_PARAGRAPHS} />
							</span>
						</th>
						<th className={element('head-item')}>Опыта заработано</th>
					</tr>
				</thead>
				<tbody>
					{users.map((user) => renderRow(user, highlightUserId === user.id))}
					{extraUser && (
						<>
							<tr className={element('separator-row')}>
								<td colSpan={6} className={element('separator')}>
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
