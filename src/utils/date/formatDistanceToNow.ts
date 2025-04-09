const getDayWord = (days: number): string => {
	if (days % 10 === 1 && days % 100 !== 11) {
		return 'день';
	}
	if ([2, 3, 4].includes(days % 10) && ![12, 13, 14].includes(days % 100)) {
		return 'дня';
	}
	return 'дней';
};

const getHourWord = (hours: number): string => {
	if (hours % 10 === 1 && hours % 100 !== 11) {
		return 'час';
	}
	if ([2, 3, 4].includes(hours % 10) && ![12, 13, 14].includes(hours % 100)) {
		return 'часа';
	}
	return 'часов';
};

const getMinuteWord = (minutes: number): string => {
	if (minutes % 10 === 1 && minutes % 100 !== 11) {
		return 'минута';
	}
	if ([2, 3, 4].includes(minutes % 10) && ![12, 13, 14].includes(minutes % 100)) {
		return 'минуты';
	}
	return 'минут';
};

export const formatDistanceToNow = (date: Date): string => {
	const now = new Date();
	const diffTime = date.getTime() - now.getTime();
	const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
	const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
	const diffMinutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));

	if (diffDays < 0 || (diffDays === 0 && diffHours < 0) || (diffDays === 0 && diffHours === 0 && diffMinutes < 0)) {
		return 'Время истекло';
	}

	if (diffDays > 0) {
		return `${diffDays} ${getDayWord(diffDays)}`;
	}

	if (diffHours > 0) {
		return `${diffHours} ${getHourWord(diffHours)}`;
	}

	return `${diffMinutes} ${getMinuteWord(diffMinutes)}`;
};
