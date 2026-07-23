/**
 * Создает функцию, которая откладывает вызов переданной функции до тех пор,
 * пока не пройдет указанное количество миллисекунд с момента последнего вызова.
 *
 * @param func Функция, вызов которой нужно отложить
 * @param wait Время ожидания в миллисекундах
 * @param immediate Если true, функция будет вызвана немедленно при первом вызове
 * @returns Функция с отложенным вызовом
 */
export const debounce = <T extends (...args: any[]) => any>(
	func: T,
	wait: number,
	immediate = false
): ((...args: Parameters<T>) => void) => {
	let timeout: ReturnType<typeof setTimeout> | null = null;

	return function (this: any, ...args: Parameters<T>): void {
		const later = () => {
			timeout = null;
			if (!immediate) func.apply(this, args);
		};

		const callNow = immediate && !timeout;

		if (timeout) {
			clearTimeout(timeout);
		}

		timeout = setTimeout(later, wait);

		if (callNow) {
			func.apply(this, args);
		}
	};
};
