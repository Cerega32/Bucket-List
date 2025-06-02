export interface TodoList {
	id: string;
	title: string;
	description: string;
	user: {
		id: string;
		username: string;
		email: string;
	};
	isActive: boolean;
	color: string;
	icon: string;
	sortOrder: number;
	isTemplate: boolean;
	templateCategory: string;
	createdAt: string;
	updatedAt: string;
	totalTasks: number;
	completedTasks: number;
	progressPercentage: number;
}

export interface TodoTask {
	id: string;
	title: string;
	description?: string;
	todoList: string;
	relatedGoalId?: string;
	priority: 'urgent' | 'high' | 'medium' | 'low';
	context?: string;
	estimatedDuration?: string;
	deadline?: string;
	scheduledDate?: string;
	scheduledTime?: string;
	parentTask?: string;
	isCompleted: boolean;
	isRecurring: boolean;
	recurringPattern?: RecurringPattern;
	tags: string[];
	notes?: string;
	createdAt: string;
	updatedAt: string;
	completedAt?: string;
	isOverdue: boolean;
	hasSubtasks: boolean;
	subtasksCompletedCount: number;
	subtasksTotalCount: number;
	sortOrder: number;
}

export interface RecurringPattern {
	type: 'daily' | 'weekly' | 'monthly' | 'yearly';
	interval: number; // каждые N дней/недель/месяцев/лет
	daysOfWeek?: number[]; // для еженедельных: 0-6 (воскресенье-суббота)
	dayOfMonth?: number; // для ежемесячных: 1-31
	monthOfYear?: number; // для ежегодных: 1-12
	endDate?: string; // дата окончания повторений
	maxOccurrences?: number; // максимальное количество повторений
}

export interface TodoTemplate {
	id: string;
	name: string;
	description: string;
	category: 'work' | 'personal' | 'shopping' | 'travel' | 'health' | 'learning' | 'other';
	tasksData: Array<{
		title: string;
		description?: string;
		priority?: string;
		context?: string;
		tags?: string[];
		notes?: string;
	}>;
	isPublic: boolean;
	createdBy: {
		id: string;
		username: string;
		email: string;
	};
	createdAt: string;
	updatedAt: string;
}

export interface TodoStats {
	lists: {
		total: number;
		active: number;
		archived: number;
	};
	tasks: {
		total: number;
		completed: number;
		pending: number;
		overdue: number;
	};
}

export interface CreateTodoListData {
	title: string;
	description?: string;
	color?: string;
	icon?: string;
	templateCategory?: string;
}

export interface CreateTodoTaskData {
	title: string;
	description?: string;
	todoList: string;
	relatedGoalId?: string;
	priority: 'urgent' | 'high' | 'medium' | 'low';
	context?: string;
	estimatedDuration?: string;
	deadline?: string;
	scheduledDate?: string;
	scheduledTime?: string;
	parentTask?: string;
	isRecurring?: boolean;
	recurringPattern?: RecurringPattern;
	tags?: string[];
	notes?: string;
}

export interface TodoTaskFilters {
	todoList?: string;
	priority?: string;
	context?: string;
	is_completed?: boolean;
	has_deadline?: boolean;
	isOverdue?: boolean;
	hasSubtasks?: boolean;
	isSubtask?: boolean;
	relatedGoal?: string;
	deadlineFrom?: string;
	deadlineTo?: string;
	scheduledDate?: string;
	tags?: string;
	today?: boolean;
	thisWeek?: boolean;
	upcoming?: boolean;
	search?: string;
	ordering?: string;
}

export interface BulkTaskUpdateData {
	taskIds: string[];
	action: 'complete' | 'uncomplete' | 'delete' | 'change_priority' | 'change_context' | 'move_to_list';
	priority?: string;
	context?: string;
	targetListId?: string;
}
