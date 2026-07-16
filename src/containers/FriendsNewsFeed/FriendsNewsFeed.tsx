import {observer} from 'mobx-react-lite';
import {FC, ReactNode, useCallback, useEffect, useRef, useState} from 'react';
import {Link} from 'react-router-dom';

import {EmptyState} from '@/components/EmptyState/EmptyState';
import {Loader} from '@/components/Loader/Loader';
import {Svg} from '@/components/Svg/Svg';
import {Title} from '@/components/Title/Title';
import {useBem} from '@/hooks/useBem';
import {UserStore} from '@/store/UserStore';
import {FriendsNewsEvent, FriendsNewsEventType, IFeedCompletedItem} from '@/typings/feed';
import {getFriendsFeed, toggleFeedEventLike} from '@/utils/api/feed';
import {pluralize} from '@/utils/text/pluralize';
import {formatDateString} from '@/utils/time/formatDate';

import {FriendsNewsFeedSkeleton} from './FriendsNewsFeedSkeleton';
import './friends-news-feed.scss';

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
		icon: 'regular-empty',
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
		icon: 'bullseye',
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
	goal_review: {
		icon: 'comment',
		colorClass: 'friends-news-feed__icon-wrapper--green',
	},
	list_review: {
		icon: 'apps',
		colorClass: 'friends-news-feed__icon-wrapper--blue',
	},
	friend_added: {
		icon: 'people',
		colorClass: 'friends-news-feed__icon-wrapper--gold',
	},
};

const GoalLink: FC<{code?: string; title?: string}> = ({code, title}) => {
	const [, element] = useBem('friends-news-feed');
	if (!code) return <>«{title ?? 'цель'}»</>;
	return (
		<Link to={`/goals/${code}`} className={element('link')}>
			«{title ?? 'цель'}»
		</Link>
	);
};

const ListLink: FC<{code?: string; title?: string}> = ({code, title}) => {
	const [, element] = useBem('friends-news-feed');
	if (!code) return <>«{title ?? 'список'}»</>;
	return (
		<Link to={`/list/${code}`} className={element('link')}>
			«{title ?? 'список'}»
		</Link>
	);
};

const CompletedItemsList: FC<{items?: IFeedCompletedItem[]; isList?: boolean}> = ({items, isList}) => {
	const [, element] = useBem('friends-news-feed');
	if (!items?.length) return null;

	return (
		<>
			{items.map((item, index) => (
				<span key={item.id}>
					<Link to={isList ? `/list/${item.code}` : `/goals/${item.code}`} className={element('link')}>
						{item.title}
					</Link>
					{index < items.length - 1 ? ', ' : ''}
				</span>
			))}
		</>
	);
};

const buildEventContent = (event: FriendsNewsEvent, currentUserId: number): ReactNode => {
	const isOwn = event.isOwn === true;
	const isSourceViewer = !isOwn && event.sourceUserId === currentUserId;

	switch (event.type) {
		case 'achievement':
			return (
				<>
					{isOwn ? 'Вы получили достижение ' : `${event.userName} получил(а) достижение `}«
					{event.achievementTitle ?? 'достижение'}»
				</>
			);

		case 'level_up':
			return (
				<>
					{isOwn ? 'Вы получили' : `${event.userName} получил(а)`} {event.level} уровень
				</>
			);

		case 'streak':
			return (
				<>
					{isOwn ? 'Вы выполняете' : `${event.userName} выполняет`} цели{' '}
					{pluralize(event.streakDays ?? 0, ['день', 'дня', 'дней'])} подряд
				</>
			);

		case 'return_after_pause':
			return (
				<>
					{isOwn ? 'Вы вернулись' : `${event.userName} вернулся(лась)`} к списку{' '}
					<ListLink code={event.listCode} title={event.listName} /> после{' '}
					{pluralize(event.pauseDays ?? 0, ['день', 'дня', 'дней'])} паузы
				</>
			);

		case 'list_completed':
			return (
				<>
					{isOwn ? 'Вы завершили' : `${event.userName} завершил(а)`} список{' '}
					<ListLink code={event.listCode} title={event.listName} />
				</>
			);

		case 'goal_taken_from_your_list':
			return (
				<>
					{isOwn ? 'Вы добавили' : `${event.userName} добавил(а)`} к себе цель{' '}
					<GoalLink code={event.sourceGoalCode} title={event.sourceGoalTitle} /> из{' '}
					{isSourceViewer ? 'вашего списка' : `списка ${event.sourceUserName ?? ''}`}
				</>
			);

		case 'popular_goal_completed':
			return (
				<>
					{isOwn ? 'Вы завершили' : `${event.userName} завершил(а)`} цель{' '}
					<GoalLink code={event.goalCode} title={event.goalTitle} />, которая есть у {event.friendsWithSameGoalCount ?? 0} ваших
					друзей
				</>
			);

		case 'daily_stats': {
			const goalsCount = event.goalsCount ?? 0;
			const listsCount = event.listsCount ?? 0;
			const goalsText = pluralize(goalsCount, ['цель', 'цели', 'целей']);
			const listsText = pluralize(listsCount, ['список', 'списка', 'списков']);

			return (
				<>
					Вчера {isOwn ? 'вы выполнили' : `${event.userName} выполнил(а)`} {goalsText} и {listsText}.
				</>
			);
		}

		case 'weekly_leader':
			return (
				<>
					{isOwn ? 'Вы заняли' : `${event.userName} занял(а)`} {event.placeInLeaders} место в «Лидерах недели»
				</>
			);

		case 'goal_review':
			return (
				<>
					{isOwn ? 'Вы оставили' : `${event.userName} оставил(а)`} впечатление на цель{' '}
					<GoalLink code={event.goalCode} title={event.goalTitle} />
				</>
			);

		case 'list_review':
			return (
				<>
					{isOwn ? 'Вы оставили' : `${event.userName} оставил(а)`} впечатление на список{' '}
					<ListLink code={event.listCode} title={event.listName} />
				</>
			);

		case 'friend_added':
			if (isOwn || isSourceViewer) {
				const friendName = isOwn ? event.sourceUserName : event.userName;
				return <>Вы и {friendName ?? 'друг'} теперь друзья</>;
			}
			return (
				<>
					{event.userName} и {event.sourceUserName} теперь друзья
				</>
			);

		default:
			return null;
	}
};

export const FriendsNewsFeed: FC = observer(() => {
	const [block, element] = useBem('friends-news-feed');
	const [events, setEvents] = useState<FriendsNewsEvent[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const [hasMore, setHasMore] = useState(false);
	const [nextPage, setNextPage] = useState<number | null>(null);
	const [error, setError] = useState<string | null>(null);

	const loadMoreRef = useRef<HTMLDivElement>(null);
	const isLoadingMoreRef = useRef(false);
	const paginationRef = useRef({nextPage, hasMore});
	paginationRef.current = {nextPage, hasMore};

	const currentUserId = UserStore.userSelf.id;

	useEffect(() => {
		let isMounted = true;

		(async () => {
			setIsLoading(true);
			setError(null);
			try {
				const response = await getFriendsFeed(1);
				if (!isMounted) return;
				setEvents(response.results);
				setHasMore(response.hasMore);
				setNextPage(response.nextPage);
			} catch (e) {
				if (!isMounted) return;
				setError(e instanceof Error ? e.message : 'Не удалось загрузить ленту друзей');
			} finally {
				if (isMounted) setIsLoading(false);
			}
		})();

		return () => {
			isMounted = false;
		};
	}, []);

	const loadMore = useCallback(async () => {
		const {nextPage: page, hasMore: more} = paginationRef.current;
		if (!page || !more || isLoadingMoreRef.current) return;

		isLoadingMoreRef.current = true;
		setIsLoadingMore(true);
		try {
			const response = await getFriendsFeed(page);
			setEvents((prev) => [...prev, ...response.results]);
			setHasMore(response.hasMore);
			setNextPage(response.nextPage);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось загрузить ленту друзей');
		} finally {
			isLoadingMoreRef.current = false;
			setIsLoadingMore(false);
		}
	}, []);

	useEffect(() => {
		if (!hasMore || isLoading) return;

		const intersectionObserver = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting) {
					loadMore();
				}
			},
			{rootMargin: '400px'}
		);

		const ref = loadMoreRef.current;
		if (ref) {
			intersectionObserver.observe(ref);
		}

		return () => {
			if (ref) {
				intersectionObserver.unobserve(ref);
			}
		};
	}, [hasMore, isLoading, loadMore, events.length]);

	const toggleLike = async (id: string) => {
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

		try {
			const result = await toggleFeedEventLike(id);
			setEvents((prev) =>
				prev.map((event) => (event.id === id ? {...event, likedByMe: result.likedByMe, likesCount: result.likesCount} : event))
			);
		} catch {
			// откатываем оптимистичное обновление при ошибке
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
		}
	};

	if (isLoading) {
		return (
			<section className={block()}>
				<FriendsNewsFeedSkeleton />
			</section>
		);
	}

	return (
		<section className={block({empty: events.length === 0})}>
			{error && events.length === 0 ? (
				<EmptyState title="Не удалось загрузить ленту друзей" description={error} />
			) : events.length === 0 ? (
				<EmptyState
					title="Пока нет событий от друзей"
					description="Добавьте друзей и выполняйте цели вместе — здесь будет появляться их активность."
				/>
			) : (
				<div className={element('list')}>
					{events.map((event) => {
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
											{buildEventContent(event, currentUserId)}
										</Title>
										{event.type === 'daily_stats' && (event.completedGoals?.length || event.completedLists?.length) ? (
											<div className={element('details')}>
												{!!event.completedGoals?.length && (
													<div className={element('details-row')}>
														<span className={element('details-label')}>Цели:</span>
														<span className={element('details-value')}>
															<CompletedItemsList items={event.completedGoals} />
														</span>
													</div>
												)}
												{!!event.completedLists?.length && (
													<div className={element('details-row')}>
														<span className={element('details-label')}>Списки:</span>
														<span className={element('details-value')}>
															<CompletedItemsList items={event.completedLists} isList />
														</span>
													</div>
												)}
											</div>
										) : null}
										{event.type === 'achievement' && (event.achievementDescription || event.achievementIsSecret) && (
											<div className={element('details')}>
												<div className={element('details-row')}>
													<span className={element('details-value')}>
														Получено за: {event.achievementDescription ?? 'Совершенно секретно'}
													</span>
												</div>
											</div>
										)}
										{(event.type === 'goal_review' || event.type === 'list_review') && event.reviewText && (
											<div className={element('details')}>
												<div className={element('details-row')}>
													<span className={element('details-value')}>«{event.reviewText}»</span>
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
									onClick={() => toggleLike(event.id)}
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

					{hasMore && (
						<div ref={loadMoreRef} className={element('load-more-sentinel')}>
							<Loader isLoading={isLoadingMore} />
						</div>
					)}
				</div>
			)}
		</section>
	);
});
