import {useCallback, useEffect, useState} from 'react';

import {NotificationStore} from '@/store/NotificationStore';
import {ICategory, IGoal} from '@/typings/goal';
import {getSimilarGoals} from '@/utils/api/get/getSimilarGoals';
import {debounce} from '@/utils/time/debounce';
import {selectComplexity} from '@/utils/values/complexity';

interface UseSimilarGoalsProps {
	title: string;
	categories: ICategory[];
	parentCategories: ICategory[];
	setTitle: (value: string) => void;
	setDescription: (value: string) => void;
	setEstimatedTime: (value: string) => void;
	setActiveComplexity: (value: number | null) => void;
	setActiveCategory: (value: number | null) => void;
	setActiveSubcategory: (value: number | null) => void;
	setSubcategories: (value: ICategory[]) => void;
}

interface UseSimilarGoalsReturn {
	similarGoals: IGoal[];
	showSimilarGoals: boolean;
	setShowSimilarGoals: (value: boolean) => void;
	handleTitleFocus: () => void;
	handleTitleBlur: () => void;
	fillFormWithGoalData: (goal: IGoal) => void;
}

export const useSimilarGoals = ({
	title,
	categories,
	parentCategories,
	setTitle,
	setDescription,
	setEstimatedTime,
	setActiveComplexity,
	setActiveCategory,
	setActiveSubcategory,
	setSubcategories,
}: UseSimilarGoalsProps): UseSimilarGoalsReturn => {
	const [similarGoals, setSimilarGoals] = useState<IGoal[]>([]);
	const [, setIsSearching] = useState(false);
	const [showSimilarGoals, setShowSimilarGoals] = useState(false);

	// Функция для поиска похожих целей с дебаунсом
	const debouncedSearchSimilarGoals = useCallback(
		debounce(async (query: string) => {
			if (query.length < 3) {
				setSimilarGoals([]);
				setIsSearching(false);
				return;
			}

			try {
				const response = await getSimilarGoals(query);

				if (response.success && response.data?.results) {
					setSimilarGoals(response.data.results.slice(0, 5)); // Ограничиваем до 5 результатов
				}
			} catch (error) {
				console.error('Ошибка при поиске похожих целей:', error);
			} finally {
				setIsSearching(false);
			}
		}, 500),
		[]
	);

	// Вызов поиска при изменении названия цели
	useEffect(() => {
		if (title) {
			setIsSearching(true);
			debouncedSearchSimilarGoals(title);
		} else {
			setSimilarGoals([]);
			setShowSimilarGoals(false);
		}
	}, [title, debouncedSearchSimilarGoals]);

	// Обработчики фокуса для поля ввода названия
	const handleTitleFocus = () => {
		if (similarGoals.length > 0) {
			setShowSimilarGoals(true);
		}
	};

	const handleTitleBlur = () => {
		// Используем setTimeout, чтобы дать время для клика по элементу списка
		setTimeout(() => {
			setShowSimilarGoals(false);
		}, 200);
	};

	// Функция для заполнения полей формы данными из выбранной цели
	const fillFormWithGoalData = (goal: IGoal) => {
		setTitle(goal.title);
		setDescription(goal.description);
		setEstimatedTime(goal.estimatedTime || '');

		// Находим индекс сложности в массиве selectComplexity
		const complexityIndex = selectComplexity.findIndex((item) => item.value === goal.complexity);
		if (complexityIndex !== -1) {
			setActiveComplexity(complexityIndex);
		}

		// Определяем, является ли категория цели подкатегорией
		const goalCategory = categories.find((cat) => cat.id === goal.category.id);

		if (goalCategory) {
			if (goalCategory.parentCategory) {
				// Если это подкатегория, находим её родительскую категорию
				const parentCategoryIndex = parentCategories.findIndex((cat) => cat.id === goalCategory.parentCategory?.id);
				if (parentCategoryIndex !== -1) {
					setActiveCategory(parentCategoryIndex);

					// Фильтруем подкатегории из общего списка
					const filteredSubcategories = categories.filter(
						(cat: ICategory) => cat.parentCategory && cat.parentCategory.id === goalCategory.parentCategory?.id
					);
					setSubcategories(filteredSubcategories);

					// Находим индекс подкатегории в отфильтрованном списке
					const subcategoryIndex = filteredSubcategories.findIndex((sub: ICategory) => sub.id === goalCategory.id);
					if (subcategoryIndex !== -1) {
						setActiveSubcategory(subcategoryIndex);
					}
				}
			} else {
				// Если это родительская категория
				const categoryIndex = parentCategories.findIndex((cat) => cat.id === goalCategory.id);
				if (categoryIndex !== -1) {
					setActiveCategory(categoryIndex);

					// Фильтруем подкатегории из общего списка
					const filteredSubcategories = categories.filter(
						(cat: ICategory) => cat.parentCategory && cat.parentCategory.id === goalCategory.id
					);
					setSubcategories(filteredSubcategories);

					// Если у цели есть подкатегория, находим ее индекс
					if (goal.subcategory && filteredSubcategories) {
						const subcategoryIndex = filteredSubcategories.findIndex((sub: ICategory) => sub.id === goal.subcategory?.id);
						if (subcategoryIndex !== -1) {
							setActiveSubcategory(subcategoryIndex);
						}
					}
				}
			}
		}

		// Скрываем список похожих целей после выбора
		setShowSimilarGoals(false);

		// Показываем уведомление
		NotificationStore.addNotification({
			type: 'warning',
			title: 'Данные заполнены',
			message: 'Поля формы заполнены данными выбранной цели. Вы можете изменить их перед созданием.',
		});
	};

	return {
		similarGoals,
		showSimilarGoals,
		setShowSimilarGoals,
		handleTitleFocus,
		handleTitleBlur,
		fillFormWithGoalData,
	};
};
