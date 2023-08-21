import {FC, useEffect} from 'react';
import {useBem} from '@/hooks/useBem';
import {ThemeStore} from '@/store/ThemeStore';
import './user.scss';
import {InfoGoal} from '../InfoGoal/InfoGoal';

interface UserInfoProps {
	background: string;
	avatar: string;
	name: string;
	totalAdded: number;
	totalCompleted: number;
}

export const UserInfo: FC<UserInfoProps> = (props) => {
	const {background, avatar, name, totalAdded, totalCompleted} = props;
	const [block, element] = useBem('user-info');

	return (
		<article className={block()}>
			<img src={background} alt="Фон" className={element('bg')} />
			<section className={element('about')}>
				<img className={element('avatar')} src={avatar} alt="Аватар" />
				<h2 className={element('name')}>{name}</h2>
			</section>
			<InfoGoal
				totalAdded={totalAdded}
				totalCompleted={totalCompleted}
				isUser
				className={element('goals')}
			/>
		</article>
	);
};
