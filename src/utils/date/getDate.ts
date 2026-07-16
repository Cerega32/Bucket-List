export const getDate = (apiDate: string) => {
	const date = new Date(apiDate);

	const getMonthName = (month: number) => {
		const monthNames = [
			'января',
			'февраля',
			'марта',
			'апреля',
			'мая',
			'июня',
			'июля',
			'августа',
			'сентября',
			'октября',
			'ноября',
			'декабря',
		];
		return monthNames[month];
	};

	return `${date.getDate()} ${getMonthName(date.getMonth())} ${date.getFullYear()}`;
};

export const getMonthShortName = (date: string) => {
	const monthNames = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
	const month = new Date(date).getMonth();
	return monthNames[month];
};
