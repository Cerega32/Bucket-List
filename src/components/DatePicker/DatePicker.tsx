import {ru} from 'date-fns/locale';
import React, {forwardRef} from 'react';
import ReactDatePicker, {ReactDatePickerProps, registerLocale} from 'react-datepicker';

import 'react-datepicker/dist/react-datepicker.css';
import {Svg} from '../Svg/Svg';
import './date-picker.scss';

// Регистрируем русскую локаль
registerLocale('ru', ru);

export interface DatePickerProps extends Omit<ReactDatePickerProps, 'onChange'> {
	onChange: (date: Date | null) => void;
	className?: string;
	id?: string;
}

interface CustomInputProps {
	value?: string;
	onClick?: React.MouseEventHandler<HTMLInputElement>;
	onChange?: React.ChangeEventHandler<HTMLInputElement>;
	placeholder?: string;
	id?: string;
}

// Кастомный компонент для инпута
const CustomInput = forwardRef<HTMLInputElement, CustomInputProps>(({value, onClick, onChange, placeholder, id, ...rest}, ref) => (
	<div className="custom-date-input">
		<input
			ref={ref}
			id={id}
			value={value}
			onClick={onClick}
			onChange={onChange}
			placeholder={placeholder}
			readOnly // Чтобы пользователь не мог вводить текст, только через календарь
			{...rest}
		/>
		<button type="button" onClick={onClick as unknown as React.MouseEventHandler<HTMLButtonElement>} aria-label="Календарь">
			<Svg icon="calender" className="calendar-icon" />
		</button>
	</div>
));

CustomInput.displayName = 'CustomDateInput';

export const DatePicker: React.FC<DatePickerProps> = ({className = '', onChange, id, ...props}) => {
	// Рассчитываем максимальную дату (10 лет от текущей даты)
	const maxDate = new Date();
	maxDate.setFullYear(maxDate.getFullYear() + 10);

	// Рассчитываем минимальную дату (завтра)
	const minDate = new Date();
	minDate.setDate(minDate.getDate() + 1);

	return (
		<div className={`date-picker ${className}`}>
			<ReactDatePicker
				locale="ru"
				dateFormat="dd.MM.yyyy"
				onChange={onChange}
				customInput={<CustomInput id={id} />}
				maxDate={maxDate}
				minDate={minDate}
				showPopperArrow={false}
				placeholderText="ДД.ММ.ГГГГ"
				{...props}
			/>
		</div>
	);
};
