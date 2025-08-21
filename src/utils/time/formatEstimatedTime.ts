/**
 * Утилиты для форматирования предполагаемого времени выполнения
 */

import {pluralize} from '../text/pluralize';

/**
 * Форматирует время в секундах в читаемую строку
 * @param seconds - время в секундах
 * @returns отформатированная строка
 */
export const formatEstimatedTime = (seconds: number | null | undefined): string => {
	if (!seconds || seconds <= 0) {
		return '';
	}

	const days = Math.floor(seconds / 86400);
	const hours = Math.floor((seconds % 86400) / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const remainingSeconds = seconds % 60;

	const parts: string[] = [];

	if (days > 0) {
		parts.push(pluralize(days, ['день', 'дня', 'дней']));
	}

	if (hours > 0) {
		parts.push(pluralize(hours, ['час', 'часа', 'часов']));
	}

	if (minutes > 0) {
		parts.push(pluralize(minutes, ['минута', 'минуты', 'минут']));
	}

	// Показываем секунды только если нет дней и часов
	if (remainingSeconds > 0 && days === 0 && hours === 0) {
		parts.push(pluralize(remainingSeconds, ['секунда', 'секунды', 'секунд']));
	}

	return parts.join(' ');
};

/**
 * Форматирует время в секундах в короткую строку (например, "2ч 30м")
 * @param seconds - время в секундах
 * @returns короткая отформатированная строка
 */
export const formatEstimatedTimeShort = (seconds: number | null | undefined): string => {
	if (!seconds || seconds <= 0) {
		return '';
	}

	const days = Math.floor(seconds / 86400);
	const hours = Math.floor((seconds % 86400) / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);

	const parts: string[] = [];

	if (days > 0) {
		parts.push(`${days} д`);
	}

	if (hours > 0) {
		parts.push(`${hours} ч`);
	}

	if (minutes > 0) {
		parts.push(`${minutes} м`);
	}

	// Если время меньше минуты, показываем "< 1м"
	if (parts.length === 0) {
		return '< 1м';
	}

	return parts.join(' ');
};

/**
 * Парсит строку времени из Django DurationField в секунды
 * Django возвращает время в формате "HH:MM:SS" или количество секунд
 * @param timeString - строка времени от Django
 * @returns количество секунд
 */
export const parseDurationFromDjango = (timeString: string | null | undefined): number => {
	if (!timeString) {
		return 0;
	}

	// Если это строка в формате HH:MM:SS или HH:MM
	const timeParts = timeString.split(':');

	if (timeParts.length === 3) {
		// HH:MM:SS
		const hours = parseInt(timeParts[0], 10) || 0;
		const minutes = parseInt(timeParts[1], 10) || 0;
		const seconds = parseInt(timeParts[2], 10) || 0;
		return hours * 3600 + minutes * 60 + seconds;
	}
	if (timeParts.length === 2) {
		// HH:MM (Django DurationField всегда возвращает в формате HH:MM)
		const hours = parseInt(timeParts[0], 10) || 0;
		const minutes = parseInt(timeParts[1], 10) || 0;
		return hours * 3600 + minutes * 60;
	}

	// Если формат неизвестен, возвращаем 0
	return 0;
};

/**
 * Форматирует Django DurationField в читаемую строку
 * @param djangoTime - время от Django (строка или число)
 * @returns отформатированная строка
 */
export const formatDjangoDuration = (djangoTime: string | number | null | undefined): string => {
	if (!djangoTime) {
		return '';
	}

	let seconds: number;

	if (typeof djangoTime === 'number') {
		seconds = djangoTime;
	} else {
		seconds = parseDurationFromDjango(djangoTime);
	}

	return formatEstimatedTime(seconds);
};

/**
 * Форматирует Django DurationField в короткую строку
 * @param djangoTime - время от Django (строка или число)
 * @returns короткая отформатированная строка
 */
export const formatDjangoDurationShort = (djangoTime: string | number | null | undefined): string => {
	if (!djangoTime) {
		return '';
	}

	let seconds: number;

	if (typeof djangoTime === 'number') {
		seconds = djangoTime;
	} else {
		seconds = parseDurationFromDjango(djangoTime);
	}
	return formatEstimatedTimeShort(seconds);
};

/**
 * Валидирует пользовательский ввод времени
 * Поддерживает различные форматы: 5, "5.5", "02:30", "3д5ч", "3 дня 5 часов"
 * @param input - пользовательский ввод
 * @returns true если формат валиден
 */
export const validateTimeInput = (input: string): boolean => {
	if (!input || !input.trim()) {
		return true; // Пустой ввод допустим
	}

	const timeStr = input.trim().toLowerCase();

	// Просто число (часы)
	if (/^\d+\.?\d*$/.test(timeStr)) {
		return true;
	}

	// Промежуточные состояния для формата ЧЧ:ММ (например, "2:", "2:3", "02:30")
	if (/^\d{1,2}:?\d{0,2}(:\d{0,2})?$/.test(timeStr)) {
		return true;
	}

	// Комбинированные форматы (3д5ч, 2ч30м, и т.д.)
	const combinedPattern = /^(\d+\s*[дddays]?\s*)?(\d+\s*[чhours]?\s*)?(\d+\s*[мminutes]?\s*)?(\d+\s*[сseconds]?\s*)?$/;
	if (combinedPattern.test(timeStr.replace(/\s+/g, ''))) {
		return true;
	}

	// Словами (поддержка русских и английских слов)
	const wordsPattern = // eslint-disable-next-line max-len
		/^(\d+\s*(день|дня|дней|день|day|days)?\s*)?(\d+\s*(час|часа|часов|hour|hours)?\s*)?(\d+\s*(минута|минуты|минут|minute|minutes)?\s*)?(\d+\s*(секунда|секунды|секунд|second|seconds)?\s*)?$/;
	if (wordsPattern.test(timeStr)) {
		return true;
	}

	// Разрешаем ввод если строка содержит допустимые символы
	const allowedChars = /^[0-9:дчмсднейячасовминутсекунд\s]+$/i;
	if (allowedChars.test(timeStr)) {
		return true;
	}

	return false;
};

/**
 * Получает подсказку для пользователя о допустимых форматах ввода времени
 * @returns строка с примерами форматов
 */
export const getTimeInputHint = (): string => {
	return 'Примеры: 5 (часы), 02:30, 3д5ч, 3д 5ч, 3 дня 5 часов 30 минут';
};
