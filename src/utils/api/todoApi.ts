import {BulkTaskUpdateData, CreateTodoListData, CreateTodoTaskData, TodoList, TodoTaskFilters} from '@/typings/todo';
import {DELETE, GET, POST, PUT} from '@/utils/fetch/requests';

export const todoApi = {
	// Списки задач
	getTodoLists: async () => {
		return GET('lists', {
			auth: true,
			showSuccessNotification: false,
		});
	},

	getTodoList: async (id: string) => {
		return GET(`lists/${id}`, {
			auth: true,
			showSuccessNotification: false,
		});
	},

	createTodoList: async (data: CreateTodoListData) => {
		// Преобразуем данные из camelCase в snake_case для backend
		const backendData = {
			title: data.title,
			description: data.description,
			color: data.color,
			icon: data.icon,
			template_category: data.templateCategory,
		};

		return POST('lists/create', {
			body: backendData,
			auth: true,
			success: {
				type: 'success',
				title: 'Список создан',
				message: 'Новый список задач успешно создан',
			},
		});
	},

	updateTodoList: async (id: string, data: Partial<TodoList>) => {
		// Преобразуем данные из camelCase в snake_case для backend
		const backendData: any = {};
		if (data.title !== undefined) backendData.title = data.title;
		if (data.description !== undefined) backendData.description = data.description;
		if (data.color !== undefined) backendData.color = data.color;
		if (data.icon !== undefined) backendData.icon = data.icon;
		if (data.templateCategory !== undefined) backendData.template_category = data.templateCategory;

		return PUT(`lists/${id}/update`, {
			body: backendData,
			auth: true,
			success: {
				type: 'success',
				title: 'Список обновлен',
				message: 'Изменения сохранены',
			},
		});
	},

	deleteTodoList: async (id: string) => {
		return DELETE(`lists/${id}/delete`, {
			auth: true,
			success: {
				type: 'success',
				title: 'Список удален',
				message: 'Список задач успешно удален',
			},
		});
	},

	duplicateTodoList: async (id: string) => {
		return POST(`lists/${id}/duplicate`, {
			auth: true,
			success: {
				type: 'success',
				title: 'Список скопирован',
				message: 'Список задач успешно скопирован',
			},
		});
	},

	archiveTodoList: async (id: string) => {
		return POST(`lists/${id}/archive`, {
			auth: true,
			success: {
				type: 'success',
				title: 'Список архивирован',
				message: 'Список задач перемещен в архив',
			},
		});
	},

	restoreTodoList: async (id: string) => {
		return POST(`lists/${id}/restore`, {
			auth: true,
			success: {
				type: 'success',
				title: 'Список восстановлен',
				message: 'Список задач восстановлен из архива',
			},
		});
	},

	getTodoListStats: async () => {
		return GET('lists/stats', {
			auth: true,
			showSuccessNotification: false,
		});
	},

	// Цели пользователя для интеграции
	getUserGoals: async () => {
		return GET('self/added-goals', {
			auth: true,
			showSuccessNotification: false,
		});
	},

	// Задачи
	getTodoTasks: async (params?: TodoTaskFilters) => {
		// Преобразуем параметры для соответствия backend API
		const apiParams: any = {};
		if (params?.todoList) {
			apiParams.todo_list = params.todoList;
		}
		if (params?.priority) {
			apiParams.priority = params.priority;
		}
		if (params?.context) {
			apiParams.context = params.context;
		}
		if (params?.is_completed !== undefined) {
			apiParams.is_completed = params.is_completed;
		}
		if (params?.has_deadline !== undefined) {
			apiParams.has_deadline = params.has_deadline;
		}
		if (params?.search) {
			apiParams.search = params.search;
		}
		if (params?.ordering) {
			apiParams.ordering = params.ordering;
		}

		return GET('tasks', {
			get: apiParams,
			auth: true,
			showSuccessNotification: false,
		});
	},

	getTodoTask: async (id: string) => {
		return GET(`tasks/${id}`, {
			auth: true,
			showSuccessNotification: false,
		});
	},

	createTodoTask: async (data: CreateTodoTaskData) => {
		// Преобразуем данные из camelCase в snake_case для backend
		const backendData: Record<string, any> = {
			title: data.title,
			description: data.description,
			todo_list: data.todoList,
			related_goal_id: data.relatedGoalId,
			priority: data.priority,
			context: data.context,
			estimated_duration: data.estimatedDuration || null,
			deadline: data.deadline || null,
			scheduled_date: data.scheduledDate || null,
			scheduled_time: data.scheduledTime || null,
			parent_task: data.parentTask,
			is_recurring: data.isRecurring || false,
			recurring_pattern: data.recurringPattern || {},
			tags: data.tags || [],
			notes: data.notes,
		};

		// Убираем undefined и пустые строки для необязательных полей
		Object.keys(backendData).forEach((key) => {
			if (backendData[key] === undefined || backendData[key] === '') {
				if (
					['estimated_duration', 'deadline', 'scheduled_date', 'scheduled_time', 'parent_task', 'related_goal_id'].includes(key)
				) {
					backendData[key] = null;
				}
			}
		});

		return POST('tasks/create', {
			body: backendData,
			auth: true,
			success: {
				type: 'success',
				title: 'Задача создана',
				message: 'Новая задача успешно добавлена',
			},
		});
	},

	updateTodoTask: async (id: string, data: Partial<CreateTodoTaskData>) => {
		// Преобразуем данные из camelCase в snake_case для backend
		const backendData: Record<string, any> = {};
		if (data.title !== undefined) backendData['title'] = data.title;
		if (data.description !== undefined) backendData['description'] = data.description;
		if (data.todoList !== undefined) backendData['todo_list'] = data.todoList;
		if (data.relatedGoalId !== undefined) backendData['related_goal_id'] = data.relatedGoalId;
		if (data.priority !== undefined) backendData['priority'] = data.priority;
		if (data.context !== undefined) backendData['context'] = data.context;
		if (data.estimatedDuration !== undefined) backendData['estimated_duration'] = data.estimatedDuration || null;
		if (data.deadline !== undefined) backendData['deadline'] = data.deadline || null;
		if (data.scheduledDate !== undefined) backendData['scheduled_date'] = data.scheduledDate || null;
		if (data.scheduledTime !== undefined) backendData['scheduled_time'] = data.scheduledTime || null;
		if (data.parentTask !== undefined) backendData['parent_task'] = data.parentTask;
		if (data.isRecurring !== undefined) backendData['is_recurring'] = data.isRecurring;
		if (data.recurringPattern !== undefined) backendData['recurring_pattern'] = data.recurringPattern || {};
		if (data.tags !== undefined) backendData['tags'] = data.tags || [];
		if (data.notes !== undefined) backendData['notes'] = data.notes;

		// Убираем пустые строки для полей дат и времени
		Object.keys(backendData).forEach((key) => {
			if (backendData[key] === '') {
				if (
					['estimated_duration', 'deadline', 'scheduled_date', 'scheduled_time', 'parent_task', 'related_goal_id'].includes(key)
				) {
					backendData[key] = null;
				}
			}
		});

		return PUT(`tasks/${id}/update`, {
			body: backendData,
			auth: true,
			success: {
				type: 'success',
				title: 'Задача обновлена',
				message: 'Изменения сохранены',
			},
		});
	},

	deleteTodoTask: async (id: string) => {
		return DELETE(`tasks/${id}/delete`, {
			auth: true,
			success: {
				type: 'success',
				title: 'Задача удалена',
				message: 'Задача успешно удалена',
			},
		});
	},

	toggleTaskComplete: async (id: string) => {
		return POST(`tasks/${id}/toggle_complete`, {
			auth: true,
			success: {
				type: 'success',
				title: 'Статус изменен',
				message: 'Статус задачи обновлен',
			},
		});
	},

	duplicateTodoTask: async (id: string) => {
		return POST(`tasks/${id}/duplicate`, {
			auth: true,
			success: {
				type: 'success',
				title: 'Задача скопирована',
				message: 'Задача успешно скопирована',
			},
		});
	},

	bulkUpdateTasks: async (data: BulkTaskUpdateData) => {
		// Преобразуем данные из camelCase в snake_case для backend
		const backendData = {
			task_ids: data.taskIds,
			action: data.action,
			priority: data.priority,
			context: data.context,
			target_list_id: data.targetListId,
		};

		return POST('tasks/bulk_update', {
			body: backendData,
			auth: true,
			success: {
				type: 'success',
				title: 'Задачи обновлены',
				message: 'Массовое обновление выполнено',
			},
		});
	},

	// Специальные виды задач
	getTodayTasks: async () => {
		return GET('tasks/today', {
			auth: true,
			showSuccessNotification: false,
		});
	},

	getUpcomingTasks: async () => {
		return GET('tasks/upcoming', {
			auth: true,
			showSuccessNotification: false,
		});
	},

	getOverdueTasks: async () => {
		return GET('tasks/overdue', {
			auth: true,
			showSuccessNotification: false,
		});
	},

	// Шаблоны
	getTodoTemplates: async (params?: any) => {
		return GET('templates', {
			get: params,
			auth: true,
			showSuccessNotification: false,
		});
	},

	getTodoTemplate: async (id: string) => {
		return GET(`templates/${id}`, {
			auth: true,
			showSuccessNotification: false,
		});
	},

	createTodoTemplate: async (data: any) => {
		return POST('templates/create', {
			body: data,
			auth: true,
			success: {
				type: 'success',
				title: 'Шаблон создан',
				message: 'Новый шаблон успешно создан',
			},
		});
	},

	updateTodoTemplate: async (id: string, data: any) => {
		return PUT(`templates/${id}/update`, {
			body: data,
			auth: true,
			success: {
				type: 'success',
				title: 'Шаблон обновлен',
				message: 'Изменения сохранены',
			},
		});
	},

	deleteTodoTemplate: async (id: string) => {
		return DELETE(`templates/${id}/delete`, {
			auth: true,
			success: {
				type: 'success',
				title: 'Шаблон удален',
				message: 'Шаблон успешно удален',
			},
		});
	},

	createListFromTemplate: async (
		id: string,
		data: {
			listTitle: string;
			listDescription?: string;
			color?: string;
			icon?: string;
		}
	) => {
		// Преобразуем данные из camelCase в snake_case для backend
		const backendData = {
			list_title: data.listTitle,
			list_description: data.listDescription,
			color: data.color,
			icon: data.icon,
		};

		return POST(`templates/${id}/create_list`, {
			body: backendData,
			auth: true,
			success: {
				type: 'success',
				title: 'Список создан',
				message: 'Список создан на основе шаблона',
			},
		});
	},

	getPublicTemplates: async () => {
		return GET('templates/public', {
			showSuccessNotification: false,
		});
	},

	getMyTemplates: async () => {
		return GET('templates/my', {
			auth: true,
			showSuccessNotification: false,
		});
	},
};
