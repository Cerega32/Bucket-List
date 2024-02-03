import {FC, useState} from 'react';
import {Svg} from '../Svg/Svg';
import {useBem} from '@/hooks/useBem';
import './field-input.scss';

interface FieldInputProps {
	className?: string;
	type?: string;
	placeholder: string;
	id: string;
	text?: string;
	value: string;
	setValue: (value: string) => void;
	iconBegin?: string;
}

export const FieldInput: FC<FieldInputProps> = (props) => {
	const {
		className,
		type = 'text',
		placeholder,
		id,
		text,
		value,
		setValue,
		iconBegin,
	} = props;

	const [block, element] = useBem('field-input', className);
	const [typeState, setTypeState] = useState(type);

	const toggleTypePassword = () => {
		if (typeState === 'password') {
			setTypeState('text');
		} else {
			setTypeState('password');
		}
	};

	return (
		<div className={block()}>
			{text && (
				<label className={element('label')} htmlFor={id}>
					{text}
				</label>
			)}
			<div className={element('wrapper')}>
				{iconBegin && (
					<Svg icon={iconBegin} className={element('icon-begin')} />
				)}
				<input
					className={element('input', {iconBegin: !!iconBegin})}
					id={id}
					type={typeState}
					placeholder={placeholder}
					value={value}
					onChange={(e) => setValue(e.target.value)}
				/>
				{type === 'password' && (
					<button
						type="button"
						className={element('show-password')}
						onClick={toggleTypePassword}
						aria-label="Показать пароль"
					>
						<Svg icon="eye" />
					</button>
				)}
			</div>
		</div>
	);
};
