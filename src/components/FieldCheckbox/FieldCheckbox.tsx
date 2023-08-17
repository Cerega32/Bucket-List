import {FC} from 'react';
import {Svg} from '../Svg/Svg';
import {useBem} from '@/hooks/useBem';
import './field-checkbox.scss';

interface FieldCheckboxProps {
	className?: string;
	placeholder: string;
	id: string;
	text: string;
	value: string;
	setValue: (value: string) => void;
}

export const FieldCheckbox: FC<FieldCheckboxProps> = (props) => {
	const {className, placeholder, id, text, value, setValue} = props;

	const [block, element] = useBem('field-checkbox', className);

	return (
		<div className={block()}>
			<input
				className={element('input')}
				id={id}
				type="checkbox"
				placeholder={placeholder}
				value={value}
				onChange={(e) => setValue(e.target.value)}
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
