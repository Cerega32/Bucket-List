const MESSAGE_BY_STATUS: Record<number, string> = {
	429: 'Слишком много попыток. Подождите минуту и попробуйте снова.',
};

const isTechnicalErrorMessage = (message: string): boolean =>
	/non-json|failed to fetch|network error|status:\s*\d+|unexpected token|<!doctype/i.test(message);

const messageByHttpStatus = (status: number, fallback: string): string => {
	if (MESSAGE_BY_STATUS[status]) {
		return MESSAGE_BY_STATUS[status];
	}
	if (status >= 500) {
		return 'Сервер временно недоступен. Попробуйте позже.';
	}
	return fallback;
};

/** Преобразует технические сообщения fetch/API в текст для пользователя. */
export const getUserFacingFetchError = (value: unknown, fallback = 'Что-то пошло не так. Попробуйте позже.'): string => {
	if (typeof value !== 'string') {
		return fallback;
	}

	const message = value.trim();
	if (!message) {
		return fallback;
	}

	if (!isTechnicalErrorMessage(message)) {
		return message;
	}

	const statusMatch = message.match(/Status:\s*(\d+)/i);
	if (statusMatch) {
		return messageByHttpStatus(Number(statusMatch[1]), fallback);
	}

	if (/429/.test(message)) {
		return MESSAGE_BY_STATUS[429];
	}

	if (/failed to fetch|network error/i.test(message)) {
		return 'Проблема с подключением. Проверьте интернет и попробуйте снова.';
	}

	return fallback;
};

export const getUserFacingHttpStatusError = (status: number, fallback = 'Что-то пошло не так. Попробуйте позже.'): string =>
	messageByHttpStatus(status, fallback);
