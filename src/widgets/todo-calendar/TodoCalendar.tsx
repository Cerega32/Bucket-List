import {observer} from 'mobx-react-lite';
import {FC, useEffect, useState} from 'react';

import {TodoStore} from '@/entities/todo/model/TodoStore';
import {TodoTask} from '@/entities/todo/model/types';
import {useBem} from '@/shared/lib/hooks/useBem';

import '@/widgets/todo-calendar/todo-calendar.scss';

interface TodoCalendarProps {
	className?: string;
	onTaskClick?: (task: TodoTask) => void;
}

export const TodoCalendar: FC<TodoCalendarProps> = observer(({className, onTaskClick}) => {
	const [block, element] = useBem('todo-calendar', className);
	const [currentDate, setCurrentDate] = useState(new Date());
	const [selectedDate, setSelectedDate] = useState<Date | null>(null);

	// Получаем задачи для текущего месяца
	useEffect(() => {
		// Загружаем все задачи для отображения в календаре
		TodoStore.loadTodoTasks();
	}, [currentDate]);

	const getDaysInMonth = (date: Date) => {
		const year = date.getFullYear();
		const month = date.getMonth();
		const firstDay = new Date(year, month, 1);
		const lastDay = new Date(year, month + 1, 0);
		const daysInMonth = lastDay.getDate();
		const startingDayOfWeek = firstDay.getDay();

		const days = [];

		// Добавляем пустые дни в начале месяца
		for (let i = 0; i < startingDayOfWeek; i++) {
			days.push(null);
		}

		// Добавляем дни месяца
		for (let day = 1; day <= daysInMonth; day++) {
			days.push(new Date(year, month, day));
		}

		return days;
	};

	const getTasksForDate = (date: Date) => {
		const dateString = date.toISOString().split('T')[0];
		return TodoStore.todoTasks.filter((task) => {
			const taskDate = task.scheduledDate || (task.deadline ? task.deadline.split('T')[0] : null);
			return taskDate === dateString;
		});
	};

	const navigateMonth = (direction: 'prev' | 'next') => {
		setCurrentDate((prev) => {
			const newDate = new Date(prev);
			if (direction === 'prev') {
				newDate.setMonth(prev.getMonth() - 1);
			} else {
				newDate.setMonth(prev.getMonth() + 1);
			}
			return newDate;
		});
	};

	const isToday = (date: Date) => {
		const today = new Date();
		return date.toDateString() === today.toDateString();
	};

	const isSelected = (date: Date) => {
		return selectedDate ? date.toDateString() === selectedDate.toDateString() : false;
	};

	const handleDateClick = (date: Date) => {
		setSelectedDate(date);
	};

	const handleDateKeyDown = (event: React.KeyboardEvent, date: Date) => {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handleDateClick(date);
		}
	};

	const handleTaskClick = (task: TodoTask) => {
		if (onTaskClick) {
			onTaskClick(task);
		}
	};

	const handleTaskKeyDown = (event: React.KeyboardEvent, task: TodoTask) => {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handleTaskClick(task);
		}
	};

	const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

	const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

	const days = getDaysInMonth(currentDate);
	const selectedDateTasks = selectedDate ? getTasksForDate(selectedDate) : [];

	return (
		<div className={block()}>
			<div className={element('header')}>
				<button className={element('nav-button')} onClick={() => navigateMonth('prev')} type="button">
					‹
				</button>
				<h2 className={element('title')}>
					{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
				</h2>
				<button className={element('nav-button')} onClick={() => navigateMonth('next')} type="button">
					›
				</button>
			</div>

			<div className={element('grid')}>
				{/* Заголовки дней недели */}
				{dayNames.map((day) => (
					<div key={day} className={element('day-header')}>
						{day}
					</div>
				))}

				{/* Дни месяца */}
				{days.map((date) => {
					if (!date) {
						return (
							<div
								key={`empty-${currentDate.getFullYear()}-${currentDate.getMonth()}`}
								className={element('day', {empty: true})}
							/>
						);
					}

					const tasksForDate = getTasksForDate(date);
					const hasDeadlines = tasksForDate.some((task) => task.deadline);
					const hasMeetings = tasksForDate.some((task) => task.scheduledDate);

					return (
						<div
							key={date.toISOString()}
							className={element('day', {
								today: isToday(date),
								selected: isSelected(date),
								'has-tasks': tasksForDate.length > 0,
								'has-deadlines': hasDeadlines,
								'has-meetings': hasMeetings,
							})}
							onClick={() => handleDateClick(date)}
							onKeyDown={(e) => handleDateKeyDown(e, date)}
							role="button"
							tabIndex={0}
						>
							<span className={element('day-number')}>{date.getDate()}</span>
							{tasksForDate.length > 0 && (
								<div className={element('task-indicators')}>
									{tasksForDate.slice(0, 3).map((task) => (
										<div
											key={task.id}
											className={element('task-indicator', {
												deadline: !!task.deadline,
												meeting: !!task.scheduledDate,
												completed: task.isCompleted,
											})}
											title={task.title}
										/>
									))}
									{tasksForDate.length > 3 && (
										<div className={element('task-indicator', {more: true})}>+{tasksForDate.length - 3}</div>
									)}
								</div>
							)}
						</div>
					);
				})}
			</div>

			{/* Список задач для выбранной даты */}
			{selectedDate && (
				<div className={element('selected-date-tasks')}>
					<h3 className={element('selected-date-title')}>
						Задачи на{' '}
						{selectedDate.toLocaleDateString('ru-RU', {
							day: 'numeric',
							month: 'long',
							year: 'numeric',
						})}
					</h3>
					{selectedDateTasks.length === 0 ? (
						<p className={element('no-tasks')}>На эту дату нет задач</p>
					) : (
						<div className={element('tasks-list')}>
							{selectedDateTasks.map((task) => (
								<div
									key={task.id}
									className={element('task-item', {
										completed: task.isCompleted,
										deadline: !!task.deadline,
										meeting: !!task.scheduledDate,
									})}
									onClick={() => handleTaskClick(task)}
									onKeyDown={(e) => handleTaskKeyDown(e, task)}
									role="button"
									tabIndex={0}
								>
									<div className={element('task-info')}>
										<h4 className={element('task-title')}>{task.title}</h4>
										{task.description && <p className={element('task-description')}>{task.description}</p>}
										<div className={element('task-time')}>
											{task.scheduledTime && <span className={element('meeting-time')}>🕐 {task.scheduledTime}</span>}
											{task.deadline && (
												<span className={element('deadline-time')}>
													⏰ до{' '}
													{new Date(task.deadline).toLocaleTimeString('ru-RU', {
														hour: '2-digit',
														minute: '2-digit',
													})}
												</span>
											)}
										</div>
									</div>
									<div className={element('task-status')}>{task.isCompleted ? '✅' : '⭕'}</div>
								</div>
							))}
						</div>
					)}
				</div>
			)}
		</div>
	);
});
