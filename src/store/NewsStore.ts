import {action, makeObservable, observable, runInAction} from 'mobx';

import {News, NewsComment, NewsCommentCreate, NewsCommentsResponse, NewsListResponse} from '@/typings/news';
import {
	addNewsComment,
	deleteNewsComment,
	fetchNews,
	fetchNewsComments,
	fetchNewsDetail,
	searchNews,
	updateNewsComment,
} from '@/utils/api/newsApi';

export class NewsStore {
	// Состояние новостей
	news: News[] = [];

	currentNews: News | null = null;

	totalNews = 0;

	currentPage = 1;

	hasMoreNews = true;

	// Состояние комментариев
	comments: NewsComment[] = [];

	totalComments = 0;

	commentsPage = 1;

	hasMoreComments = true;

	// Состояние загрузки
	loading = false;

	commentsLoading = false;

	// Состояние поиска
	searchQuery = '';

	searchResults: News[] = [];

	searchLoading = false;

	// Ошибки
	error: string | null = null;

	commentsError: string | null = null;

	constructor() {
		makeObservable(this, {
			// Observables
			news: observable,
			currentNews: observable,
			totalNews: observable,
			currentPage: observable,
			hasMoreNews: observable,
			comments: observable,
			totalComments: observable,
			commentsPage: observable,
			hasMoreComments: observable,
			loading: observable,
			commentsLoading: observable,
			searchQuery: observable,
			searchResults: observable,
			searchLoading: observable,
			error: observable,
			commentsError: observable,

			// Actions
			setLoading: action,
			setCommentsLoading: action,
			setError: action,
			setCommentsError: action,
			setSearchQuery: action,
			clearSearch: action,
			loadNews: action,
			loadMoreNews: action,
			loadNewsDetail: action,
			searchNewsAction: action,
			loadComments: action,
			loadMoreComments: action,
			addComment: action,
			updateComment: action,
			deleteComment: action,
			loadReplies: action,
			reset: action,
		});
	}

	// Сеттеры для состояния загрузки
	setLoading = (loading: boolean) => {
		this.loading = loading;
	};

	setCommentsLoading = (loading: boolean) => {
		this.commentsLoading = loading;
	};

	setError = (error: string | null) => {
		this.error = error;
	};

	setCommentsError = (error: string | null) => {
		this.commentsError = error;
	};

	setSearchQuery = (query: string) => {
		this.searchQuery = query;
	};

	clearSearch = () => {
		this.searchQuery = '';
		this.searchResults = [];
	};

	// Загрузка списка новостей
	loadNews = async (page = 1, pageSize = 10) => {
		this.setLoading(true);
		this.setError(null);

		try {
			const response: NewsListResponse = await fetchNews(page, pageSize);

			runInAction(() => {
				if (page === 1) {
					this.news = response.results;
				} else {
					this.news = [...this.news, ...response.results];
				}

				this.totalNews = response.count;
				this.currentPage = page;
				this.hasMoreNews = !!response.next;
			});
		} catch (error) {
			runInAction(() => {
				this.setError(error instanceof Error ? error.message : 'Ошибка загрузки новостей');
			});
		} finally {
			runInAction(() => {
				this.setLoading(false);
			});
		}
	};

	// Загрузка дополнительных новостей
	loadMoreNews = async () => {
		if (!this.hasMoreNews || this.loading) return;

		await this.loadNews(this.currentPage + 1);
	};

	// Загрузка детальной новости
	loadNewsDetail = async (id: number) => {
		this.setLoading(true);
		this.setError(null);

		try {
			const news = await fetchNewsDetail(id);

			runInAction(() => {
				this.currentNews = news;
			});
		} catch (error) {
			runInAction(() => {
				this.setError(error instanceof Error ? error.message : 'Ошибка загрузки новости');
			});
		} finally {
			runInAction(() => {
				this.setLoading(false);
			});
		}
	};

	// Поиск новостей
	searchNewsAction = async (query: string, page = 1) => {
		this.searchLoading = true;
		this.setError(null);
		this.setSearchQuery(query);

		try {
			const response = await searchNews(query, page);

			runInAction(() => {
				if (page === 1) {
					this.searchResults = response.results;
				} else {
					this.searchResults = [...this.searchResults, ...response.results];
				}
			});
		} catch (error) {
			runInAction(() => {
				this.setError(error instanceof Error ? error.message : 'Ошибка поиска');
			});
		} finally {
			runInAction(() => {
				this.searchLoading = false;
			});
		}
	};

	// Загрузка комментариев
	loadComments = async (newsId: number, page = 1, pageSize = 50) => {
		this.setCommentsLoading(true);
		this.setCommentsError(null);

		try {
			const response: NewsCommentsResponse = await fetchNewsComments(newsId, page, pageSize);

			runInAction(() => {
				if (page === 1) {
					this.comments = response.results;
				} else {
					this.comments = [...this.comments, ...response.results];
				}

				this.updateTotalComments();
				this.commentsPage = page;
				this.hasMoreComments = !!response.next;
			});
		} catch (error) {
			runInAction(() => {
				this.setCommentsError(error instanceof Error ? error.message : 'Ошибка загрузки комментариев');
			});
		} finally {
			runInAction(() => {
				this.setCommentsLoading(false);
			});
		}
	};

	// Загрузка дополнительных комментариев
	loadMoreComments = async (newsId: number) => {
		if (!this.hasMoreComments || this.commentsLoading) return;

		await this.loadComments(newsId, this.commentsPage + 1);
	};

	// Добавление комментария
	addComment = async (newsId: number, commentData: NewsCommentCreate) => {
		this.setCommentsError(null);

		try {
			const newComment = await addNewsComment(newsId, commentData);

			runInAction(() => {
				if (commentData.parent) {
					// Если это ответ, добавляем к родительскому комментарию
					this.comments = this.addReplyToComment(this.comments, commentData.parent, newComment);
				} else {
					// Если это корневой комментарий, добавляем в начало списка
					this.comments.unshift(newComment);
				}

				// Обновляем счетчик комментариев рекурсивно
				this.updateTotalComments();

				// Обновляем счетчик комментариев в текущей новости
				if (this.currentNews && this.currentNews.id === newsId) {
					this.currentNews.commentsCount += 1;
				}
			});

			return newComment;
		} catch (error) {
			runInAction(() => {
				this.setCommentsError(error instanceof Error ? error.message : 'Ошибка добавления комментария');
			});
			throw error;
		}
	};

	// Обновление комментария
	updateComment = async (newsId: number, commentId: number, content: string) => {
		try {
			const updatedComment = await updateNewsComment(newsId, commentId, content);

			runInAction(() => {
				// Обновляем комментарий в списке
				const commentIndex = this.comments.findIndex((c) => c.id === commentId);
				if (commentIndex !== -1) {
					this.comments[commentIndex] = updatedComment;
				} else {
					// Ищем в ответах и обновляем без мутации
					this.comments = this.comments.map((comment) => {
						if (comment.replies) {
							const replyIndex = comment.replies.findIndex((r) => r.id === commentId);
							if (replyIndex !== -1) {
								return {
									...comment,
									replies: comment.replies.map((reply, index) => (index === replyIndex ? updatedComment : reply)),
								};
							}
						}
						return comment;
					});
				}
			});

			return updatedComment;
		} catch (error) {
			runInAction(() => {
				this.setCommentsError(error instanceof Error ? error.message : 'Ошибка обновления комментария');
			});
			throw error;
		}
	};

	// Удаление комментария
	deleteComment = async (newsId: number, commentId: number) => {
		try {
			await deleteNewsComment(newsId, commentId);

			runInAction(() => {
				// Удаляем комментарий из списка
				this.comments = this.removeCommentFromList(this.comments, commentId);

				// Обновляем счетчик комментариев рекурсивно
				this.updateTotalComments();

				// Обновляем счетчик комментариев в текущей новости
				if (this.currentNews && this.currentNews.id === newsId) {
					this.currentNews.commentsCount -= 1;
				}
			});
		} catch (error) {
			runInAction(() => {
				this.setCommentsError(error instanceof Error ? error.message : 'Ошибка удаления комментария');
			});
			throw error;
		}
	};

	// Сброс состояния
	reset = () => {
		this.news = [];
		this.currentNews = null;
		this.totalNews = 0;
		this.currentPage = 1;
		this.hasMoreNews = true;
		this.comments = [];
		this.totalComments = 0;
		this.commentsPage = 1;
		this.hasMoreComments = true;
		this.loading = false;
		this.commentsLoading = false;
		this.searchQuery = '';
		this.searchResults = [];
		this.searchLoading = false;
		this.error = null;
		this.commentsError = null;
	};

	// Вспомогательный метод для добавления ответа к комментарию
	private addReplyToComment = (comments: NewsComment[], parentId: number, reply: NewsComment): NewsComment[] => {
		return comments.map((comment) => {
			if (comment.id === parentId) {
				return {
					...comment,
					replies: [...(comment.replies || []), reply],
					repliesCount: comment.repliesCount + 1,
				};
			}
			if (comment.replies && comment.replies.length > 0) {
				return {
					...comment,
					replies: this.addReplyToComment(comment.replies, parentId, reply),
				};
			}
			return comment;
		});
	};

	// Вспомогательный метод для удаления комментария
	private removeCommentFromList = (comments: NewsComment[], commentId: number): NewsComment[] => {
		return comments
			.filter((comment) => comment.id !== commentId)
			.map((comment) => {
				if (comment.replies && comment.replies.length > 0) {
					return {
						...comment,
						replies: this.removeCommentFromList(comment.replies, commentId),
					};
				}
				return comment;
			});
	};

	// Вспомогательный метод для подсчета всех комментариев включая вложенные
	private countAllComments = (comments: NewsComment[]): number => {
		return comments.reduce((total, comment) => {
			let count = 1; // Сам комментарий
			if (comment.replies && comment.replies.length > 0) {
				count += this.countAllComments(comment.replies); // Рекурсивно считаем ответы
			}
			return total + count;
		}, 0);
	};

	// Обновление totalComments с учетом всех вложенных комментариев
	private updateTotalComments = () => {
		this.totalComments = this.countAllComments(this.comments);
	};
}

export const newsStore = new NewsStore();
