import {FC} from 'react';
import {Link} from 'react-router-dom';

import {useBem} from '@/hooks/useBem';
import {IHundredGoalsList} from '@/typings/dashboard';

import {Button} from '../Button/Button';
import {Title} from '../Title/Title';

import './hundred-goals-progress.scss';

interface HundredGoalsProgressProps {
	className?: string;
	progress: IHundredGoalsList;
}

export const HundredGoalsProgress: FC<HundredGoalsProgressProps> = ({className, progress}) => {
	const [block, element] = useBem('hundred-goals-progress', className);

	// Подготовка данных для отображения
	const categoryItems = Object.entries(progress.categories).map(([name, count]) => ({
		name,
		count,
	}));

	// Сортируем по количеству целей (от большего к меньшему)
	categoryItems.sort((a, b) => b.count - a.count);

	return (
		<section className={block()}>
			<div className={element('header')}>
				<Title className={element('title')} tag="h2">
					Твои 100 целей на жизнь
				</Title>
				<Link to="/list/100-goals" className={element('link')}>
					<Button theme="blue" size="small">
						Посмотреть список
					</Button>
				</Link>
			</div>

			<div className={element('content')}>
				<div className={element('progress-container')}>
					<div className={element('progress-circle')}>
						<svg viewBox="0 0 36 36" className={element('progress-svg')}>
							<path
								className={element('progress-bg')}
								d="M18 2.0845
									a 15.9155 15.9155 0 0 1 0 31.831
									a 15.9155 15.9155 0 0 1 0 -31.831"
							/>
							<path
								className={element('progress-fill')}
								strokeDasharray={`${progress.percentage}, 100`}
								d="M18 2.0845
									a 15.9155 15.9155 0 0 1 0 31.831
									a 15.9155 15.9155 0 0 1 0 -31.831"
							/>
							<text x="18" y="20.35" className={element('progress-text')}>
								{progress.progress}
							</text>
						</svg>
					</div>
					<div className={element('progress-info')}>
						<div className={element('progress-stat')}>
							<span className={element('progress-label')}>Выполнено:</span>
							<span className={element('progress-value')}>{progress.completed}/100</span>
						</div>
						<div className={element('progress-stat')}>
							<span className={element('progress-label')}>Добавлено:</span>
							<span className={element('progress-value')}>{progress.progress}/100</span>
						</div>
						<div className={element('progress-stat')}>
							<span className={element('progress-label')}>Осталось добавить:</span>
							<span className={element('progress-value')}>{100 - progress.progress}</span>
						</div>
					</div>
				</div>

				<div className={element('categories')}>
					<h3 className={element('categories-title')}>Распределение по категориям:</h3>
					<div className={element('categories-list')}>
						{categoryItems.map((item) => (
							<div key={`category-${item.name}`} className={element('category-item')}>
								<span className={element('category-name')}>{item.name}</span>
								<div className={element('category-bar')}>
									<div
										className={element('category-fill')}
										style={{width: `${(item.count / progress.progress) * 100}%`}}
									/>
								</div>
								<span className={element('category-count')}>{item.count}</span>
							</div>
						))}
					</div>
				</div>
			</div>
		</section>
	);
};
