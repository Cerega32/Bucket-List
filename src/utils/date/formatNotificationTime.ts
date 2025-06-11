export const formatNotificationTime = (date: Date): string => {
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffMins = Math.floor(diffMs / (1000 * 60));
	const diffHours = Math.floor(diffMins / 60);
	const diffDays = Math.floor(diffHours / 24);

	if (diffMins < 1) return 'Только что';
	if (diffMins < 60) return `${diffMins} мин назад`;
	if (diffHours < 24) return `${diffHours} ч назад`;
	if (diffDays < 7) return `${diffDays} дн назад`;

	return date.toLocaleDateString('ru-RU');
};
