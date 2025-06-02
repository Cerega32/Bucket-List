import {FC, useState} from 'react';

import {useBem} from '@/hooks/useBem';

import {Svg} from '../Svg/Svg';

import './field-input.scss';

interface FieldInputProps {
	className?: string;
	type?: string;
	placeholder: string;
	id: string;
	text?: string;
	value: string;
	setValue?: (value: string) => void;
	setValueTarget?: (value: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
	iconBegin?: string;
	autoComplete?: string;
	error?: Array<string>;
	required?: boolean;
	onFocus?: () => void;
	onBlur?: () => void;
	onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
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
		setValueTarget,
		iconBegin,
		autoComplete = 'off',
		error,
		required,
		onFocus,
		onBlur,
		onKeyDown,
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

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		if (setValueTarget) {
			setValueTarget(e);
		} else if (setValue) {
			setValue(e.target.value);
		}
	};

	return (
		<div className={block({error: !!error})}>
			{text && (
				<label className={element('label')} htmlFor={id}>
					{text}
				</label>
			)}
			<div className={element('wrapper')}>
				{iconBegin && <Svg icon={iconBegin} className={element('icon-begin')} />}
				{typeState === 'textarea' ? (
					<textarea
						className={element('input', {iconBegin: !!iconBegin})}
						id={id}
						placeholder={placeholder}
						value={value}
						onChange={handleChange}
						onFocus={onFocus}
						onBlur={onBlur}
						onKeyDown={onKeyDown}
					/>
				) : (
					<input
						className={element('input', {iconBegin: !!iconBegin})}
						id={id}
						type={typeState}
						placeholder={placeholder}
						value={value}
						onChange={handleChange}
						autoComplete={autoComplete}
						required={required}
						onFocus={onFocus}
						onBlur={onBlur}
						onKeyDown={onKeyDown}
					/>
				)}
				{type === 'password' && (
					<button type="button" className={element('show-password')} onClick={toggleTypePassword} aria-label="Показать пароль">
						{typeState === 'password' ? <Svg icon="eye" /> : <Svg icon="eye-closed" />}
					</button>
				)}
			</div>
			{error?.map((er) => (
				<p key={er} className={element('error')}>
					{er}
				</p>
			))}
		</div>
	);
};
