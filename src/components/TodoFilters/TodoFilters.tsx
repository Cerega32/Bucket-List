import {observer} from 'mobx-react-lite';
import {FC, useEffect, useState} from 'react';

import {useBem} from '@/hooks/useBem';
import {TodoStore} from '@/store/TodoStore';

import {Button} from '../Button/Button';

import './todo-filters.scss';

interface TodoFiltersProps {
	className?: string;
}

export const TodoFilters: FC<TodoFiltersProps> = observer(({className}) => {
	const [block, element] = useBem('todo-filters', className);
	const [isExpanded, setIsExpanded] = useState(false);

	// Используем фильтры из store
	const {filters} = TodoStore;

	const handleFilterChange = (key: string, value: string | boolean | null) => {
		TodoStore.setFilters({
			...filters,
			[key]: value === '' ? undefined : value,
		});
	};

	const handleClearFilters = () => {
		TodoStore.clearFilters();
	};

	// Проверяем наличие активных фильтров
	const hasActiveFilters = Object.values(filters).some((value) => value !== '' && value !== null && value !== undefined);

	// Загружаем задачи при изменении фильтров
	useEffect(() => {
		TodoStore.loadTodoTasks(filters);
	}, [filters]);

	return (
		<div className={block()}>
			<div className={element('header')}>
				<h3 className={element('title')}>Фильтры</h3>
				<button type="button" className={element('toggle')} onClick={() => setIsExpanded(!isExpanded)}>
					{isExpanded ? '▼' : '▶'}
				</button>
			</div>

			{isExpanded && (
				<div className={element('content')}>
					<div className={element('group')}>
						<label className={element('label')} htmlFor="filter-priority">
							Приоритет
							<select
								id="filter-priority"
								className={element('select')}
								value={filters.priority || ''}
								onChange={(e) => handleFilterChange('priority', e.target.value)}
							>
								<option value="">Все приоритеты</option>
								<option value="urgent">Срочный</option>
								<option value="high">Высокий</option>
								<option value="medium">Средний</option>
								<option value="low">Низкий</option>
							</select>
						</label>
					</div>

					<div className={element('group')}>
						<label className={element('label')} htmlFor="filter-context">
							Контекст
							<select
								id="filter-context"
								className={element('select')}
								value={filters.context || ''}
								onChange={(e) => handleFilterChange('context', e.target.value)}
							>
								<option value="">Все контексты</option>
								<option value="home">Дом</option>
								<option value="work">Работа</option>
								<option value="call">Звонки</option>
								<option value="email">Почта</option>
								<option value="errands">Поручения</option>
								<option value="computer">Компьютер</option>
								<option value="online">Онлайн</option>
								<option value="waiting">Ожидание</option>
								<option value="other">Другое</option>
							</select>
						</label>
					</div>

					<div className={element('group')}>
						<label className={element('label')} htmlFor="filter-status">
							Статус
							<select
								id="filter-status"
								className={element('select')}
								value={filters.is_completed === undefined ? '' : filters.is_completed?.toString() || ''}
								onChange={(e) => {
									const {value} = e.target;
									handleFilterChange('is_completed', value === '' ? null : value === 'true');
								}}
							>
								<option value="">Все задачи</option>
								<option value="false">Активные</option>
								<option value="true">Выполненные</option>
							</select>
						</label>
					</div>

					<div className={element('group')}>
						<label className={element('label')} htmlFor="filter-deadline">
							Дедлайн
							<select
								id="filter-deadline"
								className={element('select')}
								value={filters.has_deadline === undefined ? '' : filters.has_deadline?.toString() || ''}
								onChange={(e) => {
									const {value} = e.target;
									handleFilterChange('has_deadline', value === '' ? null : value === 'true');
								}}
							>
								<option value="">Все задачи</option>
								<option value="true">С дедлайном</option>
								<option value="false">Без дедлайна</option>
							</select>
						</label>
					</div>

					<div className={element('group')}>
						<label className={element('label')} htmlFor="filter-tags">
							Теги
							<input
								id="filter-tags"
								type="text"
								className={element('input')}
								placeholder="Поиск по тегам..."
								value={filters.tags || ''}
								onChange={(e) => handleFilterChange('tags', e.target.value)}
							/>
						</label>
					</div>

					{hasActiveFilters && (
						<Button onClick={handleClearFilters} theme="blue-light" size="small" className={element('clear-btn')}>
							Очистить фильтры
						</Button>
					)}
				</div>
			)}

			{hasActiveFilters && !isExpanded && (
				<div className={element('active-indicator')}>
					<span className={element('active-text')}>Активны фильтры</span>
					<Button onClick={handleClearFilters} theme="blue-light" size="small">
						Очистить
					</Button>
				</div>
			)}
		</div>
	);
});
