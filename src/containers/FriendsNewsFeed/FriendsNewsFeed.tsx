import {observer} from 'mobx-react-lite';
import {FC, useMemo, useState} from 'react';

import {EmptyState} from '@/components/EmptyState/EmptyState';
import {Loader} from '@/components/Loader/Loader';
import {Svg} from '@/components/Svg/Svg';
import {Title} from '@/components/Title/Title';
import {useBem} from '@/hooks/useBem';
import {pluralize} from '@/utils/text/pluralize';
import {formatDateString} from '@/utils/time/formatDate';

import {mockFriendsNewsEvents} from './friends-news-feed.mock';
import './friends-news-feed.scss';

export type FriendsNewsEventType =
	| 'achievement'
	| 'level_up'
	| 'streak'
	| 'return_after_pause'
	| 'list_completed'
	| 'goal_taken_from_your_list'
	| 'popular_goal_completed'
	| 'daily_stats'
	| 'weekly_leader';

export interface FriendsNewsEvent {
	id: string;
	type: FriendsNewsEventType;
	userId: number;
	userName: string;
	createdAt: string;
	likesCount: number;
	likedByMe: boolean;
	// Событие текущего пользователя: влияет на отображение карточки и лайка
	isOwn?: boolean;
	// Дополнительные данные, которые могли бы прийти с бэкенда
	achievementId?: number;
	achievementTitle?: string;
	achievementDescription?: string;
	level?: number;
	streakDays?: number;
	listId?: number;
	listName?: string;
	sourceGoalId?: number;
	sourceUserId?: number;
	sourceGoalTitle?: string;
	goalId?: number;
	goalTitle?: string;
	friendsWithSameGoalCount?: number;
	goalsCount?: number;
	listsCount?: number;
	pauseDays?: number;
	placeInLeaders?: number;
	completedGoals?: string[];
	completedLists?: string[];
}

const typeConfig: Record<
	FriendsNewsEventType,
	{
		icon: string;
		colorClass: string;
	}
> = {
	achievement: {
		icon: 'award',
		colorClass: 'friends-news-feed__icon-wrapper--gold',
	},
	level_up: {
		icon: 'hard',
		colorClass: 'friends-news-feed__icon-wrapper--green',
	},
	streak: {
		icon: 'regular',
		colorClass: 'friends-news-feed__icon-wrapper--gold',
	},
	return_after_pause: {
		icon: 'star-half',
		colorClass: 'friends-news-feed__icon-wrapper--blue',
	},
	list_completed: {
		icon: 'book-open',
		colorClass: 'friends-news-feed__icon-wrapper--green',
	},
	goal_taken_from_your_list: {
		icon: 'create-dashboard',
		colorClass: 'friends-news-feed__icon-wrapper--green',
	},
	popular_goal_completed: {
		icon: 'users',
		colorClass: 'friends-news-feed__icon-wrapper--blue',
	},
	daily_stats: {
		icon: 'chart',
		colorClass: 'friends-news-feed__icon-wrapper--blue',
	},
	weekly_leader: {
		icon: 'trophy',
		colorClass: 'friends-news-feed__icon-wrapper--gold',
	},
};

const formatEventText = (event: FriendsNewsEvent): string => {
	const isOwn = event.isOwn === true;

	switch (event.type) {
		case 'achievement':
			return `${isOwn ? 'Вы получили достижение' : `${event.userName} получил(а) достижение`} «${
				event.achievementTitle ?? 'достижение'
			}»`;

		case 'level_up':
			return `${isOwn ? 'Вы получили' : `${event.userName} получил(а)`} ${event.level} уровень.`;

		case 'streak':
			return `${isOwn ? 'Вы выполняете' : `${event.userName} выполняет`} цели ${event.streakDays} дней подряд.`;

		case 'return_after_pause':
			return `${isOwn ? 'Вы вернулись' : `${event.userName} вернулся(лась)`} к списку «${event.listName ?? 'список'}» после ${
				event.pauseDays ?? 0
			} дней паузы.`;

		case 'list_completed':
			return `${isOwn ? 'Вы завершили' : `${event.userName} завершил(а)`} список «${event.listName ?? 'список'}».`;

		case 'goal_taken_from_your_list':
			return `${event.userName} добавил(а) к себе цель «${event.sourceGoalTitle ?? 'цель'}» из вашего списка.`;

		case 'popular_goal_completed':
			return `${isOwn ? 'Вы завершили' : `${event.userName} завершил(а)`} цель «${event.goalTitle ?? 'цель'}», которая есть у ${
				event.friendsWithSameGoalCount ?? 0
			} ваших друзей.`;

		case 'daily_stats': {
			const goalsCount = event.goalsCount ?? 0;
			const listsCount = event.listsCount ?? 0;

			const goalsText = pluralize(goalsCount, ['цель', 'цели', 'целей']);
			const listsText = pluralize(listsCount, ['список', 'списка', 'списков']);

			return `Вчера ${isOwn ? 'вы выполнили' : `${event.userName} выполнил(а)`} ${goalsText} и ${listsText}.`;
		}

		case 'weekly_leader':
			return `${isOwn ? 'Вы' : event.userName} занял(и) ${event.placeInLeaders} место в «Лидерах недели».`;

		default:
			return '';
	}
};

export const FriendsNewsFeed: FC = observer(() => {
	const [block, element] = useBem('friends-news-feed');
	const [events, setEvents] = useState<FriendsNewsEvent[]>(mockFriendsNewsEvents);
	const [isLoading] = useState(false);

	const sortedEvents = useMemo(
		() => [...events].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
		[events]
	);

	const toggleLike = (id: string) => {
		setEvents((prev) =>
			prev.map((event) =>
				event.id === id
					? {
							...event,
							likedByMe: !event.likedByMe,
							likesCount: event.likesCount + (event.likedByMe ? -1 : 1),
					  }
					: event
			)
		);
	};

	return (
		<Loader isLoading={isLoading} className={block({empty: sortedEvents.length === 0})}>
			{sortedEvents.length === 0 ? (
				<EmptyState
					title="Пока нет событий от друзей"
					description="Добавьте друзей и выполняйте цели вместе — здесь будет появляться их активность."
				/>
			) : (
				<div className={element('list')}>
					{sortedEvents.map((event) => {
						const isOwnEvent = event.isOwn === true;
						const config = typeConfig[event.type];

						return (
							<article key={event.id} className={element('card', {own: isOwnEvent})}>
								<div className={element('card-main')}>
									<div className={`${element('icon-wrapper')} ${config.colorClass}`}>
										<Svg icon={config.icon} className={element('icon')} width="24px" height="24px" />
									</div>
									<div className={element('content')}>
										<Title tag="h3" className={element('title')}>
											{formatEventText(event)}
										</Title>
										{event.type === 'daily_stats' && (event.completedGoals?.length || event.completedLists?.length) && (
											<div className={element('details')}>
												{event.completedGoals?.length && (
													<div className={element('details-row')}>
														<span className={element('details-label')}>Цели:</span>
														<span className={element('details-value')}>{event.completedGoals.join(', ')}</span>
													</div>
												)}
												{event.completedLists?.length && (
													<div className={element('details-row')}>
														<span className={element('details-label')}>Списки:</span>
														<span className={element('details-value')}>{event.completedLists.join(', ')}</span>
													</div>
												)}
											</div>
										)}
										{event.type === 'achievement' && event.achievementDescription && (
											<div className={element('details')}>
												<div className={element('details-row')}>
													<span className={element('details-value')}>
														Получено за: {event.achievementDescription}
													</span>
												</div>
											</div>
										)}
										<div className={element('meta')}>
											<span className={element('date')}>{formatDateString(event.createdAt)}</span>
										</div>
									</div>
								</div>
								<button
									type="button"
									className={element('like-button', {active: event.likedByMe})}
									onClick={isOwnEvent ? undefined : () => toggleLike(event.id)}
									disabled={isOwnEvent}
								>
									<span className={element('like-icon-wrapper')}>
										<Svg
											icon={event.likedByMe ? 'like-fire-full' : 'like-fire'}
											className={element('like-icon')}
											width="20px"
											height="20px"
										/>
									</span>
									<span className={element('like-count')}>{event.likesCount}</span>
								</button>
							</article>
						);
					})}
				</div>
			)}
		</Loader>
	);
});
