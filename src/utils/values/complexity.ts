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

export const selectComplexity: Array<{name: string; value: IComplexity}> = [
	{name: 'Легко', value: 'easy'},
	{name: 'Средне', value: 'medium'},
	{name: 'Тяжело', value: 'hard'},
];
