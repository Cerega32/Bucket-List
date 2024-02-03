import {FC} from 'react';
import {Link} from 'react-router-dom';
import {useBem} from '@/hooks/useBem';

import './switch.scss';

export interface ISwitch {
	url: string;
	name: string;
	page?: string;
	count?: number;
}

interface SwitchProps {
	className?: string;
	buttons: Array<ISwitch>;
	active: string;
	base?: string;
}

export const Switch: FC<SwitchProps> = (props) => {
	const {className, buttons, active, base = ''} = props;

	const [block, element] = useBem('switch', className);

	return (
		<section className={block()}>
			{buttons.map((tab) => (
				<Link
					to={`${base}${tab.url}`}
					className={element('link', {active: active === tab.page})}
				>
					{tab.name}
					{!!tab.count && (
						<span className={element('count')}>{tab.count}</span>
					)}
				</Link>
			))}
		</section>
	);
};
