import {FC, useMemo} from 'react';

import {useBem} from '@/hooks/useBem';

import './user-info.scss';
import {Avatar} from '../Avatar/Avatar';
import {InfoGoal} from '../InfoGoal/InfoGoal';
import ProgressBar, {ProgressCategory} from '../ProgressCategory/ProgressCategory';
import {ITabs, Tabs} from '../Tabs/Tabs';
import {Title} from '../Title/Title';

interface UserInfoProps {
	background?: string;
	avatar: string | null;
	name: string;
	totalAdded: number;
	totalCompleted: number;
	page: string;
	id: string;
}

export const UserInfo: FC<UserInfoProps> = (props) => {
	const {background = '/src/assets/jpg/Background.jpg', avatar, name, totalAdded, totalCompleted, page, id} = props;
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
			},
			{
				url: `/user/${id}/done-goals`,
				name: 'Выполненные',
				page: 'isUserDoneGoals',
			},
			{
				url: `/user/${id}/achievements`,
				name: 'Достижения',
				page: 'isUserAchievements',
			},
		];
	}, [id]);

	return (
		<article className={block()}>
			<div style={{backgroundImage: `url('${background}')`}} className={element('bg')} />
			<section className={element('about')}>
				<Avatar avatar={avatar} className={element('avatar')} size="large" />
				<div className={element('wrapper')}>
					<Title tag="h2" className={element('name')}>
						{name}
					</Title>
					<InfoGoal totalAdded={totalAdded} totalCompleted={totalCompleted} isUser className={element('goals')} />
				</div>
			</section>
			<Tabs tabs={tabs} active={page} />
		</article>
	);
};
