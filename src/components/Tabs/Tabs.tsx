import {FC} from 'react';
import {Link} from 'react-router-dom';

import {Svg} from '../Svg/Svg';

import {useBem} from '@/hooks/useBem';

import './tabs.scss';

export interface ITabs {
	url: string;
	name: string;
	page: string;
	count?: number;
	icon?: string;
}

interface TabsProps {
	className?: string;
	tabs: Array<ITabs>;
	active: string;
	base?: string;
	vertical?: boolean;
}

export const Tabs: FC<TabsProps> = (props) => {
	const {className, tabs, active, base = '', vertical} = props;

	const [block, element] = useBem('tabs', className);

	return (
		<section className={block({vertical})}>
			{tabs.map((tab) => (
				<Link key={tab.name} to={`${base}${tab.url}`} className={element('link', {active: active === tab.page})}>
					{tab.icon && <Svg icon={tab.icon} />}
					{tab.name}
					{!!tab.count && <span className={element('count')}>{tab.count}</span>}
				</Link>
			))}
		</section>
	);
};
