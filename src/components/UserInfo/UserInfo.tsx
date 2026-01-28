import {observer} from 'mobx-react-lite';
import {FC, useMemo, useState} from 'react';

import {useBem} from '@/hooks/useBem';
import {FriendsStore} from '@/store/FriendsStore';
import {NotificationStore} from '@/store/NotificationStore';
import {UserStore} from '@/store/UserStore';
import {sendFriendRequest} from '@/utils/api/friends';

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

export const UserInfo: FC<UserInfoProps> = observer((props) => {
	const {background, avatar, name, totalAdded, totalCompleted, page, id, totalAddedLists, totalCompletedLists, totalAchievements} = props;
	const [block, element] = useBem('user-info');
	const [isAddingFriend, setIsAddingFriend] = useState(false);

	// Проверяем, является ли это своим профилем
	const isOwnProfile = UserStore.userSelf.id.toString() === id;

	// Проверяем, является ли пользователь уже другом
	const isFriend = FriendsStore.friends.some((friend) => friend.id.toString() === id);

	// Проверяем, есть ли уже отправленная заявка
	const hasPendingRequest = FriendsStore.friendRequests.some((request) => request?.id.toString() === id);

	const handleAddFriend = async () => {
		if (isAddingFriend) return;

		try {
			setIsAddingFriend(true);
			await sendFriendRequest(parseInt(id, 10));

			NotificationStore.addNotification({
				type: 'success',
				title: 'Заявка отправлена',
				message: `Заявка в друзья отправлена пользователю ${name}`,
			});
		} catch (error) {
			NotificationStore.addNotification({
				type: 'error',
				title: 'Ошибка',
				message: error instanceof Error ? error.message : 'Не удалось отправить заявку в друзья',
			});
		} finally {
			setIsAddingFriend(false);
		}
	};

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
		<article className={block({noBackground: !background})}>
			<div
				style={background ? {backgroundImage: `url('${background}')`} : undefined}
				className={element('bg', {placeholder: !background})}
			/>
			<section className={element('about')}>
				<Avatar avatar={avatar} className={element('avatar')} size="large" />
				<div className={element('wrapper')}>
					<Title tag="h2" className={element('name')}>
						{name}
					</Title>
					<div className={element('right')}>
						{isOwnProfile ? (
							<Button type="Link" theme="blue" icon="plus" href="/goals/create">
								Добавить цель
							</Button>
						) : (
							<div className={element('friend-actions')}>
								{!isFriend && !hasPendingRequest && (
									<Button
										theme="blue"
										icon="plus"
										onClick={isAddingFriend ? undefined : handleAddFriend}
										disabled={isAddingFriend}
									>
										{isAddingFriend ? 'Отправка...' : 'Добавить в друзья'}
									</Button>
								)}
								{isFriend && (
									<Button theme="green" icon="check">
										В друзьях
									</Button>
								)}
								{hasPendingRequest && !isFriend && (
									<Button theme="blue-light" disabled>
										Заявка отправлена
									</Button>
								)}
							</div>
						)}
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
});
