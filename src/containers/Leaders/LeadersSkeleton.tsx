import {FC} from 'react';

import {Skeleton} from '@/components/Skeleton/Skeleton';
import {Title} from '@/components/Title/Title';
import {useBem} from '@/hooks/useBem';

import './leaders-skeleton.scss';

interface LeadersSkeletonProps {
	className?: string;
	rowsCount?: number;
}

export const LeadersSkeleton: FC<LeadersSkeletonProps> = (props) => {
	const {className, rowsCount = 5} = props;
	const [block, element] = useBem('leaders-skeleton', className);

	return (
		<div className={block()}>
			<div className={element('wrapper')}>
				<Title className={element('title')} tag="h1">
					Лидеры прошлой недели
				</Title>
				<p className={element('description')}>
					Выполняйте цели, оставляйте впечатления, зарабатывайте очки и попадайте в число лучших пользователей за неделю.
					Соревнуйтесь с другими и зарабатывайте награды в свой профиль. Покажите всем, что вы живёте полной жизнью!
				</p>
			</div>

			<div className={element('info')}>
				{Array.from({length: 3}).map((_, i) => (
					<div key={i} className={element('info-item')}>
						<Skeleton width="80%" height={14} />
						<Skeleton width="60%" height={24} />
					</div>
				))}
			</div>

			<div className={element('pedestal')}>
				{[2, 1, 3].map((place) => (
					<div key={place} className={element('pedestal-col', {[`place-${place}`]: true})}>
						<Skeleton className={element('pedestal-avatar')} circle width={64} height={64} />
						<Skeleton width="70%" height={18} />
						<Skeleton width="50%" height={12} />
					</div>
				))}
			</div>

			<div className={element('board')}>
				<div className={element('board-header')}>
					<Skeleton width={40} height={16} />
					<Skeleton width={160} height={16} />
					<Skeleton width={80} height={16} />
					<Skeleton width={80} height={16} />
				</div>
				{Array.from({length: rowsCount}).map((_, i) => (
					<div key={i} className={element('board-row')}>
						<Skeleton width={20} height={20} />
						<div className={element('board-user')}>
							<Skeleton circle width={44} height={44} />
							<div className={element('board-user-text')}>
								<Skeleton width={140} height={14} />
								<Skeleton width={90} height={12} />
							</div>
						</div>
						<Skeleton width={60} height={14} />
						<Skeleton width={60} height={14} />
					</div>
				))}
			</div>
		</div>
	);
};
