import {makeAutoObservable, runInAction} from 'mobx';

import {IGoal} from '@/typings/goal';
import {
	BulkTaskUpdateData,
	CreateTodoListData,
	CreateTodoTaskData,
	TodoList,
	TodoStats,
	TodoTask,
	TodoTaskFilters,
	TodoTemplate,
} from '@/typings/todo';
import {todoApi} from '@/utils/api/todoApi';

export class Store {
	// Списки задач
	todoLists: TodoList[] = [];

	todoTasks: TodoTask[] = [];

	todayTasks: TodoTask[] = [];

	upcomingTasks: TodoTask[] = [];

	overdueTasks: TodoTask[] = [];

	// Цели пользователя для интеграции
	userGoals: IGoal[] = [];

	// Шаблоны
	todoTemplates: TodoTemplate[] = [];

	publicTemplates: TodoTemplate[] = [];

	myTemplates: TodoTemplate[] = [];

	// Статистика
	stats: TodoStats | null = null;

	// Состояние загрузки
	loading = false;

	error: string | null = null;

	// Фильтры
	filters: TodoTaskFilters = {};

	constructor() {
		makeAutoObservable(this);
	}

	// Загрузка списков задач
	async loadTodoLists() {
		this.setLoading(true);
		try {
			const response = await todoApi.getTodoLists();
			if (response.success) {
				runInAction(() => {
					this.todoLists = response.data;
					this.error = null;
				});
			} else {
				throw new Error(response.errors || 'Ошибка загрузки списков задач');
			}
		} catch (error) {
			runInAction(() => {
				this.error = 'Ошибка загрузки списков задач';
			});
		} finally {
			this.setLoading(false);
		}
	}

	// Загрузка задач
	async loadTodoTasks(params?: TodoTaskFilters) {
		this.setLoading(true);
		try {
			const response = await todoApi.getTodoTasks(params);
			runInAction(() => {
				this.todoTasks = response.data;
				this.error = null;
			});
		} catch (error) {
			runInAction(() => {
				this.error = 'Ошибка загрузки задач';
			});
		} finally {
			this.setLoading(false);
		}
	}

	// Загрузка задач на сегодня
	async loadTodayTasks() {
		this.setLoading(true);
		try {
			const response = await todoApi.getTodayTasks();
			if (response.success) {
				runInAction(() => {
					this.todayTasks = response.data;
					this.error = null;
				});
			} else {
				throw new Error(response.errors || 'Ошибка загрузки задач на сегодня');
			}
		} catch (error) {
			runInAction(() => {
				this.error = 'Ошибка загрузки задач на сегодня';
			});
		} finally {
			this.setLoading(false);
		}
	}

	// Загрузка предстоящих задач
	async loadUpcomingTasks() {
		this.setLoading(true);
		try {
			const response = await todoApi.getUpcomingTasks();
			if (response.success) {
				runInAction(() => {
					this.upcomingTasks = response.data;
					this.error = null;
				});
			} else {
				throw new Error(response.errors || 'Ошибка загрузки предстоящих задач');
			}
		} catch (error) {
			runInAction(() => {
				this.error = 'Ошибка загрузки предстоящих задач';
			});
		} finally {
			this.setLoading(false);
		}
	}

	// Загрузка просроченных задач
	async loadOverdueTasks() {
		this.setLoading(true);
		try {
			const response = await todoApi.getOverdueTasks();
			if (response.success) {
				runInAction(() => {
					this.overdueTasks = response.data;
					this.error = null;
				});
			} else {
				throw new Error(response.errors || 'Ошибка загрузки просроченных задач');
			}
		} catch (error) {
			runInAction(() => {
				this.error = 'Ошибка загрузки просроченных задач';
			});
		} finally {
			this.setLoading(false);
		}
	}

	// Загрузка статистики
	async loadStats() {
		try {
			const response = await todoApi.getTodoListStats();
			if (response.success) {
				runInAction(() => {
					this.stats = response.data;
					this.error = null;
				});
			} else {
				throw new Error(response.errors || 'Ошибка загрузки статистики');
			}
		} catch (error) {
			runInAction(() => {
				this.error = 'Ошибка загрузки статистики';
			});
		}
	}

	// Создание списка задач
	async createTodoList(data: CreateTodoListData) {
		this.setLoading(true);
		try {
			const response = await todoApi.createTodoList(data);
			if (response.success) {
				runInAction(() => {
					this.todoLists.unshift(response.data);
					this.error = null;
				});
				return response.data;
			}
			throw new Error(response.errors || 'Ошибка создания списка задач');
		} catch (error) {
			runInAction(() => {
				this.error = 'Ошибка создания списка задач';
			});
			throw error;
		} finally {
			this.setLoading(false);
		}
	}

	// Создание задачи
	async createTodoTask(data: CreateTodoTaskData) {
		this.setLoading(true);
		try {
			const response = await todoApi.createTodoTask(data);
			if (response.success) {
				runInAction(() => {
					this.todoTasks.unshift(response.data);
					this.error = null;
				});
				return response.data;
			}
			throw new Error(response.errors || 'Ошибка создания задачи');
		} catch (error) {
			runInAction(() => {
				this.error = 'Ошибка создания задачи';
			});
			throw error;
		} finally {
			this.setLoading(false);
		}
	}

	// Обновление задачи
	async updateTodoTask(id: string, data: Partial<TodoTask>) {
		try {
			const response = await todoApi.updateTodoTask(id, data);
			if (response.success) {
				runInAction(() => {
					const index = this.todoTasks.findIndex((task) => task.id === id);
					if (index !== -1) {
						this.todoTasks[index] = response.data;
					}
					this.updateTaskInArrays(response.data);
					this.error = null;
				});
				return response.data;
			}
			throw new Error(response.errors || 'Ошибка обновления задачи');
		} catch (error) {
			runInAction(() => {
				this.error = 'Ошибка обновления задачи';
			});
			throw error;
		}
	}

	// Переключение статуса выполнения задачи
	async toggleTaskComplete(id: string) {
		try {
			const response = await todoApi.toggleTaskComplete(id);
			if (response.success) {
				runInAction(() => {
					const index = this.todoTasks.findIndex((task) => task.id === id);
					if (index !== -1) {
						this.todoTasks[index] = response.data;
					}
					this.updateTaskInArrays(response.data);
					this.error = null;
				});
				return response.data;
			}
			throw new Error(response.errors || 'Ошибка изменения статуса задачи');
		} catch (error) {
			runInAction(() => {
				this.error = 'Ошибка изменения статуса задачи';
			});
			throw error;
		}
	}

	// Удаление задачи
	async deleteTodoTask(id: string) {
		try {
			const response = await todoApi.deleteTodoTask(id);
			if (response.success) {
				runInAction(() => {
					this.todoTasks = this.todoTasks.filter((task) => task.id !== id);
					this.todayTasks = this.todayTasks.filter((task) => task.id !== id);
					this.upcomingTasks = this.upcomingTasks.filter((task) => task.id !== id);
					this.overdueTasks = this.overdueTasks.filter((task) => task.id !== id);
					this.error = null;
				});
			} else {
				throw new Error(response.errors || 'Ошибка удаления задачи');
			}
		} catch (error) {
			runInAction(() => {
				this.error = 'Ошибка удаления задачи';
			});
			throw error;
		}
	}

	// Дублирование задачи
	async duplicateTodoTask(id: string) {
		try {
			const response = await todoApi.duplicateTodoTask(id);
			if (response.success) {
				runInAction(() => {
					// Добавляем новую задачу в соответствующие массивы
					const newTask = response.data;
					this.todoTasks.push(newTask);

					// Если задача относится к сегодняшним/предстоящим/просроченным, добавляем и туда
					const today = new Date().toDateString();
					if (newTask.scheduledDate === today || newTask.deadline === today) {
						this.todayTasks.push(newTask);
					}

					this.error = null;
				});
			} else {
				throw new Error(response.errors || 'Ошибка дублирования задачи');
			}
		} catch (error) {
			runInAction(() => {
				this.error = 'Ошибка дублирования задачи';
			});
			throw error;
		}
	}

	// Массовое обновление задач
	async bulkUpdateTasks(data: BulkTaskUpdateData) {
		try {
			const response = await todoApi.bulkUpdateTasks(data);
			if (response.success) {
				runInAction(() => {
					if (data.action === 'delete') {
						// Удаляем задачи из всех массивов
						this.todoTasks = this.todoTasks.filter((task) => !data.taskIds.includes(task.id));
						this.todayTasks = this.todayTasks.filter((task) => !data.taskIds.includes(task.id));
						this.upcomingTasks = this.upcomingTasks.filter((task) => !data.taskIds.includes(task.id));
						this.overdueTasks = this.overdueTasks.filter((task) => !data.taskIds.includes(task.id));
					} else {
						// Для других действий перезагружаем данные
						this.loadTodoTasks();
						this.loadTodayTasks();
						this.loadUpcomingTasks();
						this.loadOverdueTasks();
					}
					this.error = null;
				});
			} else {
				throw new Error(response.errors || 'Ошибка массового обновления задач');
			}
		} catch (error) {
			runInAction(() => {
				this.error = 'Ошибка массового обновления задач';
			});
			throw error;
		}
	}

	// Удаление списка задач
	async deleteTodoList(id: string) {
		try {
			const response = await todoApi.deleteTodoList(id);
			if (response.success) {
				runInAction(() => {
					this.todoLists = this.todoLists.filter((list) => list.id !== id);
					// Также удаляем все задачи из этого списка
					this.todoTasks = this.todoTasks.filter((task) => task.todoList !== id);
					this.error = null;
				});
			} else {
				throw new Error(response.errors || 'Ошибка удаления списка');
			}
		} catch (error) {
			runInAction(() => {
				this.error = 'Ошибка удаления списка';
			});
			throw error;
		}
	}

	// Установка фильтров
	setFilters(filters: TodoTaskFilters) {
		runInAction(() => {
			this.filters = filters;
		});
	}

	// Очистка фильтров
	clearFilters() {
		runInAction(() => {
			this.filters = {};
		});
	}

	// Вспомогательные методы
	private setLoading(loading: boolean) {
		runInAction(() => {
			this.loading = loading;
		});
	}

	private updateTaskInArrays(updatedTask: TodoTask) {
		// Обновляем задачу во всех массивах
		const updateInArray = (array: TodoTask[]) => {
			const index = array.findIndex((task) => task.id === updatedTask.id);
			if (index !== -1) {
				// Создаем новый массив вместо мутации
				return [...array.slice(0, index), updatedTask, ...array.slice(index + 1)];
			}
			return array;
		};

		this.todayTasks = updateInArray(this.todayTasks);
		this.upcomingTasks = updateInArray(this.upcomingTasks);
		this.overdueTasks = updateInArray(this.overdueTasks);
	}

	// Фильтрация задач на клиенте
	get filteredTasks() {
		let tasks = this.todoTasks;

		if (this.filters.priority) {
			tasks = tasks.filter((task) => task.priority === this.filters.priority);
		}

		if (this.filters.context) {
			tasks = tasks.filter((task) => task.context === this.filters.context);
		}

		if (this.filters.is_completed !== undefined) {
			tasks = tasks.filter((task) => task.isCompleted === this.filters.is_completed);
		}

		if (this.filters.has_deadline !== undefined) {
			if (this.filters.has_deadline) {
				tasks = tasks.filter((task) => task.deadline);
			} else {
				tasks = tasks.filter((task) => !task.deadline);
			}
		}

		if (this.filters.search) {
			const search = this.filters.search.toLowerCase();
			tasks = tasks.filter(
				(task) =>
					task.title.toLowerCase().includes(search) ||
					task.description?.toLowerCase().includes(search) ||
					task.notes?.toLowerCase().includes(search)
			);
		}

		if (this.filters.tags) {
			const searchTags = this.filters.tags.toLowerCase();
			tasks = tasks.filter((task) => task.tags && task.tags.some((tag) => tag.toLowerCase().includes(searchTags)));
		}

		return tasks;
	}

	get activeTodoLists() {
		return this.todoLists.filter((list) => list.isActive);
	}

	get completedTasksCount() {
		return this.todoTasks.filter((task) => task.isCompleted).length;
	}

	get pendingTasksCount() {
		return this.todoTasks.filter((task) => !task.isCompleted).length;
	}

	// Загрузка целей пользователя
	async loadUserGoals() {
		try {
			const response = await todoApi.getUserGoals();
			if (response.success) {
				runInAction(() => {
					this.userGoals = response.data.goals || [];
					this.error = null;
				});
			} else {
				throw new Error(response.errors || 'Ошибка загрузки целей');
			}
		} catch (error) {
			runInAction(() => {
				this.error = 'Ошибка загрузки целей пользователя';
			});
		}
	}
}

export const TodoStore = new Store();
