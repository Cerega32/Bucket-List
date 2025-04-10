import {FC, useMemo} from 'react';

import {useBem} from '@/hooks/useBem';

import {Avatar} from '../Avatar/Avatar';
import {Button} from '../Button/Button';
import {InfoGoal} from '../InfoGoal/InfoGoal';
import {ITabs, Tabs} from '../Tabs/Tabs';
import {Title} from '../Title/Title';

import './user-info.scss';

interface UserInfoProps {
	background?: string | null;
	avatar: string | null;
	name: string;
	totalAdded: number;
	totalCompleted: number;
	page: string;
	id: string;
	totalCompletedLists: number;
	totalAddedLists: number;
	totalAchievements: number;
}

export const UserInfo: FC<UserInfoProps> = (props) => {
	const {background, avatar, name, totalAdded, totalCompleted, page, id, totalAddedLists, totalCompletedLists, totalAchievements} = props;
	const [block, element] = useBem('user-info');

	const tabs: Array<ITabs> = useMemo(() => {
		return [
			{
				url: `/user/${id}/showcase`,
				name: 'Витрина',
				page: 'isUserShowcase',
			},
			{
				url: `/user/${id}/100-goal`,
				name: '100 целей',
				page: 'isUser100Goals',
			},
			{
				url: `/user/${id}/active-goals`,
				name: 'Активные цели и списки',
				page: 'isUserActiveGoals',
				count: totalAddedLists + totalAdded - (totalCompletedLists + totalCompleted),
			},
			{
				url: `/user/${id}/done-goals`,
				name: 'Выполненные',
				page: 'isUserDoneGoals',
				count: totalCompletedLists + totalCompleted,
			},
			{
				url: `/user/${id}/achievements`,
				name: 'Достижения',
				page: 'isUserAchievements',
				count: totalAchievements,
			},
		];
	}, [id, totalAchievements, totalAdded, totalAddedLists, totalCompleted, totalCompletedLists]);

	return (
		<article className={block()}>
			{background && <div style={{backgroundImage: `url('${background}')`}} className={element('bg')} />}
			<section className={element('about')}>
				<Avatar avatar={avatar} className={element('avatar')} size="large" />
				<div className={element('wrapper')}>
					<Title tag="h2" className={element('name')}>
						{name}
					</Title>
					<div className={element('right')}>
						<Button type="Link" theme="blue" icon="plus" href="/goals/create">
							Добавить цель
						</Button>
						<InfoGoal
							items={[
								{title: 'Всего целей', value: totalAdded},
								{title: 'Выполнено', value: totalCompleted},
							]}
							className={element('goals')}
						/>
					</div>
				</div>
			</section>
			<Tabs tabs={tabs} active={page} />
		</article>
	);
};
