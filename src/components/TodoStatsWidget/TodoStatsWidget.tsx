import {FC} from 'react';

import {useBem} from '@/hooks/useBem';
import {TodoStats} from '@/typings/todo';

import './todo-stats-widget.scss';

interface TodoStatsWidgetProps {
	className?: string;
	stats: TodoStats | null;
}

export const TodoStatsWidget: FC<TodoStatsWidgetProps> = ({className, stats}) => {
	const [block, element] = useBem('todo-stats-widget', className);

	if (!stats) {
		return (
			<div className={block()}>
				<div className={element('header')}>
					<h3 className={element('title')}>Статистика</h3>
				</div>
				<div className={element('loading')}>Загрузка...</div>
			</div>
		);
	}

	return (
		<div className={block()}>
			<div className={element('header')}>
				<h3 className={element('title')}>Статистика</h3>
			</div>

			<div className={element('section')}>
				<h4 className={element('section-title')}>Списки</h4>
				<div className={element('stats')}>
					<div className={element('stat')}>
						<span className={element('stat-value')}>{stats.lists.total}</span>
						<span className={element('stat-label')}>Всего</span>
					</div>
					<div className={element('stat')}>
						<span className={element('stat-value')}>{stats.lists.active}</span>
						<span className={element('stat-label')}>Активных</span>
					</div>
					<div className={element('stat')}>
						<span className={element('stat-value')}>{stats.lists.archived}</span>
						<span className={element('stat-label')}>Архивных</span>
					</div>
				</div>
			</div>

			<div className={element('section')}>
				<h4 className={element('section-title')}>Задачи</h4>
				<div className={element('stats')}>
					<div className={element('stat')}>
						<span className={element('stat-value')}>{stats.tasks.total}</span>
						<span className={element('stat-label')}>Всего</span>
					</div>
					<div className={element('stat')}>
						<span className={element('stat-value')}>{stats.tasks.completed}</span>
						<span className={element('stat-label')}>Выполнено</span>
					</div>
					<div className={element('stat')}>
						<span className={element('stat-value')}>{stats.tasks.pending}</span>
						<span className={element('stat-label')}>В работе</span>
					</div>
					{stats.tasks.overdue > 0 && (
						<div className={element('stat', {overdue: true})}>
							<span className={element('stat-value')}>{stats.tasks.overdue}</span>
							<span className={element('stat-label')}>Просрочено</span>
						</div>
					)}
				</div>
			</div>

			{stats.tasks.total > 0 && (
				<div className={element('progress')}>
					<div className={element('progress-bar')}>
						<div
							className={element('progress-fill')}
							style={{
								width: `${Math.round((stats.tasks.completed / stats.tasks.total) * 100)}%`,
							}}
						/>
					</div>
					<span className={element('progress-text')}>
						{Math.round((stats.tasks.completed / stats.tasks.total) * 100)}% выполнено
					</span>
				</div>
			)}
		</div>
	);
};
