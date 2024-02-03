import {FC} from 'react';

import {Svg} from '../Svg/Svg';

import {useBem} from '@/hooks/useBem';
import './field-checkbox.scss';

interface FieldCheckboxProps {
	className?: string;
	id: string;
	text: string;
	value: string;
	setChecked: (value: boolean) => void;
	checked: boolean;
}

export const FieldCheckbox: FC<FieldCheckboxProps> = (props) => {
	const {className, id, text, value, checked, setChecked} = props;

	const [block, element] = useBem('field-checkbox', className);

	return (
		<div className={block()}>
			<input
				className={element('input')}
				id={id}
				type="checkbox"
				value={value}
				onChange={() => setChecked(!checked)}
				checked={checked}
			/>
			<span className={element('checkbox')}>
				<Svg icon="done" className={element('icon')} />
			</span>
			<label className={element('label')} htmlFor={id}>
				{text}
			</label>
		</div>
	);
};
