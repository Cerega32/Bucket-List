/* eslint-disable no-await-in-loop */
/* eslint-disable no-continue */
/**
 * Утилита для автоматического повтора API запросов при получении 429 ошибки
 */

interface ApiResponse {
	success: boolean;
	errors?: any;
	data?: any;
}

const sleep = (ms: number): Promise<void> =>
	new Promise((resolve) => {
		setTimeout(resolve, ms);
	});

/**
 * Выполняет API запрос с автоматическим повтором при rate limiting
 * @param apiCall - Функция выполнения API запроса
 * @param maxRetries - Максимальное количество повторов (по умолчанию 2)
 * @param baseDelay - Базовая задержка в секундах (по умолчанию 1)
 */
export const withRetry = async <T extends ApiResponse>(apiCall: () => Promise<T>, maxRetries = 2, baseDelay = 1): Promise<T> => {
	let retryCount = 0;

	while (retryCount <= maxRetries) {
		const response = await apiCall();

		// Если запрос успешен, возвращаем результат
		if (response.success) {
			return response;
		}

		// Проверяем, является ли это 429 ошибкой (rate limit)
		if (response.errors && retryCount < maxRetries) {
			const isRateLimitError =
				typeof response.errors === 'object' && ('retry_after' in response.errors || 'api_name' in response.errors);

			if (isRateLimitError) {
				const retryAfter = (response.errors as any).retry_after || baseDelay;
				const apiName = (response.errors as any).api_name || 'API';

				console.log(
					`${apiName} rate limit exceeded, retrying after ${retryAfter} seconds... (attempt ${retryCount + 1}/${maxRetries})`
				);

				// Ждем указанное время + небольшая случайная задержка для избежания thundering herd
				const delay = (retryAfter + Math.random() * 0.5) * 1000;
				await sleep(delay);

				retryCount++;
				continue;
			}
		}

		// Если это не rate limit ошибка или превышено количество попыток, возвращаем как есть
		return response;
	}

	// Этот код никогда не должен выполниться, но на всякий случай
	return apiCall();
};

/**
 * Декоратор для автоматического добавления retry логики к API функциям
 */
export const withApiRetry = <T extends any[], R extends ApiResponse>(
	apiFunction: (...args: T) => Promise<R>,
	maxRetries = 2,
	baseDelay = 1
) => {
	return async (...args: T): Promise<R> => {
		return withRetry(() => apiFunction(...args), maxRetries, baseDelay);
	};
};
