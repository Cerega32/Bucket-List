import {format} from 'date-fns';
import {FC, useState} from 'react';

import {Button} from '@/components/Button/Button';
import {DatePicker} from '@/components/DatePicker/DatePicker';
import {FieldCheckbox} from '@/components/FieldCheckbox/FieldCheckbox';
import {FieldInput} from '@/components/FieldInput/FieldInput';
import Select from '@/components/Select/Select';
import {WeekDaySchedule, WeekDaySelector} from '@/components/WeekDaySelector/WeekDaySelector';
import {useBem} from '@/hooks/useBem';
import {NotificationStore} from '@/store/NotificationStore';
import {pluralize} from '@/utils/text/pluralize';

import {Banner} from '../Banner/Banner';
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
	showResetWarning?: boolean;
}

export const SetRegularGoalModal: FC<SetRegularGoalModalProps> = ({onSave, onCancel, initialSettings, showResetWarning}) => {
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
	const [endDate, setEndDate] = useState(() => {
		const initial = initialSettings?.endDate;
		if (!initial) return '';
		const tomorrow = new Date();
		tomorrow.setHours(0, 0, 0, 0);
		tomorrow.setDate(tomorrow.getDate() + 1);
		const initialDate = new Date(initial);
		if (Number.isNaN(initialDate.getTime()) || initialDate < tomorrow) {
			return format(tomorrow, 'yyyy-MM-dd');
		}
		return initial;
	});
	const [resetOnSkip, setResetOnSkip] = useState(initialSettings?.resetOnSkip || false);
	const [allowSkipDays, setAllowSkipDays] = useState(initialSettings?.allowSkipDays || 0);
	const [daysForEarnedSkip, setDaysForEarnedSkip] = useState(initialSettings?.daysForEarnedSkip || 0);
	const [markAsCompletedAfterSeries] = useState(initialSettings?.markAsCompletedAfterSeries || false);

	const handleSave = () => {
		if (frequency === 'custom' && !Object.values(customSchedule).some(Boolean)) {
			NotificationStore.addNotification({
				type: 'error',
				title: 'Ошибка',
				message: 'Выберите хотя бы один день недели для пользовательского графика',
			});
			return;
		}

		if (frequency === 'weekly' && weeklyFrequency < 1) {
			return;
		}

		if ((durationType === 'days' || durationType === 'weeks') && durationValue < 1) {
			return;
		}

		const settings: RegularGoalSettings = {
			frequency,
			weeklyFrequency: frequency === 'weekly' ? weeklyFrequency : undefined,
			customSchedule: frequency === 'custom' ? customSchedule : undefined,
			durationType,
			durationValue: durationType === 'days' || durationType === 'weeks' ? durationValue : undefined,
			endDate: durationType === 'until_date' ? endDate : undefined,
			resetOnSkip,
			allowSkipDays: resetOnSkip ? allowSkipDays : 0,
			daysForEarnedSkip: resetOnSkip ? daysForEarnedSkip : 0,
			markAsCompletedAfterSeries,
		};

		if (showResetWarning && initialSettings) {
			const initial = {
				frequency: initialSettings.frequency || 'daily',
				weeklyFrequency: initialSettings.frequency === 'weekly' ? initialSettings.weeklyFrequency ?? 3 : undefined,
				customSchedule: initialSettings.frequency === 'custom' ? initialSettings.customSchedule : undefined,
				durationType: initialSettings.durationType || 'days',
				durationValue:
					initialSettings.durationType === 'days' || initialSettings.durationType === 'weeks'
						? initialSettings.durationValue ?? 30
						: undefined,
				endDate: initialSettings.durationType === 'until_date' ? initialSettings.endDate ?? '' : undefined,
				resetOnSkip: initialSettings.resetOnSkip ?? false,
				allowSkipDays: initialSettings.resetOnSkip ?? false ? initialSettings.allowSkipDays ?? 0 : 0,
				daysForEarnedSkip: initialSettings.resetOnSkip ?? false ? initialSettings.daysForEarnedSkip ?? 0 : 0,
				markAsCompletedAfterSeries: initialSettings.markAsCompletedAfterSeries ?? false,
			};
			const isSame =
				settings.frequency === initial.frequency &&
				settings.durationType === initial.durationType &&
				settings.resetOnSkip === initial.resetOnSkip &&
				settings.markAsCompletedAfterSeries === initial.markAsCompletedAfterSeries &&
				(settings.weeklyFrequency ?? 0) === (initial.weeklyFrequency ?? 0) &&
				(settings.durationValue ?? 0) === (initial.durationValue ?? 0) &&
				(settings.endDate ?? '') === (initial.endDate ?? '') &&
				(settings.allowSkipDays ?? 0) === (initial.allowSkipDays ?? 0) &&
				(settings.daysForEarnedSkip ?? 0) === (initial.daysForEarnedSkip ?? 0) &&
				JSON.stringify(settings.customSchedule ?? {}) === JSON.stringify(initial.customSchedule ?? {});
			if (isSame) {
				NotificationStore.addNotification({
					type: 'warning',
					title: 'Нет изменений',
					message: 'Ни один параметр не был изменён',
				});
				return;
			}
		}

		onSave(settings);
	};

	return (
		<div className={block()}>
			<div className={element('content')}>
				{showResetWarning && (
					<Banner type="warning" title="При изменении параметров текущая серия будет сброшена!" className={element('banner')} />
				)}
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
									const num = parseInt(value, 10) || 0;
									setWeeklyFrequency(Math.min(7, Math.max(0, num)));
								}}
								className={element('field')}
								type="number"
								error={weeklyFrequency < 1 ? ['Значение должно быть не менее 1'] : false}
							/>
						)}

						{frequency === 'custom' && (
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
									const num = parseInt(value, 10) || 0;
									setDurationValue(Math.max(0, num));
								}}
								className={element('field')}
								type="number"
								error={durationValue < 1 ? ['Значение должно быть не менее 1'] : false}
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
										suffix={
											frequency === 'daily'
												? `${pluralize(daysForEarnedSkip, ['день', 'дня', 'дней'], false)}`
												: `${pluralize(daysForEarnedSkip, ['неделю', 'недели', 'недель'], false)}`
										}
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
