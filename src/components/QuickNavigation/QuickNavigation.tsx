import {FC} from 'react';
import {Link} from 'react-router-dom';

import {useBem} from '@/hooks/useBem';

import {Svg} from '../Svg/Svg';

import './quick-navigation.scss';

interface QuickNavigationProps {
	className?: string;
	goalsCount: number;
	listsCount: number;
	categoriesCount: number;
}

export const QuickNavigation: FC<QuickNavigationProps> = ({className, goalsCount, listsCount, categoriesCount}) => {
	const [block, element] = useBem('quick-navigation', className);

	const navigationItems = [
		{
			title: 'Мои цели',
			icon: 'target',
			count: goalsCount,
			link: '/user/self/active-goals',
			color: '#4A6FDC',
		},
		{
			title: 'Мои списки',
			icon: 'list',
			count: listsCount,
			link: '/user/self/active-goals/lists',
			color: '#FF9800',
		},
		{
			title: 'Категории',
			icon: 'categories',
			count: categoriesCount,
			link: '/categories',
			color: '#4CAF50',
		},
		{
			title: 'Создать цель',
			icon: 'plus',
			link: '/goals/create',
			color: '#9C27B0',
			isAction: true,
		},
	];

	return (
		<div className={block()}>
			{navigationItems.map((item) => (
				<Link key={`nav-${item.title}`} to={item.link} className={element('item', {action: item.isAction})}>
					<div className={element('icon-container')} style={{backgroundColor: item.color}}>
						<Svg icon={item.icon} width="24px" height="24px" className={element('icon')} />
					</div>
					<div className={element('info')}>
						<span className={element('title')}>{item.title}</span>
						{item.count !== undefined && <span className={element('count')}>{item.count}</span>}
					</div>
				</Link>
			))}
		</div>
	);
};
