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
 * @param maxRetries - Максимальное количество повторов (по умолчанию 3 для лучшей совместимости с backend)
 * @param baseDelay - Базовая задержка в секундах (по умолчанию 1)
 * @param exponentialBackoff - Использовать экспоненциальную задержку (по умолчанию true)
 */
export const withRetry = async <T extends ApiResponse>(
	apiCall: () => Promise<T>,
	maxRetries = 3,
	baseDelay = 1,
	exponentialBackoff = true
): Promise<T> => {
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

				// Рассчитываем задержку
				let delay = retryAfter;

				if (exponentialBackoff && retryCount > 0) {
					// Экспоненциальная задержка с jitter для избежания thundering herd
					delay = baseDelay * 2 ** retryCount + Math.random() * 0.5;
				} else {
					// Линейная задержка с небольшим jitter
					delay = retryAfter + Math.random() * 0.5;
				}

				// Минимальная задержка для IGDB API
				if (apiName.toLowerCase().includes('igdb')) {
					delay = Math.max(delay, 0.3);
				}

				// Ждем рассчитанное время
				await sleep(delay * 1000);

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
 * @param apiFunction - API функция для оборачивания
 * @param maxRetries - Максимальное количество повторов
 * @param baseDelay - Базовая задержка в секундах
 * @param exponentialBackoff - Использовать экспоненциальную задержку
 */
export const withApiRetry = <T extends any[], R extends ApiResponse>(
	apiFunction: (...args: T) => Promise<R>,
	maxRetries = 3,
	baseDelay = 1,
	exponentialBackoff = true
) => {
	return async (...args: T): Promise<R> => {
		return withRetry(() => apiFunction(...args), maxRetries, baseDelay, exponentialBackoff);
	};
};

/**
 * Специальная версия retry для автопарсера с пониженными лимитами
 * для более быстрой обработки batch'ей
 */
export const withAutoParserRetry = <T extends ApiResponse>(apiCall: () => Promise<T>): Promise<T> => {
	return withRetry(apiCall, 2, 0.5, true); // Меньше попыток, но быстрее
};
