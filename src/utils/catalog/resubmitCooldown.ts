/** Есть активная пауза перед повторной отправкой в каталог. */
export const isCatalogResubmitOnCooldown = (availableAt?: string | null): boolean => {
	if (!availableAt) {
		return false;
	}
	const at = new Date(availableAt).getTime();
	if (Number.isNaN(at)) {
		return false;
	}
	return at > Date.now();
};

/** Человекочитаемая дата/время повторной отправки. */
export const formatCatalogResubmitAvailableAt = (availableAt: string): string => {
	const date = new Date(availableAt);
	if (Number.isNaN(date.getTime())) {
		return availableAt;
	}
	return date.toLocaleString('ru-RU', {
		day: 'numeric',
		month: 'long',
		hour: '2-digit',
		minute: '2-digit',
	});
};
