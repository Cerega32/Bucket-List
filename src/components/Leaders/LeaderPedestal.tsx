import {FC} from 'react';

import {useBem} from '@/hooks/useBem';
import {IWeeklyLeader} from '@/typings/user';
import {pluralize} from '@/utils/text/pluralize';

import {Avatar} from '../Avatar/Avatar';
import {Svg} from '../Svg/Svg';

import './leader-pedestal.scss';

interface LeaderPedestalProps {
	users: Array<IWeeklyLeader>;
}

export const LeaderPedestal: FC<LeaderPedestalProps> = (props) => {
	const {users} = props;
	const [block, element] = useBem('leader-pedestal');

	return (
		<section className={block()}>
			{users.map((user, index) => (
				<div className={element('user')} key={user.id}>
					<Avatar
						noBorder
						className={element('avatar')}
						size={index === 0 ? 'large-96' : index === 1 ? 'medium-56' : 'medium'}
						avatar={user.avatar}
					/>
					<p className={element('name')}>{user.name}</p>
					<p className={element('experience')}>{pluralize(user.experienceEarnedWeek, ['опыт', 'опыта', 'опыта'])}</p>
					<p className={element('place')}>
						<Svg icon="award" />
						{user.place}&nbsp;место
					</p>
				</div>
			))}
		</section>
	);
};
