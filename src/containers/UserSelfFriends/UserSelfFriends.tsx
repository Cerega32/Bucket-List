import {observer} from 'mobx-react-lite';
import {FC, useMemo} from 'react';

import {Banner} from '@/components/Banner/Banner';
import {Switch} from '@/components/Switch/Switch';
import {Title} from '@/components/Title/Title';
import {UserSearch} from '@/components/UserSearch/UserSearch';
import {useBem} from '@/hooks/useBem';
import {FriendsStore} from '@/store/FriendsStore';

import {FriendsContent} from '../FriendsContent/FriendsContent';
import {FriendsRequests} from '../FriendsRequests/FriendsRequests';

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
				return (
					<section className={element('search')}>
						<div className={element('search-container')}>
							<UserSearch placeholder="Найдите единомышленников и отправьте им заявки в друзья" />
						</div>
					</section>
				);
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
				<Title tag="h2" className={element('title')}>
					Друзья
				</Title>
				<Switch className={element('switch')} buttons={switchButtons} active={subPage} />
			</div>
			{FriendsStore.searchResults.length > 0 && subPage === 'search' && (
				<Banner
					type="info"
					title="Советы"
					message="Просмотрите профиль пользователя перед отправкой заявки на дружбу"
					className={element('banner')}
				/>
			)}
			<div className={element('content')}>{getFriendsContent()}</div>
		</section>
	);
});
