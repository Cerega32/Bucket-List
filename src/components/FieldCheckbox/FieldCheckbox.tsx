import {FC} from 'react';

import {useBem} from '@/hooks/useBem';

import {Svg} from '../Svg/Svg';

import './field-checkbox.scss';

interface FieldCheckboxProps {
	className?: string;
	id: string;
	text: string;
	setChecked: (value: boolean) => void;
	checked: boolean;
}

export const FieldCheckbox: FC<FieldCheckboxProps> = (props) => {
	const {className, id, text, checked, setChecked} = props;

	const [block, element] = useBem('field-checkbox', className);

	const handleKeyDown = (event: React.KeyboardEvent) => {
		if (event.key === ' ' || event.key === 'Enter') {
			event.preventDefault();
			setChecked(!checked);
		}
	};

	return (
		<div className={block()}>
			<input
				className={element('input')}
				id={id}
				type="checkbox"
				value={id}
				onChange={() => setChecked(!checked)}
				checked={checked}
			/>
			<label className={element('label')} htmlFor={id}>
				<span className={element('checkbox')} role="button" tabIndex={0} onKeyDown={handleKeyDown} aria-label={text}>
					<Svg icon="done" className={element('icon')} />
				</span>
				{text}
			</label>
		</div>
	);
};
