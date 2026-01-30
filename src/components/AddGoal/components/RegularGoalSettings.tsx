import {format} from 'date-fns';
import {FC} from 'react';

import {DatePicker} from '@/components/DatePicker/DatePicker';
import {FieldCheckbox} from '@/components/FieldCheckbox/FieldCheckbox';
import {FieldInput} from '@/components/FieldInput/FieldInput';
import Select from '@/components/Select/Select';
import {WeekDaySchedule, WeekDaySelector} from '@/components/WeekDaySelector/WeekDaySelector';
import {useBem} from '@/hooks/useBem';

interface RegularGoalSettingsProps {
	className?: string;
	isRegular: boolean;
	setIsRegular: (value: boolean) => void;
	regularFrequency: 'daily' | 'weekly' | 'custom';
	setRegularFrequency: (value: 'daily' | 'weekly' | 'custom') => void;
	weeklyFrequency: number;
	setWeeklyFrequency: (value: number) => void;
	customSchedule: WeekDaySchedule;
	setCustomSchedule: (value: WeekDaySchedule) => void;
	durationType: 'days' | 'weeks' | 'until_date' | 'indefinite';
	setDurationType: (value: 'days' | 'weeks' | 'until_date' | 'indefinite') => void;
	durationValue: number;
	setDurationValue: (value: number) => void;
	regularEndDate: string;
	setRegularEndDate: (value: string) => void;
	allowSkipDays: number;
	setAllowSkipDays: (value: number) => void;
	resetOnSkip: boolean;
	setResetOnSkip: (value: boolean) => void;
}

export const RegularGoalSettings: FC<RegularGoalSettingsProps> = (props) => {
	const {
		className,
		isRegular,
		setIsRegular,
		regularFrequency,
		setRegularFrequency,
		weeklyFrequency,
		setWeeklyFrequency,
		customSchedule,
		setCustomSchedule,
		durationType,
		setDurationType,
		durationValue,
		setDurationValue,
		regularEndDate,
		setRegularEndDate,
		allowSkipDays,
		setAllowSkipDays,
		resetOnSkip,
		setResetOnSkip,
	} = props;

	const [, element] = useBem('add-goal', className);

	return (
		<div className={element('regular-section')}>
			<FieldCheckbox
				id="is-regular"
				text="Это регулярная цель"
				checked={isRegular}
				setChecked={setIsRegular}
				className={element('field')}
			/>

			{isRegular && (
				<div className={element('regular-config')}>
					<div className={element('regular-field-group')}>
						<Select
							className={element('field')}
							placeholder="Выберите периодичность"
							options={[
								{name: 'Ежедневно', value: 'daily'},
								{name: 'N раз в неделю', value: 'weekly'},
								{name: 'Пользовательский график', value: 'custom'},
							]}
							activeOption={regularFrequency === 'daily' ? 0 : regularFrequency === 'weekly' ? 1 : 2}
							onSelect={(index) => {
								const frequencies = ['daily', 'weekly', 'custom'] as const;
								setRegularFrequency(frequencies[index]);
							}}
							text="Периодичность"
						/>

						{regularFrequency === 'weekly' && (
							<FieldInput
								placeholder="Например: 3"
								id="weekly-frequency"
								text="Сколько раз в неделю"
								value={weeklyFrequency.toString()}
								setValue={(value) => {
									const num = parseInt(value, 10) || 1;
									setWeeklyFrequency(Math.min(7, Math.max(1, num)));
								}}
								className={element('field')}
								type="number"
							/>
						)}

						{regularFrequency === 'custom' && (
							<div className={element('custom-schedule-selector')}>
								<p className={element('field-title')}>Выберите дни недели (обязательно хотя бы один)</p>
								<WeekDaySelector schedule={customSchedule} onChange={setCustomSchedule} />
							</div>
						)}
					</div>

					<div className={element('regular-field-group')}>
						<Select
							className={element('field')}
							placeholder="Выберите тип длительности"
							options={[
								{name: 'Дни', value: 'days'},
								{name: 'Недели', value: 'weeks'},
								{name: 'До даты', value: 'until_date'},
								{name: 'Бессрочно', value: 'indefinite'},
							]}
							activeOption={
								durationType === 'days' ? 0 : durationType === 'weeks' ? 1 : durationType === 'until_date' ? 2 : 3
							}
							onSelect={(index) => {
								const types = ['days', 'weeks', 'until_date', 'indefinite'] as const;
								setDurationType(types[index]);
							}}
							text="Длительность"
						/>

						{(durationType === 'days' || durationType === 'weeks') && (
							<FieldInput
								placeholder={durationType === 'days' ? 'Количество дней' : 'Количество недель'}
								id="duration-value"
								text={durationType === 'days' ? 'Количество дней' : 'Количество недель'}
								value={durationValue.toString()}
								setValue={(value) => {
									const num = parseInt(value, 10) || 1;
									setDurationValue(Math.max(1, num));
								}}
								className={element('field')}
								type="number"
							/>
						)}

						{durationType === 'until_date' && (
							<div className={element('date-field-container')}>
								<p className={element('field-title')}>Дата окончания</p>
								<DatePicker
									selected={regularEndDate ? new Date(regularEndDate) : null}
									onChange={(date) => {
										if (date) {
											setRegularEndDate(format(date, 'yyyy-MM-dd'));
										} else {
											setRegularEndDate('');
										}
									}}
									className={element('date-input')}
									placeholderText="ДД.ММ.ГГГГ"
									minDate={new Date(new Date().setDate(new Date().getDate() + 1))}
								/>
							</div>
						)}
					</div>

					<div className={element('regular-field-group')}>
						<FieldInput
							placeholder="0"
							id="allow-skip-days"
							text="Разрешенные пропуски"
							value={allowSkipDays.toString()}
							setValue={(value) => {
								const num = parseInt(value, 10) || 0;
								setAllowSkipDays(Math.max(0, num));
							}}
							className={element('field')}
							type="number"
						/>

						<FieldCheckbox
							id="reset-on-skip"
							text="Сбрасывать прогресс при превышении лимита пропусков"
							checked={resetOnSkip}
							setChecked={setResetOnSkip}
							className={element('field')}
						/>
					</div>
				</div>
			)}
		</div>
	);
};
