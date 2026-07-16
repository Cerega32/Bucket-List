import {IComplexity} from '@/typings/goal';

export const getComplexity = {
	hard: 'Тяжело',
	medium: 'Средне',
	easy: 'Легко',
};

export const getComplexityCategory = {
	hard: 'Тяжелая категория',
	medium: 'Средняя категория',
	easy: 'Легкая категория',
};

export const getComplexityCategoryPlural = {
	hard: 'Невероятно! Ты сделал невозможное возможным',
	medium: 'Ты доказал: упорство творит чудеса',
	easy: 'Ты разогрелся! Первая вершина покорена',
};

export const getComplexityCategoryCompletedHint = {
	easy: '«Путь в тысячу миль начинается с одного шага» — Лао-цзы',
	medium:
		'«Я не боюсь человека, который отработал десять тысяч ударов по одному разу. ' +
		'Я боюсь того, кто отработал один удар десять тысяч раз» — Брюс Ли',
	hard: '«Невозможное — лишь громкое слово, за которым прячутся маленькие люди» — Мухаммед Али',
};

export const selectComplexity: Array<{name: string; value: IComplexity}> = [
	{name: 'Легко', value: 'easy'},
	{name: 'Средне', value: 'medium'},
	{name: 'Тяжело', value: 'hard'},
];
