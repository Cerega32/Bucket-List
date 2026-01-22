import {observer} from 'mobx-react-lite';
import {FC, useCallback, useState} from 'react';

import {useBem} from '@/hooks/useBem';
import useScreenSize from '@/hooks/useScreenSize';
import {TodoStore} from '@/store/TodoStore';
import {TodoTask} from '@/typings/todo';

import {Button} from '../Button/Button';
import {EmptyState} from '../EmptyState/EmptyState';
import {MarkdownRenderer} from '../MarkdownRenderer/MarkdownRenderer';

import './todo-tasks-container.scss';

interface TodoTasksContainerProps {
	className?: string;
	tasks: TodoTask[];
	title?: string;
	onCreateTask: () => void;
	loading?: boolean;
}

export const TodoTasksContainer: FC<TodoTasksContainerProps> = observer(({className, tasks, title, onCreateTask, loading = false}) => {
	const [block, element] = useBem('todo-tasks-container', className);
	const {isScreenMobile} = useScreenSize();
	const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
	const [taskProgress, setTaskProgress] = useState<{[key: string]: number}>({});

	const handleTaskToggle = async (taskId: string) => {
		try {
			await TodoStore.toggleTaskComplete(taskId);
		} catch (error) {
			console.error('Ошибка при изменении статуса задачи:', error);
		}
	};

	const handleTaskDelete = async (taskId: string) => {
		if (window.confirm('Вы уверены, что хотите удалить эту задачу?')) {
			try {
				await TodoStore.deleteTodoTask(taskId);
			} catch (error) {
				console.error('Ошибка при удалении задачи:', error);
			}
		}
	};

	const handleTaskDuplicate = async (taskId: string) => {
		try {
			await TodoStore.duplicateTodoTask(taskId);
		} catch (error) {
			console.error('Ошибка при дублировании задачи:', error);
		}
	};

	const handleTaskSelect = (taskId: string) => {
		setSelectedTasks((prev) => (prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]));
	};

	const handleBulkComplete = async () => {
		try {
			await TodoStore.bulkUpdateTasks({
				taskIds: selectedTasks,
				action: 'complete',
			});
			setSelectedTasks([]);
		} catch (error) {
			console.error('Ошибка при массовом выполнении задач:', error);
		}
	};

	const handleBulkDelete = async () => {
		if (window.confirm(`Вы уверены, что хотите удалить ${selectedTasks.length} задач?`)) {
			try {
				await TodoStore.bulkUpdateTasks({
					taskIds: selectedTasks,
					action: 'delete',
				});
				setSelectedTasks([]);
			} catch (error) {
				console.error('Ошибка при массовом удалении задач:', error);
			}
		}
	};

	const handleBulkAction = (action: string) => {
		if (selectedTasks.length === 0) return;

		switch (action) {
			case 'complete':
				handleBulkComplete();
				break;
			case 'delete':
				handleBulkDelete();
				break;
			default:
				break;
		}
	};

	const getPriorityColor = (priority: string) => {
		switch (priority) {
			case 'urgent':
				return '#ef4444';
			case 'high':
				return '#f97316';
			case 'medium':
				return '#3b82f6';
			case 'low':
				return '#10b981';
			default:
				return '#6b7280';
		}
	};

	const getPriorityLabel = (priority: string) => {
		switch (priority) {
			case 'urgent':
				return 'Срочный';
			case 'high':
				return 'Высокий';
			case 'medium':
				return 'Средний';
			case 'low':
				return 'Низкий';
			default:
				return priority;
		}
	};

	const getContextLabel = (context: string) => {
		switch (context) {
			case 'home':
				return 'Дом';
			case 'work':
				return 'Работа';
			case 'call':
				return 'Звонки';
			case 'email':
				return 'Почта';
			case 'errands':
				return 'Поручения';
			case 'computer':
				return 'Компьютер';
			case 'online':
				return 'Онлайн';
			case 'waiting':
				return 'Ожидание';
			case 'other':
				return 'Другое';
			default:
				return context;
		}
	};

	const getRecurringLabel = (pattern: any) => {
		if (!pattern) return '';

		const {type, interval} = pattern;
		switch (type) {
			case 'daily':
				return interval === 1 ? 'Ежедневно' : `Каждые ${interval} дня`;
			case 'weekly':
				return interval === 1 ? 'Еженедельно' : `Каждые ${interval} недели`;
			case 'monthly':
				return interval === 1 ? 'Ежемесячно' : `Каждые ${interval} месяца`;
			case 'yearly':
				return interval === 1 ? 'Ежегодно' : `Каждые ${interval} года`;
			default:
				return 'Повторяется';
		}
	};

	const handleProgressChange = useCallback((taskId: string, progress: number) => {
		setTaskProgress((prev) => ({
			...prev,
			[taskId]: progress,
		}));
	}, []);

	const getProgressDisplay = (progress: number) => {
		if (progress === 0) return null;
		if (progress === 100) return '✅';
		return `${progress}%`;
	};

	const getProgressColor = (progress: number) => {
		if (progress === 0) return 'transparent';
		if (progress < 50) return '#f97316'; // orange
		if (progress < 100) return '#3b82f6'; // blue
		return '#10b981'; // green
	};

	if (loading) {
		return (
			<div className={block()}>
				<div className={element('loading')}>Загрузка задач...</div>
			</div>
		);
	}

	if (tasks.length === 0) {
		return (
			<div className={block()}>
				<EmptyState
					title={title ? `Нет задач в разделе "${title}"` : 'В этом списке пока нет задач'}
					description="Добавьте задачи, чтобы начать планирование и достижение целей"
				>
					<Button onClick={onCreateTask} theme="blue" size={isScreenMobile ? 'medium' : undefined}>
						+ Добавить задачу
					</Button>
				</EmptyState>
			</div>
		);
	}

	return (
		<div className={block()}>
			<div className={element('header')}>
				<div className={element('header-info')}>
					<h2 className={element('title')}>{title || 'Задачи'}</h2>
					<span className={element('count')}>
						{tasks.length} задач{tasks.length === 1 ? 'а' : tasks.length < 5 ? 'и' : ''}
					</span>
				</div>

				{selectedTasks.length > 0 && (
					<div className={element('bulk-actions')}>
						<span className={element('selected-count')}>Выбрано: {selectedTasks.length}</span>
						<Button onClick={() => handleBulkAction('complete')} theme="green" size="small">
							Выполнить
						</Button>
						<Button onClick={() => handleBulkAction('delete')} theme="red" size="small">
							Удалить
						</Button>
					</div>
				)}
			</div>

			<div className={element('list')}>
				{tasks.map((task) => (
					<div
						key={task.id}
						className={element('task', {
							completed: task.isCompleted,
							overdue: task.isOverdue,
							selected: selectedTasks.includes(task.id),
						})}
					>
						<div className={element('task-main')}>
							<input
								type="checkbox"
								className={element('task-checkbox')}
								checked={selectedTasks.includes(task.id)}
								onChange={() => handleTaskSelect(task.id)}
							/>

							<button
								type="button"
								className={element('task-toggle', {completed: task.isCompleted})}
								onClick={() => handleTaskToggle(task.id)}
							>
								{task.isCompleted ? '✓' : '○'}
							</button>

							<div className={element('task-content')}>
								<h3 className={element('task-title')}>{task.title}</h3>
								{task.description && (
									<div className={element('task-description')}>
										<MarkdownRenderer
											content={task.description}
											onProgressChange={(progress) => handleProgressChange(task.id, progress)}
										/>
									</div>
								)}

								<div className={element('task-meta')}>
									<span className={element('task-priority')} style={{backgroundColor: getPriorityColor(task.priority)}}>
										{getPriorityLabel(task.priority)}
									</span>

									{task.context && <span className={element('task-context')}>{getContextLabel(task.context)}</span>}

									{task.deadline && (
										<span className={element('task-deadline', {overdue: task.isOverdue})}>
											⏰{' '}
											{new Date(task.deadline).toLocaleString('ru-RU', {
												year: 'numeric',
												month: '2-digit',
												day: '2-digit',
												hour: '2-digit',
												minute: '2-digit',
											})}
										</span>
									)}

									{task.scheduledDate && (
										<span className={element('task-meeting')}>
											📅{' '}
											{new Date(
												task.scheduledDate + (task.scheduledTime ? `T${task.scheduledTime}` : '')
											).toLocaleString('ru-RU', {
												year: 'numeric',
												month: '2-digit',
												day: '2-digit',
												...(task.scheduledTime && {
													hour: '2-digit',
													minute: '2-digit',
												}),
											})}
										</span>
									)}

									{task.isRecurring && task.recurringPattern && (
										<span className={element('task-recurring')}>🔄 {getRecurringLabel(task.recurringPattern)}</span>
									)}

									{taskProgress[task.id] > 0 && (
										<span
											className={element('task-progress')}
											style={{backgroundColor: getProgressColor(taskProgress[task.id])}}
										>
											📊 {getProgressDisplay(taskProgress[task.id])}
										</span>
									)}

									{task.hasSubtasks && (
										<span className={element('task-subtasks')}>
											📝 {task.subtasksCompletedCount}/{task.subtasksTotalCount}
										</span>
									)}
								</div>

								{task.tags.length > 0 && (
									<div className={element('task-tags')}>
										{task.tags.map((tag) => (
											<span key={tag} className={element('task-tag')}>
												#{tag}
											</span>
										))}
									</div>
								)}
							</div>
						</div>

						<div className={element('task-actions')}>
							<button
								type="button"
								className={element('task-action')}
								onClick={() => handleTaskDuplicate(task.id)}
								title="Дублировать задачу"
							>
								📋
							</button>
							<button
								type="button"
								className={element('task-action')}
								onClick={() => handleTaskDelete(task.id)}
								title="Удалить задачу"
							>
								🗑️
							</button>
						</div>
					</div>
				))}
			</div>
		</div>
	);
});
