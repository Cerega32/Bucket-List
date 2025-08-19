import {observer} from 'mobx-react-lite';
import {FC} from 'react';

import {useBem} from '@/hooks/useBem';

import './field-select.scss';

export interface ISelectOption {
	value: string;
	text: string;
}

interface FieldSelectProps {
	className?: string;
	id: string;
	text: string;
	value: string;
	setValue: (value: string) => void;
	options: ISelectOption[];
	placeholder?: string;
	required?: boolean;
	disabled?: boolean;
}

export const FieldSelect: FC<FieldSelectProps> = observer(
	({className, id, text, value, setValue, options, placeholder = 'Выберите опцию', required = false, disabled = false}) => {
		const [block, element] = useBem('field-select', className);

		return (
			<div className={block()}>
				<label htmlFor={id} className={element('label')}>
					{text}
					{required && <span className={element('required')}>*</span>}
				</label>
				<select
					id={id}
					className={element('select')}
					value={value}
					onChange={(e) => setValue(e.target.value)}
					disabled={disabled}
					required={required}
				>
					<option value="" disabled>
						{placeholder}
					</option>
					{options.map((option) => (
						<option key={option.value} value={option.value}>
							{option.text}
						</option>
					))}
				</select>
			</div>
		);
	}
);
