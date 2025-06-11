import {observer} from 'mobx-react-lite';
import {FC, useMemo} from 'react';

import {Switch} from '@/components/Switch/Switch';
import {useBem} from '@/hooks/useBem';

import {FriendsContent} from '../FriendsContent/FriendsContent';
import {FriendsRequests} from '../FriendsRequests/FriendsRequests';
import {FriendsSearch} from '../FriendsSearch/FriendsSearch';

import './user-self-friends.scss';

interface UserSelfFriendsProps {
	subPage?: string;
}

export const UserSelfFriends: FC<UserSelfFriendsProps> = observer(({subPage = 'friends'}) => {
	const [block, element] = useBem('user-self-friends');

	const getFriendsContent = () => {
		switch (subPage) {
			case 'requests':
				return <FriendsRequests />;
			case 'search':
				return <FriendsSearch />;
			default:
				return <FriendsContent />;
		}
	};

	const switchButtons = useMemo(() => {
		return [
			{
				url: '/user/self/friends',
				name: 'Мои друзья',
				page: 'friends',
			},
			{
				url: '/user/self/friends/requests',
				name: 'Заявки',
				page: 'requests',
			},
			{
				url: '/user/self/friends/search',
				name: 'Поиск',
				page: 'search',
			},
		];
	}, []);

	return (
		<section className={block()}>
			<div className={element('header')}>
				<h1 className={element('title')}>Друзья</h1>
				<Switch className={element('switch')} buttons={switchButtons} active={subPage} />
			</div>
			<div className={element('content')}>{getFriendsContent()}</div>
		</section>
	);
});
