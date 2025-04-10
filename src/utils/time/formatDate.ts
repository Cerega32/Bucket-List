/**
 * Форматирует строку даты в формате "дд.мм.гггг"
 *
 * @param dateString - строка даты в формате ISO или другом формате, который может обработать конструктор Date
 * @returns отформатированная дата в виде строки
 */
export const formatDateString = (dateString: string): string => {
	const date = new Date(dateString);

	// Получаем день, месяц и год
	const day = date.getDate().toString().padStart(2, '0');
	const month = (date.getMonth() + 1).toString().padStart(2, '0'); // +1 потому что месяцы от 0 до 11
	const year = date.getFullYear();

	return `${day}.${month}.${year}`;
};

/**
 * Форматирует строку даты в более подробном формате с днем недели и месяцем прописью
 *
 * @param dateString - строка даты в формате ISO или другом формате, который может обработать конструктор Date
 * @returns отформатированная дата в виде строки
 */
export const formatDateLong = (dateString: string): string => {
	const date = new Date(dateString);

	// Получаем день, месяц и год
	const options: Intl.DateTimeFormatOptions = {
		weekday: 'long',
		day: 'numeric',
		month: 'long',
		year: 'numeric',
	};

	return date.toLocaleDateString('ru-RU', options);
};
