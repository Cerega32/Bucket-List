import {FC, useState} from 'react';

import {useBem} from '@/hooks/useBem';

import {CharCount} from '../CharCount/CharCount';
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
	error?: boolean | Array<string>;
	required?: boolean;
	onFocus?: () => void;
	onBlur?: () => void;
	onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
	iconEnd?: string;
	iconEndClick?: () => void;
	theme?: 'transparent';
	// focusBorder?: 'white';
	maxLength?: number;
	showCharCount?: boolean;
	focusBorder?: 'white';
	rows?: number;
	disabled?: boolean;
	suffix?: string;
	max?: number;
	min?: number;
	minLength?: number;
	hint?: string;
	inputRef?: React.RefObject<HTMLInputElement | HTMLTextAreaElement>;
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
		iconEnd,
		iconEndClick,
		autoComplete = 'off',
		error,
		required,
		onFocus,
		onBlur,
		onKeyDown,
		theme,
		// focusBorder,
		maxLength,
		showCharCount = false,
		focusBorder,
		rows = 2,
		disabled = false,
		suffix,
		max,
		min,
		minLength,
		hint,
		inputRef,
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

	const hasError = Array.isArray(error) ? error.length > 0 : !!error;

	return (
		<div className={block({error: hasError, theme})}>
			{text && (
				<label className={element('label')} htmlFor={id}>
					{text}
				</label>
			)}
			<div className={element('wrapper')}>
				{iconBegin && <Svg icon={iconBegin} className={element('icon-begin')} width="16px" height="16px" />}
				{typeState === 'textarea' ? (
					<textarea
						className={element('input', {iconBegin: !!iconBegin, textarea: true, iconEnd: !!iconEnd})}
						id={id}
						placeholder={placeholder}
						value={value}
						onChange={handleChange}
						onFocus={onFocus}
						onBlur={onBlur}
						onKeyDown={onKeyDown}
						rows={rows}
						maxLength={maxLength}
						minLength={minLength}
						disabled={disabled}
						ref={inputRef as React.RefObject<HTMLTextAreaElement>}
					/>
				) : (
					<input
						className={element('input', {
							iconBegin: !!iconBegin,
							focusBorder,
							iconEnd: !!iconEnd || type === 'password',
							suffix: !!suffix,
						})}
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
						maxLength={maxLength}
						min={min}
						minLength={minLength}
						max={max}
						disabled={disabled}
						ref={inputRef as React.RefObject<HTMLInputElement>}
					/>
				)}
				{suffix && <span className={element('suffix')}>{suffix}</span>}
				{type === 'password' && (
					<button type="button" className={element('show-password')} onClick={toggleTypePassword} aria-label="Показать пароль">
						{typeState === 'password' ? (
							<Svg width="16px" height="16px" icon="eye-closed" />
						) : (
							<Svg width="16px" height="16px" icon="eye" />
						)}
					</button>
				)}
				{iconEnd &&
					(iconEndClick ? (
						<button
							type="button"
							className={element('icon-end', {clickable: true})}
							onClick={iconEndClick}
							aria-label="Выполнить поиск"
						>
							<Svg icon={iconEnd} />
						</button>
					) : (
						<Svg icon={iconEnd} className={element('icon-end')} />
					))}
			</div>
			{hint && (
				<small id={`${id}-hint`} className={element('hint')}>
					{hint}
				</small>
			)}
			{showCharCount && maxLength !== undefined && <CharCount current={value.length} max={maxLength} />}
			{Array.isArray(error) &&
				error.map((er) => (
					<p key={er} className={element('error')}>
						{er}
					</p>
				))}
		</div>
	);
};
