import {observer} from 'mobx-react-lite';
import React, {useEffect, useState} from 'react';
import {Link, useLocation} from 'react-router-dom';

import {FriendsNewsFeed} from '@/containers/FriendsNewsFeed/FriendsNewsFeed';
import {useBem} from '@/hooks/useBem';
import {newsStore} from '@/store/NewsStore';
import {ThemeStore} from '@/store/ThemeStore';
import {pluralize} from '@/utils/text/pluralize';
import './NewsPage.scss';

export const NewsPage = observer(() => {
	const [searchQuery, setSearchQuery] = useState('');
	const [isSearching, setIsSearching] = useState(false);
	const [block, element] = useBem('news-page');
	const location = useLocation();

	const isFriendsTab = location.pathname.startsWith('/news/friends');

	useEffect(() => {
		// Устанавливаем тему страницы
		ThemeStore.setPage('isNews');
		ThemeStore.setHeader('white');
		ThemeStore.setFull(false);

		// Загружаем новости проекта только для таба "Новости проекта"
		if (!isFriendsTab && newsStore.news.length === 0) {
			newsStore.loadNews();
		}

		// Очистка при размонтировании
		return () => {
			ThemeStore.setPage('isMainPage');
		};
	}, [isFriendsTab]);

	const handleSearch = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!searchQuery.trim() || isSearching) return;

		setIsSearching(true);
		try {
			await newsStore.searchNewsAction(searchQuery.trim());
		} finally {
			setIsSearching(false);
		}
	};

	const handleClearSearch = () => {
		setSearchQuery('');
		newsStore.clearSearch();
	};

	const formatDate = (dateString: string): string => {
		const date = new Date(dateString);
		return date.toLocaleDateString('ru-RU', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
		});
	};

	const displayedNews = newsStore.searchQuery ? newsStore.searchResults : newsStore.news;

	return (
		<div className={block()}>
			<div className={element('container')}>
				{/* Заголовок и табы */}
				<header className={element('header')}>
					<h1>Новости</h1>
					<p>Следите за активностью друзей и обновлениями проекта</p>
					<div className={element('tabs')}>
						<Link to="/news/friends" className={element('tab', {active: isFriendsTab})}>
							Лента друзей
						</Link>
						<Link to="/news/project" className={element('tab', {active: !isFriendsTab})}>
							Новости проекта
						</Link>
					</div>
				</header>

				{isFriendsTab ? (
					<div className={element('content')}>
						<FriendsNewsFeed />
					</div>
				) : (
					<>
						{/* Поиск */}
						<div className={element('search')}>
							<form onSubmit={handleSearch} className={element('search-form')}>
								<input
									type="text"
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									placeholder="Поиск по новостям..."
									className={element('search-input')}
									disabled={isSearching}
								/>
								<button type="submit" disabled={!searchQuery.trim() || isSearching} className={element('search-button')}>
									{isSearching ? 'Поиск...' : 'Найти'}
								</button>
								{newsStore.searchQuery && (
									<button type="button" onClick={handleClearSearch} className={element('search-clear')}>
										Очистить
									</button>
								)}
							</form>
						</div>

						{/* Результаты поиска */}
						{newsStore.searchQuery && (
							<div className={element('search-results')}>
								<p>
									Результаты поиска по запросу: <strong>&ldquo;{newsStore.searchQuery}&rdquo;</strong>
								</p>
							</div>
						)}

						{/* Список новостей проекта */}
						<div className={element('content')}>
							{newsStore.loading && displayedNews.length === 0 ? (
								<div className={element('loading')}>Загрузка новостей...</div>
							) : displayedNews.length === 0 ? (
								<div className={element('empty')}>
									{newsStore.searchQuery ? 'По вашему запросу ничего не найдено' : 'Новостей пока нет'}
								</div>
							) : (
								<>
									<div className={element('news-list')}>
										{displayedNews.map((news) => (
											<article key={news.id} className={element('news-card')}>
												{(news.image || news.featuredImage) && (
													<div className={element('news-card-image')}>
														<Link to={`/news/${news.id}`}>
															<img src={news.image || news.featuredImage} alt={news.title} />
														</Link>
													</div>
												)}
												<div className={element('news-card-content')}>
													<h2 className={element('news-card-title')}>
														<Link to={`/news/${news.id}`}>{news.title}</Link>
													</h2>
													{news.excerpt && <p className={element('news-card-excerpt')}>{news.excerpt}</p>}
													<div className={element('news-card-meta')}>
														<div className={element('news-card-author')}>
															{news.author?.firstName} {news.author?.lastName}
														</div>
														<div className={element('news-card-info')}>
															<span className={element('news-card-date')}>{formatDate(news.createdAt)}</span>
															<span className={element('news-card-comments')}>
																{pluralize(news.commentsCount, [
																	'комментарий',
																	'комментария',
																	'комментариев',
																])}
															</span>
														</div>
													</div>
												</div>
											</article>
										))}
									</div>

									{/* Кнопка загрузки дополнительных новостей */}
									{!newsStore.searchQuery && newsStore.hasMoreNews && (
										<div className={element('load-more')}>
											<button
												onClick={() => newsStore.loadMoreNews()}
												disabled={newsStore.loading}
												className={element('load-more-button')}
												type="button"
											>
												{newsStore.loading ? 'Загрузка...' : 'Загрузить еще'}
											</button>
										</div>
									)}
								</>
							)}
						</div>
					</>
				)}

				{/* Ошибка */}
				{newsStore.error && (
					<div className={element('error')}>
						<p>Ошибка: {newsStore.error}</p>
						<button onClick={() => newsStore.loadNews(1)} className={element('retry-button')} type="button">
							Попробовать снова
						</button>
					</div>
				)}
			</div>
		</div>
	);
});
