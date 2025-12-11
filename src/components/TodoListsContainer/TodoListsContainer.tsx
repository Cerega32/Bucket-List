import {FC} from 'react';

import {useBem} from '@/hooks/useBem';
import useScreenSize from '@/hooks/useScreenSize';
import {TodoList} from '@/typings/todo';

import {Button} from '../Button/Button';
import {EmptyState} from '../EmptyState/EmptyState';

import './todo-lists-container.scss';

interface TodoListsContainerProps {
	className?: string;
	lists: TodoList[];
	onListSelect: (listId: string) => void;
	onCreateList: () => void;
	loading?: boolean;
}

export const TodoListsContainer: FC<TodoListsContainerProps> = ({className, lists, onListSelect, onCreateList, loading = false}) => {
	const [block, element] = useBem('todo-lists-container', className);
	const {isScreenMobile} = useScreenSize();

	if (loading) {
		return (
			<div className={block()}>
				<div className={element('loading')}>Загрузка списков...</div>
			</div>
		);
	}

	if (lists.length === 0) {
		return (
			<div className={block()}>
				<EmptyState
					title="У вас пока нет списков задач"
					description="Создайте свой первый список, чтобы начать организовывать задачи"
				>
					<Button onClick={onCreateList} theme="blue" size={isScreenMobile ? 'medium' : undefined}>
						+ Создать первый список
					</Button>
				</EmptyState>
			</div>
		);
	}

	return (
		<div className={block()}>
			<div className={element('header')}>
				<h2 className={element('title')}>Мои списки задач</h2>
				<span className={element('count')}>
					{lists.length} спис{lists.length === 1 ? 'ок' : 'ков'}
				</span>
			</div>

			<div className={element('grid')}>
				{lists.map((list) => (
					<div
						key={list.id}
						className={element('card')}
						onClick={() => onListSelect(list.id)}
						onKeyDown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								onListSelect(list.id);
							}
						}}
						role="button"
						tabIndex={0}
						aria-label={`Открыть список ${list.title}`}
					>
						<div className={element('card-header')}>
							<div className={element('card-icon')} style={{backgroundColor: list.color}}>
								{list.icon}
							</div>
							<div className={element('card-info')}>
								<h3 className={element('card-title')}>{list.title}</h3>
								{list.description && <p className={element('card-description')}>{list.description}</p>}
							</div>
						</div>

						<div className={element('card-stats')}>
							<div className={element('stat')}>
								<span className={element('stat-value')}>{list.totalTasks}</span>
								<span className={element('stat-label')}>задач</span>
							</div>
							<div className={element('stat')}>
								<span className={element('stat-value')}>{list.completedTasks}</span>
								<span className={element('stat-label')}>выполнено</span>
							</div>
						</div>

						{list.totalTasks > 0 && (
							<div className={element('progress')}>
								<div className={element('progress-bar')}>
									<div
										className={element('progress-fill')}
										style={{
											width: `${list.progressPercentage}%`,
											backgroundColor: list.color,
										}}
									/>
								</div>
								<span className={element('progress-text')}>{list.progressPercentage}%</span>
							</div>
						)}

						<div className={element('card-footer')}>
							<span className={element('card-date')}>Создан {new Date(list.createdAt).toLocaleDateString()}</span>
							{!list.isActive && <span className={element('card-archived')}>Архивный</span>}
						</div>
					</div>
				))}
			</div>
		</div>
	);
};
