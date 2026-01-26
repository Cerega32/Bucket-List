import {FC, ReactNode} from 'react';

import {useBem} from '@/hooks/useBem';

import {Svg} from '../Svg/Svg';

import './field-checkbox.scss';

interface FieldCheckboxProps {
	className?: string;
	id: string;
	text: string | ReactNode;
	setChecked: (value: boolean) => void;
	checked: boolean;
	disabled?: boolean;
}

export const FieldCheckbox: FC<FieldCheckboxProps> = (props) => {
	const {className, id, text, checked, setChecked, disabled = false} = props;

	const [block, element] = useBem('field-checkbox');

	const handleKeyDown = (event: React.KeyboardEvent) => {
		if (disabled) return;
		if (event.key === ' ' || event.key === 'Enter') {
			event.preventDefault();
			setChecked(!checked);
		}
	};

	return (
		<div className={block({disabled})}>
			<input
				className={element('input')}
				id={id}
				type="checkbox"
				value={id}
				onChange={() => !disabled && setChecked(!checked)}
				checked={checked}
				disabled={disabled}
			/>
			<label className={`${element('label')} ${className}`} htmlFor={id}>
				<span
					className={element('checkbox')}
					role="button"
					tabIndex={disabled ? -1 : 0}
					onKeyDown={handleKeyDown}
					aria-label={typeof text === 'string' ? text : 'Согласие'}
					aria-disabled={disabled}
				>
					<Svg icon="done" className={element('icon')} />
				</span>
				{text}
			</label>
		</div>
	);
};
