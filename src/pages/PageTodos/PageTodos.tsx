import {observer} from 'mobx-react-lite';
import React, {useEffect, useState} from 'react';

import {ModalStore} from '@/store/ModalStore';
import {ThemeStore} from '@/store/ThemeStore';
import {TodoStore} from '@/store/TodoStore';
import {UserStore} from '@/store/UserStore';
import {IPage} from '@/typings/page';

import {Button} from '../../components/Button/Button';
import {SEO} from '../../components/SEO/SEO';
import {TodoCalendar} from '../../components/TodoCalendar/TodoCalendar';
import {TodoFilters} from '../../components/TodoFilters/TodoFilters';
import {TodoListsContainer} from '../../components/TodoListsContainer/TodoListsContainer';
import {TodoStatsWidget} from '../../components/TodoStatsWidget/TodoStatsWidget';
import {TodoTasksContainer} from '../../components/TodoTasksContainer/TodoTasksContainer';
import './page-todos.scss';

const PageTodos: React.FC<IPage> = observer(({page}) => {
	const [selectedListId, setSelectedListId] = useState<string | null>(null);
	const [activeView, setActiveView] = useState<'lists' | 'tasks' | 'today' | 'upcoming' | 'overdue' | 'calendar'>('lists');

	const {setHeader, setPage, setFull} = ThemeStore;

	useEffect(() => {
		setHeader('white');
		setPage(page);
		setFull(false);
	}, []);

	useEffect(() => {
		if (UserStore.isAuth) {
			TodoStore.loadTodoLists();
			TodoStore.loadStats();
		}
	}, [UserStore.isAuth]);

	useEffect(() => {
		if (selectedListId) {
			TodoStore.loadTodoTasks({todoList: selectedListId});
		}
	}, [selectedListId]);

	const handleListSelect = (listId: string) => {
		setSelectedListId(listId);
		setActiveView('tasks');
	};

	const handleViewChange = (view: 'lists' | 'tasks' | 'today' | 'upcoming' | 'overdue' | 'calendar') => {
		setActiveView(view);
		if (view === 'today') {
			TodoStore.loadTodayTasks();
		} else if (view === 'upcoming') {
			TodoStore.loadUpcomingTasks();
		} else if (view === 'overdue') {
			TodoStore.loadOverdueTasks();
		} else if (view === 'calendar') {
			TodoStore.loadTodoTasks();
		}
	};

	const handleCreateList = () => {
		ModalStore.setWindow('create-todo-list');
		ModalStore.setModalProps({
			onSuccess: () => {
				TodoStore.loadTodoLists();
			},
		});
		ModalStore.setIsOpen(true);
	};

	const handleCreateTask = () => {
		ModalStore.setWindow('create-todo-task');
		ModalStore.setModalProps({
			defaultListId: selectedListId,
			onSuccess: () => {
				if (selectedListId) {
					TodoStore.loadTodoTasks({todoList: selectedListId});
				}
				if (activeView === 'today') {
					TodoStore.loadTodayTasks();
				} else if (activeView === 'upcoming') {
					TodoStore.loadUpcomingTasks();
				} else if (activeView === 'overdue') {
					TodoStore.loadOverdueTasks();
				}
			},
		});
		ModalStore.setIsOpen(true);
	};

	const renderMainContent = () => {
		switch (activeView) {
			case 'lists':
				return (
					<TodoListsContainer
						lists={TodoStore.todoLists}
						onListSelect={handleListSelect}
						onCreateList={handleCreateList}
						loading={TodoStore.loading}
					/>
				);
			case 'tasks':
				return <TodoTasksContainer tasks={TodoStore.todoTasks} onCreateTask={handleCreateTask} loading={TodoStore.loading} />;
			case 'today':
				return (
					<TodoTasksContainer
						tasks={TodoStore.todayTasks}
						title="Задачи на сегодня"
						onCreateTask={handleCreateTask}
						loading={TodoStore.loading}
					/>
				);
			case 'upcoming':
				return (
					<TodoTasksContainer
						tasks={TodoStore.upcomingTasks}
						title="Предстоящие задачи"
						onCreateTask={handleCreateTask}
						loading={TodoStore.loading}
					/>
				);
			case 'overdue':
				return (
					<TodoTasksContainer
						tasks={TodoStore.overdueTasks}
						title="Просроченные задачи"
						onCreateTask={handleCreateTask}
						loading={TodoStore.loading}
					/>
				);
			case 'calendar':
				return <TodoCalendar />;
			default:
				return null;
		}
	};

	if (!UserStore.isAuth) {
		return (
			<div className="page-todos">
				<div className="page-todos__content">
					<div className="page-todos__auth-required">
						<h2>Войдите в систему</h2>
						<p>Для работы со списками задач необходимо войти в систему</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="page-todos">
			<SEO
				title="Списки задач - Bucket List"
				description="Управляйте своими задачами и достигайте целей с помощью умных списков дел"
			/>

			<div className="page-todos__content">
				<div className="page-todos__sidebar">
					<TodoStatsWidget stats={TodoStore.stats} />

					<div className="page-todos__navigation">
						<button
							type="button"
							className={`page-todos__nav-item ${activeView === 'lists' ? 'active' : ''}`}
							onClick={() => handleViewChange('lists')}
						>
							📋 Мои списки
						</button>
						<button
							type="button"
							className={`page-todos__nav-item ${activeView === 'today' ? 'active' : ''}`}
							onClick={() => handleViewChange('today')}
						>
							📅 Сегодня
						</button>
						<button
							type="button"
							className={`page-todos__nav-item ${activeView === 'upcoming' ? 'active' : ''}`}
							onClick={() => handleViewChange('upcoming')}
						>
							⏰ Предстоящие
						</button>
						<button
							type="button"
							className={`page-todos__nav-item ${activeView === 'overdue' ? 'active' : ''}`}
							onClick={() => handleViewChange('overdue')}
						>
							🚨 Просроченные
						</button>
						<button
							type="button"
							className={`page-todos__nav-item ${activeView === 'calendar' ? 'active' : ''}`}
							onClick={() => handleViewChange('calendar')}
						>
							📅 Календарь
						</button>
					</div>

					<TodoFilters />
				</div>

				<div className="page-todos__main">
					<div className="page-todos__header">
						<div className="page-todos__actions">
							<Button onClick={handleCreateList} theme="blue" size="medium">
								+ Создать список
							</Button>
							{(activeView === 'tasks' ||
								activeView === 'today' ||
								activeView === 'upcoming' ||
								activeView === 'overdue' ||
								activeView === 'calendar') && (
								<Button onClick={handleCreateTask} theme="blue-light" size="medium">
									+ Добавить задачу
								</Button>
							)}
						</div>
					</div>

					{renderMainContent()}
				</div>
			</div>
		</div>
	);
});

export default PageTodos;
