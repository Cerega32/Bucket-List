import {FC} from 'react';
import {useBem} from '@/hooks/useBem';
import './user-info.scss';
import {InfoGoal} from '../InfoGoal/InfoGoal';
import {Avatar} from '../Avatar/Avatar';
import {ITabs, Tabs} from '../Tabs/Tabs';
import {Title} from '../Title/Title';

const tabs: Array<ITabs> = [
	{
		url: '/user/showcase',
		name: 'Витрина',
		page: 'isUserShowcase',
	},
	{
		url: '/user/100-goal',
		name: '100 целей',
		page: 'isUserMainGoals',
	},
	{
		url: '/user/active-goals',
		name: 'Активные цели',
		page: 'isUserActiveGoals',
	},
	{
		url: '/user/done-goals',
		name: 'Выполненные',
		page: 'isUserDoneGoals',
	},
];

interface UserInfoProps {
	background?: string;
	avatar: string | null;
	name: string;
	totalAdded: number;
	totalCompleted: number;
	page: string;
}

export const UserInfo: FC<UserInfoProps> = (props) => {
	const {
		background = '/src/assets/jpg/Background.jpg',
		avatar,
		name,
		totalAdded,
		totalCompleted,
		page,
	} = props;
	const [block, element] = useBem('user-info');

	return (
		<article className={block()}>
			<div
				style={{backgroundImage: `url('${background}')`}}
				className={element('bg')}
			/>
			<section className={element('about')}>
				<Avatar
					avatar={avatar}
					className={element('avatar')}
					size="large"
				/>
				<div className={element('wrapper')}>
					<Title tag="h2" className={element('name')}>
						{name}
					</Title>
					<InfoGoal
						totalAdded={totalAdded}
						totalCompleted={totalCompleted}
						isUser
						className={element('goals')}
					/>
				</div>
			</section>
			<Tabs tabs={tabs} active={page} />
		</article>
	);
};
