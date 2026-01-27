import {format} from 'date-fns';
import {FC, useState} from 'react';

import {Button} from '@/components/Button/Button';
import {DatePicker} from '@/components/DatePicker/DatePicker';
import {FieldCheckbox} from '@/components/FieldCheckbox/FieldCheckbox';
import {FieldInput} from '@/components/FieldInput/FieldInput';
import Select from '@/components/Select/Select';
import {WeekDaySchedule, WeekDaySelector} from '@/components/WeekDaySelector/WeekDaySelector';
import {useBem} from '@/hooks/useBem';

import './set-regular-goal-modal.scss';

export interface RegularGoalSettings {
	frequency: 'daily' | 'weekly' | 'custom';
	weeklyFrequency?: number;
	customSchedule?: WeekDaySchedule;
	durationType: 'days' | 'weeks' | 'until_date' | 'indefinite';
	durationValue?: number;
	endDate?: string;
	resetOnSkip: boolean;
	allowSkipDays?: number;
	daysForEarnedSkip?: number;
	markAsCompletedAfterSeries: boolean;
}

interface SetRegularGoalModalProps {
	onSave: (settings: RegularGoalSettings) => void;
	onCancel: () => void;
	initialSettings?: Partial<RegularGoalSettings>;
}

export const SetRegularGoalModal: FC<SetRegularGoalModalProps> = ({onSave, onCancel, initialSettings}) => {
	const [block, element] = useBem('set-regular-goal-modal');

	// Состояния формы
	const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'custom'>(initialSettings?.frequency || 'daily');
	const [weeklyFrequency, setWeeklyFrequency] = useState(initialSettings?.weeklyFrequency || 3);
	const [customSchedule, setCustomSchedule] = useState<WeekDaySchedule>(
		initialSettings?.customSchedule || {
			monday: false,
			tuesday: false,
			wednesday: false,
			thursday: false,
			friday: false,
			saturday: false,
			sunday: false,
		}
	);
	const [durationType, setDurationType] = useState<'days' | 'weeks' | 'until_date' | 'indefinite'>(
		initialSettings?.durationType || 'days'
	);
	const [durationValue, setDurationValue] = useState(initialSettings?.durationValue || 30);
	const [endDate, setEndDate] = useState(initialSettings?.endDate || '');
	const [resetOnSkip, setResetOnSkip] = useState(initialSettings?.resetOnSkip || false);
	const [allowSkipDays, setAllowSkipDays] = useState(initialSettings?.allowSkipDays || 0);
	const [daysForEarnedSkip, setDaysForEarnedSkip] = useState(initialSettings?.daysForEarnedSkip || 0);
	const [markAsCompletedAfterSeries] = useState(initialSettings?.markAsCompletedAfterSeries || false);

	const handleSave = () => {
		const settings: RegularGoalSettings = {
			frequency,
			weeklyFrequency: frequency === 'weekly' ? weeklyFrequency : undefined,
			customSchedule: frequency === 'custom' ? customSchedule : undefined,
			durationType,
			durationValue: durationType === 'days' || durationType === 'weeks' ? durationValue : undefined,
			endDate: durationType === 'until_date' ? endDate : undefined,
			resetOnSkip,
			allowSkipDays: resetOnSkip ? allowSkipDays : 0, // Всегда передаем значение, даже если resetOnSkip = false
			daysForEarnedSkip: resetOnSkip ? daysForEarnedSkip : 0, // Всегда передаем значение, даже если resetOnSkip = false
			markAsCompletedAfterSeries,
		};

		onSave(settings);
	};

	return (
		<div className={block()}>
			<div className={element('content')}>
				<div className={element('form')}>
					<div className={element('regular-field-group')}>
						<Select
							className={element('field')}
							placeholder="Выберите периодичность"
							options={[
								{name: 'Ежедневно', value: 'daily'},
								{name: 'N раз в неделю', value: 'weekly'},
								{name: 'Пользовательский график', value: 'custom'},
							]}
							activeOption={frequency === 'daily' ? 0 : frequency === 'weekly' ? 1 : 2}
							onSelect={(index) => {
								const frequencies = ['daily', 'weekly', 'custom'] as const;
								setFrequency(frequencies[index]);
							}}
							text="Периодичность"
						/>

						{frequency === 'weekly' && (
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

						{frequency === 'custom' && (
							<div className={element('custom-schedule-selector')}>
								<p className={element('field-title')}>Выберите дни недели</p>
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
									selected={endDate ? new Date(endDate) : null}
									onChange={(date) => {
										if (date) {
											setEndDate(format(date, 'yyyy-MM-dd'));
										} else {
											setEndDate('');
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
						<FieldCheckbox
							id="reset-on-skip"
							text="Сбрасывать прогресс при превышении лимита пропусков"
							checked={resetOnSkip}
							setChecked={setResetOnSkip}
							className={element('field')}
						/>

						{resetOnSkip && (
							<>
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
								<div className={element('field-with-suffix')}>
									<FieldInput
										placeholder="0"
										id="days-for-earned-skip"
										text="Начисление разрешенного пропуска через"
										value={daysForEarnedSkip.toString()}
										setValue={(value) => {
											const num = parseInt(value, 10) || 0;
											setDaysForEarnedSkip(Math.max(0, num));
										}}
										className={element('field')}
										type="number"
										suffix={frequency === 'weekly' ? 'недель' : 'дней'}
									/>
								</div>
							</>
						)}
						{/* TODO: Пока под вопросом, нужно или нет эта опция */}
						{/* <FieldCheckbox
							id="mark-as-completed-after-series"
							text="Отметить выполнение цели после успешного завершения серии"
							checked={markAsCompletedAfterSeries}
							setChecked={setMarkAsCompletedAfterSeries}
							className={element('field')}
						/> */}
					</div>
				</div>
			</div>

			<div className={element('footer')}>
				<Button theme="blue-light" className={element('btn')} onClick={onCancel} type="button">
					Отмена
				</Button>
				<Button theme="blue" className={element('btn')} onClick={handleSave} type="button">
					Сохранить
				</Button>
			</div>
		</div>
	);
};
