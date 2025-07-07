import {useEffect, useMemo, useState} from 'react';
import {useLocation} from 'react-router-dom';

import {NotificationStore} from '@/store/NotificationStore';
import {ICategory} from '@/typings/goal';
import {getAllCategories} from '@/utils/api/get/getCategories';

interface UseCategoriesProps {
	initialCategory?: ICategory;
	initialCategoryParam?: string;
	preloadedCategories?: ICategory[];
	activeCategory: number | null;
	setActiveCategory: (value: number | null) => void;
	activeSubcategory: number | null;
	setActiveSubcategory: (value: number | null) => void;
}

interface UseCategoriesReturn {
	categories: ICategory[];
	subcategories: ICategory[];
	parentCategories: ICategory[];
}

export const useCategories = ({
	initialCategory,
	initialCategoryParam,
	preloadedCategories,
	activeCategory,
	setActiveCategory,
	setActiveSubcategory,
}: UseCategoriesProps): UseCategoriesReturn => {
	const location = useLocation();
	const [categories, setCategories] = useState<ICategory[]>([]);
	const [subcategories, setSubcategories] = useState<ICategory[]>([]);

	// Получаем только родительские категории для основного dropdown используя useMemo для оптимизации
	const parentCategories = useMemo(() => categories.filter((cat) => !cat.parentCategory), [categories]);

	// Загрузка категорий при монтировании компонента
	useEffect(() => {
		const loadCategories = async () => {
			try {
				// Если переданы готовые категории, используем их
				if (preloadedCategories) {
					setCategories(preloadedCategories);
				} else {
					// Иначе загружаем категории с сервера
					const data = await getAllCategories();
					if (data.success) {
						setCategories(data.data);
					}
				}
			} catch (error) {
				NotificationStore.addNotification({
					type: 'error',
					title: 'Ошибка',
					message: 'Не удалось загрузить категории',
				});
			}
		};

		loadCategories();
	}, [preloadedCategories]);

	// Фильтрация подкатегорий при изменении категории
	useEffect(() => {
		if (activeCategory !== null && parentCategories.length > 0 && parentCategories[activeCategory]) {
			const selectedCategory = parentCategories[activeCategory];

			// Фильтруем подкатегории из общего списка категорий
			const filteredSubcategories = categories.filter(
				(cat: ICategory) => cat.parentCategory && cat.parentCategory.id === selectedCategory.id
			);

			setSubcategories(filteredSubcategories);

			// Сбрасываем подкатегорию только если не устанавливается initialCategory
			if (!initialCategory || !initialCategory.parentCategory) {
				setActiveSubcategory(null);
			}
		} else {
			// Если категория не выбрана
			setSubcategories([]);
			setActiveSubcategory(null);
		}
	}, [activeCategory, parentCategories.length, initialCategory, setActiveSubcategory]);

	// Добавляем эффект для установки начальной категории из props
	useEffect(() => {
		if (initialCategory && categories.length > 0 && parentCategories.length > 0) {
			// Если передана подкатегория, ищем её родительскую категорию
			if (initialCategory.parentCategory) {
				const parentIndex = parentCategories.findIndex((cat) => cat.id === initialCategory.parentCategory?.id);

				if (parentIndex !== -1) {
					setActiveCategory(parentIndex);

					// Фильтруем подкатегории из общего списка
					const filteredSubcategories = categories.filter(
						(cat: ICategory) => cat.parentCategory && cat.parentCategory.id === initialCategory.parentCategory?.id
					);
					setSubcategories(filteredSubcategories);

					// Ищем индекс подкатегории в отфильтрованном списке
					const subcategoryIndex = filteredSubcategories.findIndex((sub: ICategory) => sub.id === initialCategory.id);

					if (subcategoryIndex !== -1) {
						// Добавляем небольшую задержку для обеспечения корректной установки
						setTimeout(() => {
							setActiveSubcategory(subcategoryIndex);
						}, 100);
					} else {
						console.warn('Подкатегория не найдена:', initialCategory);
					}
				} else {
					console.warn('Родительская категория не найдена:', initialCategory.parentCategory);
				}
			} else {
				// Если передана основная категория
				const categoryIndex = parentCategories.findIndex((cat) => cat.id === initialCategory.id);

				if (categoryIndex !== -1) {
					setActiveCategory(categoryIndex);
				} else {
					console.warn('Основная категория не найдена:', initialCategory);
				}
			}
		}
	}, [initialCategory?.id, parentCategories.length, categories.length, setActiveCategory, setActiveSubcategory]);

	// Добавляем эффект для получения категории из URL параметра
	useEffect(() => {
		// Обрабатываем параметр initialCategoryParam, если он передан
		if (initialCategoryParam && parentCategories.length > 0) {
			const categoryIndex = parentCategories.findIndex((cat) => cat.nameEn === initialCategoryParam);
			if (categoryIndex !== -1) {
				setActiveCategory(categoryIndex);
			}
		}
		// Иначе продолжаем обрабатывать параметр category из URL
		else {
			const params = new URLSearchParams(location.search);
			const categoryParam = params.get('category');

			if (categoryParam && parentCategories.length > 0) {
				const categoryIndex = parentCategories.findIndex((cat) => cat.nameEn === categoryParam);
				if (categoryIndex !== -1) {
					setActiveCategory(categoryIndex);
				}
			}
		}
	}, [initialCategoryParam, location.search, parentCategories.length, setActiveCategory]);

	return {
		categories,
		subcategories,
		parentCategories,
	};
};
