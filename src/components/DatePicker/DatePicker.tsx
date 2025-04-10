import {ru} from 'date-fns/locale';
import React, {forwardRef} from 'react';
import ReactDatePicker, {registerLocale} from 'react-datepicker';

import 'react-datepicker/dist/react-datepicker.css';
import {Svg} from '../Svg/Svg';
import './date-picker.scss';

// Регистрируем русскую локаль
registerLocale('ru', ru);

// Определяем собственный интерфейс для пропсов
export interface DatePickerProps {
	onChange: (date: Date | null) => void;
	className?: string;
	id?: string;
	selected?: Date | null;
	disabled?: boolean;
	minDate?: Date;
	maxDate?: Date;
	placeholderText?: string;
	isClearable?: boolean;
	showMonthDropdown?: boolean;
	showYearDropdown?: boolean;
	scrollableYearDropdown?: boolean;
	dateFormat?: string | string[];
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

export const DatePicker: React.FC<DatePickerProps> = ({
	className = '',
	onChange,
	id,
	selected,
	minDate: propMinDate,
	maxDate: propMaxDate,
	...props
}) => {
	// Рассчитываем максимальную дату (10 лет от текущей даты)
	const defaultMaxDate = new Date();
	defaultMaxDate.setFullYear(defaultMaxDate.getFullYear() + 10);
	const maxDate = propMaxDate || defaultMaxDate;

	// Рассчитываем минимальную дату (завтра)
	const defaultMinDate = new Date();
	defaultMinDate.setDate(defaultMinDate.getDate() + 1);
	const minDate = propMinDate || defaultMinDate;

	// Адаптер для преобразования сигнатуры onChange
	const handleChange = (date: Date | null) => {
		onChange(date);
	};

	return (
		<div className={`date-picker ${className}`}>
			<ReactDatePicker
				locale="ru"
				dateFormat="dd.MM.yyyy"
				onChange={handleChange as any}
				customInput={<CustomInput id={id} />}
				maxDate={maxDate}
				minDate={minDate}
				showPopperArrow={false}
				placeholderText="ДД.ММ.ГГГГ"
				selected={selected}
				{...props}
			/>
		</div>
	);
};
