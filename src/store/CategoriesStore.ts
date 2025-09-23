import {makeAutoObservable} from 'mobx';

import {ICategory, ICategoryTree} from '@/typings/goal';

class Store {
	categoriesTree: ICategoryTree[] = [];

	constructor() {
		makeAutoObservable(this, {}, {autoBind: true});
	}

	setCategories(categories: ICategory[]) {
		// Создаем карту для быстрого доступа к категориям по id
		const categoryMap = new Map();
		const result: ICategoryTree[] = [];

		// Сначала создаем все категории без детей
		categories.forEach((category) => {
			categoryMap.set(category.id, {
				...category,
				children: [],
			});
		});

		// Затем добавляем детей к родительским категориям
		categories.forEach((category) => {
			const node = categoryMap.get(category.id);

			if (category.parentCategory) {
				const parent = categoryMap.get(category.parentCategory.id);
				if (parent) {
					parent.children.push(node);
				}
			} else {
				result.push(node);
			}
		});
		console.log(result, 'result');
		this.categoriesTree = result;
	}
}

export const CategoriesStore = new Store();
