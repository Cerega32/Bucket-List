import {DELETE, GET, POST, PUT} from '@/utils/fetch/requests';

// ========== NOTIFICATIONS API ==========

export interface INotification {
	id: number;
	recipient: number;
	type: string;
	title: string;
	message: string;
	data: Record<string, any>;
	is_read: boolean;
	created_at: string;
	updated_at: string;
}

export interface INotificationTemplate {
	id: number;
	name: string;
	event_type: string;
	title_template: string;
	message_template: string;
	is_active: boolean;
	is_default: boolean;
	variables: string[];
	created_at: string;
	updated_at: string;
}

export interface INotificationTemplateVariable {
	id: number;
	template: number;
	variable_name: string;
	description: string;
	example_value: string;
	is_required: boolean;
}

export interface INotificationLog {
	id: number;
	template: number;
	recipient: number;
	event_type: string;
	variables_used: Record<string, any>;
	status: 'sent' | 'failed' | 'pending';
	created_at: string;
}

// Notifications API functions
export const getNotifications = (page?: number, unreadOnly?: boolean) =>
	GET('notifications', {
		get: {
			...(page && {page}),
			...(unreadOnly && {unread_only: true}),
		},
		auth: true,
	});

export const markNotificationRead = (id: number) =>
	POST(`notifications/${id}/mark-read`, {
		showSuccessNotification: false,
	});

export const markAllNotificationsRead = () =>
	POST('notifications/mark-all-read', {
		success: {
			type: 'success',
			title: 'Уведомления прочитаны',
			message: 'Все уведомления отмечены как прочитанные',
		},
	});

// Alias для совместимости
export const markAllNotificationsAsRead = markAllNotificationsRead;

export const getUnreadCount = () => GET('notifications/unread-count');

export const deleteNotification = (id: number) =>
	DELETE(`notifications/${id}`, {
		success: {
			type: 'success',
			title: 'Уведомление удалено',
		},
	});

// Template functions (для админов)
export const getNotificationTemplates = () => GET('notifications/templates');

export const getNotificationTemplate = (id: number) => GET(`notifications/templates/${id}`);

export const createNotificationTemplate = (data: Partial<INotificationTemplate>) =>
	POST('notifications/templates', {
		body: data,
		success: {
			type: 'success',
			title: 'Шаблон создан',
			message: 'Шаблон уведомления успешно создан',
		},
	});

export const updateNotificationTemplate = (id: number, data: Partial<INotificationTemplate>) =>
	PUT(`notifications/templates/${id}`, {
		body: data,
		success: {
			type: 'success',
			title: 'Шаблон обновлен',
			message: 'Шаблон уведомления обновлен',
		},
	});

export const deleteNotificationTemplate = (id: number) =>
	DELETE(`notifications/templates/${id}`, {
		success: {
			type: 'success',
			title: 'Шаблон удален',
			message: 'Шаблон уведомления удален',
		},
	});

export const testNotificationTemplate = (templateId: number, variables: Record<string, any>) =>
	POST(`notifications/templates/${templateId}/test`, {
		body: {variables},
		success: {
			type: 'success',
			title: 'Тест отправлен',
			message: 'Тестовое уведомление отправлено',
		},
	});

export const getTemplatesByEvent = (eventType: string) => GET(`notifications/templates/event/${eventType}`);

export const duplicateTemplate = (templateId: number) =>
	POST(`notifications/templates/${templateId}/duplicate`, {
		success: {
			type: 'success',
			title: 'Шаблон скопирован',
			message: 'Копия шаблона создана',
		},
	});

export const activateTemplate = (templateId: number) =>
	POST(`notifications/templates/${templateId}/activate`, {
		success: {
			type: 'success',
			title: 'Шаблон активирован',
		},
	});

export const deactivateTemplate = (templateId: number) =>
	POST(`notifications/templates/${templateId}/deactivate`, {
		success: {
			type: 'success',
			title: 'Шаблон деактивирован',
		},
	});

export const setDefaultTemplate = (templateId: number) =>
	POST(`notifications/templates/${templateId}/set-default`, {
		success: {
			type: 'success',
			title: 'Шаблон по умолчанию установлен',
		},
	});

export const getTemplateVariables = (templateId: number) => GET(`notifications/templates/${templateId}/variables`);

export const getNotificationLogs = (page?: number) =>
	GET('notifications/logs', {
		get: page ? {page} : undefined,
	});

export const createNotificationFromTemplate = (data: {template_id: number; recipient_id: number; variables: Record<string, any>}) =>
	POST('notifications/templates/create-notification', {
		body: data,
		success: {
			type: 'success',
			title: 'Уведомление отправлено',
			message: 'Уведомление успешно создано и отправлено',
		},
	});

// Типы событий для уведомлений
export const NOTIFICATION_EVENT_TYPES = {
	goal_completed: 'Выполнение цели',
	goal_progress: 'Прогресс цели',
	merge_request: 'Запрос на объединение',
	friend_request: 'Заявка в друзья',
	daily_reminder: 'Ежедневные напоминания',
	achievement_earned: 'Получение достижения',
	challenge_completed: 'Выполнение задания',
	weekly_summary: 'Еженедельная сводка',
	goal_deadline: 'Дедлайн цели',
	system_announcement: 'Системные объявления',
} as const;

export const NOTIFICATION_TYPES = {
	info: 'info',
	success: 'success',
	warning: 'warning',
	error: 'error',
} as const;
