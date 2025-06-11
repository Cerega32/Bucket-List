import {DELETE, GET, POST} from '@/utils/fetch/requests';

export interface Friend {
	id: number;
	username: string;
	first_name: string;
	last_name: string;
	status: string;
	created_at: string;
}

export interface FriendRequest {
	request_id: number;
	id: number;
	username: string;
	first_name: string;
	last_name: string;
	created_at: string;
}

export interface User {
	id: number;
	username: string;
	email: string;
	first_name: string;
	last_name: string;
	friends_count: number;
	pending_requests_count: number;
}

export interface ComparisonData {
	user: {
		id: number;
		username: string;
		first_name: string;
		last_name: string;
		activity: {
			goals_completed: number;
			lists_completed: number;
			total_completed: number;
			latest_completion: string | null;
		};
	};
	friend: {
		id: number;
		username: string;
		first_name: string;
		last_name: string;
		activity: {
			goals_completed: number;
			lists_completed: number;
			total_completed: number;
			latest_completion: string | null;
		};
	};
}

/**
 * Получение списка друзей пользователя
 */
export const getFriends = async (): Promise<{success: boolean; data?: Friend[]; error?: string}> => {
	try {
		const response = await GET('friends', {
			auth: true,
			showErrorNotification: true,
		});

		if (response.success && response.data) {
			return {
				success: true,
				data: response.data.results,
			};
		}

		return {
			success: false,
			error: response.errors || 'Не удалось получить список друзей',
		};
	} catch (error) {
		return {
			success: false,
			error: 'Произошла ошибка при получении списка друзей',
		};
	}
};

/**
 * Получение списка входящих запросов на дружбу
 */
export const getFriendRequests = async (): Promise<{success: boolean; data?: FriendRequest[]; error?: string}> => {
	try {
		const response = await GET('friends/requests', {
			auth: true,
			showErrorNotification: true,
		});

		if (response.success && response.data) {
			return {
				success: true,
				data: response.data.results,
			};
		}

		return {
			success: false,
			error: response.errors || 'Не удалось получить запросы на дружбу',
		};
	} catch (error) {
		return {
			success: false,
			error: 'Произошла ошибка при получении запросов на дружбу',
		};
	}
};

/**
 * Отправка запроса на дружбу
 * @param userId ID пользователя, которому отправляется запрос
 */
export const sendFriendRequest = async (userId: number): Promise<{success: boolean; message?: string; error?: string}> => {
	try {
		const response = await POST('friends/send-request', {
			auth: true,
			body: {user_id: userId},
			showSuccessNotification: true,
			showErrorNotification: true,
		});

		if (response.success) {
			return {
				success: true,
				message: response.message || 'Запрос на дружбу отправлен',
			};
		}

		return {
			success: false,
			error: response.errors || 'Не удалось отправить запрос на дружбу',
		};
	} catch (error) {
		return {
			success: false,
			error: 'Произошла ошибка при отправке запроса на дружбу',
		};
	}
};

/**
 * Ответ на запрос дружбы (принять/отклонить)
 * @param requestId ID запроса на дружбу
 * @param action Действие (accept/reject)
 */
export const respondToFriendRequest = async (
	requestId: number,
	action: 'accept' | 'reject'
): Promise<{success: boolean; message?: string; error?: string}> => {
	try {
		const response = await POST('friends/respond', {
			auth: true,
			body: {request_id: requestId, action},
			showSuccessNotification: true,
			showErrorNotification: true,
		});

		if (response.success) {
			return {
				success: true,
				message: response.message || `Запрос на дружбу ${action === 'accept' ? 'принят' : 'отклонен'}`,
			};
		}

		return {
			success: false,
			error: response.errors || 'Не удалось обработать запрос на дружбу',
		};
	} catch (error) {
		return {
			success: false,
			error: 'Произошла ошибка при обработке запроса на дружбу',
		};
	}
};

/**
 * Удаление друга
 * @param friendId ID друга, которого нужно удалить
 */
export const removeFriend = async (friendId: number): Promise<{success: boolean; message?: string; error?: string}> => {
	try {
		const response = await DELETE(`friends/remove/${friendId}`, {
			auth: true,
			showSuccessNotification: true,
			showErrorNotification: true,
		});

		if (response.success) {
			return {
				success: true,
				message: response.message || 'Пользователь удален из списка друзей',
			};
		}

		return {
			success: false,
			error: response.errors || 'Не удалось удалить пользователя из списка друзей',
		};
	} catch (error) {
		return {
			success: false,
			error: 'Произошла ошибка при удалении друга',
		};
	}
};

/**
 * Поиск пользователей
 * @param query Поисковый запрос
 */
export const searchUsers = async (query: string): Promise<{success: boolean; data?: User[]; error?: string}> => {
	try {
		if (!query || query.length < 3) {
			return {
				success: false,
				error: 'Для поиска необходимо ввести не менее 3 символов',
			};
		}

		const response = await GET('friends/search', {
			auth: true,
			get: {query},
			showErrorNotification: true,
		});

		if (response.success && response.data) {
			return {
				success: true,
				data: response.data.results,
			};
		}

		return {
			success: false,
			error: response.errors || 'Не удалось выполнить поиск пользователей',
		};
	} catch (error) {
		return {
			success: false,
			error: 'Произошла ошибка при поиске пользователей',
		};
	}
};

/**
 * Сравнение активности с другом
 * @param friendId ID друга для сравнения
 */
export const compareWithFriend = async (friendId: number): Promise<{success: boolean; data?: ComparisonData; error?: string}> => {
	try {
		const response = await GET(`friends/compare/${friendId}`, {
			auth: true,
			showErrorNotification: true,
		});

		if (response.success && response.data) {
			return {
				success: true,
				data: response.data,
			};
		}

		return {
			success: false,
			error: response.errors || 'Не удалось получить данные для сравнения',
		};
	} catch (error) {
		return {
			success: false,
			error: 'Произошла ошибка при сравнении с другом',
		};
	}
};
