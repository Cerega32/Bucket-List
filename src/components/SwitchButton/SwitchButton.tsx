import {FC} from 'react';

import {useBem} from '@/hooks/useBem';

import './switch-button.scss';

export interface ISwitch {
	id: string;
	name: string;
	count?: number;
}

interface SwitchButtonProps {
	className?: string;
	buttons: Array<ISwitch>;
	active: string;
	onChange: (id: string) => void;
}

export const SwitchButton: FC<SwitchButtonProps> = (props) => {
	const {className, buttons, active, onChange} = props;

	const [block, element] = useBem('switch-button', className);

	const handleClick = (id: string) => {
		if (active !== id) {
			onChange(id);
		}
	};

	return (
		<section className={block()}>
			{buttons.map((tab) => (
				<button
					key={tab.id}
					className={element('button', {active: active === tab.id})}
					onClick={() => handleClick(tab.id)}
					type="button"
				>
					{tab.name}
					{!!tab.count && <span className={element('count')}>{tab.count}</span>}
				</button>
			))}
		</section>
	);
};
