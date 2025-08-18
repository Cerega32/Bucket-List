import {format} from 'date-fns';
import {FC, useEffect, useState} from 'react';

import {Button} from '@/components/Button/Button';
import {DatePicker} from '@/components/DatePicker/DatePicker';
import {FieldCheckbox} from '@/components/FieldCheckbox/FieldCheckbox';
import {FieldInput} from '@/components/FieldInput/FieldInput';
import {Modal} from '@/components/Modal/Modal';
import Select from '@/components/Select/Select';
import {Svg} from '@/components/Svg/Svg';
import {Title} from '@/components/Title/Title';
import {useBem} from '@/hooks/useBem';
import {NotificationStore} from '@/store/NotificationStore';

import './regular-goal-settings-modal.scss';

interface RegularGoalData {
	id: number;
	title: string;
	code: string;
	image?: string;
	category?: {
		id: number;
		name: string;
	};
}

interface RegularSettings {
	frequency: 'daily' | 'weekly' | 'custom';
	weeklyFrequency?: number;
	customSchedule?: any;
	durationType: 'days' | 'weeks' | 'until_date' | 'indefinite';
	durationValue?: number;
	endDate?: string;
	allowSkipDays: number;
	resetOnSkip: boolean;
}

interface RegularGoalSettingsModalProps {
	isOpen: boolean;
	onClose: () => void;
	goalData: RegularGoalData;
	originalSettings: RegularSettings;
	onSave: (settings: RegularSettings) => void;
	isLoading?: boolean;
}

export const RegularGoalSettingsModal: FC<RegularGoalSettingsModalProps> = ({
	isOpen,
	onClose,
	goalData,
	originalSettings,
	onSave,
	isLoading = false,
}) => {
	const [block, element] = useBem('regular-goal-settings-modal');

	// Состояния формы
	const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'custom'>(originalSettings.frequency);
	const [weeklyFrequency, setWeeklyFrequency] = useState(originalSettings.weeklyFrequency || 3);
	const [durationType, setDurationType] = useState<'days' | 'weeks' | 'until_date' | 'indefinite'>(originalSettings.durationType);
	const [durationValue, setDurationValue] = useState(originalSettings.durationValue || 30);
	const [endDate, setEndDate] = useState(originalSettings.endDate || '');
	const [allowSkipDays, setAllowSkipDays] = useState(originalSettings.allowSkipDays || 0);
	const [resetOnSkip, setResetOnSkip] = useState(originalSettings.resetOnSkip);

	// Обновляем состояния при изменении originalSettings
	useEffect(() => {
		setFrequency(originalSettings.frequency);
		setWeeklyFrequency(originalSettings.weeklyFrequency || 3);
		setDurationType(originalSettings.durationType);
		setDurationValue(originalSettings.durationValue || 30);
		setEndDate(originalSettings.endDate || '');
		setAllowSkipDays(originalSettings.allowSkipDays || 0);
		setResetOnSkip(originalSettings.resetOnSkip);
	}, [originalSettings]);

	const handleSave = () => {
		// Валидация
		if (frequency === 'weekly' && (!weeklyFrequency || weeklyFrequency < 1 || weeklyFrequency > 7)) {
			NotificationStore.addNotification({
				type: 'error',
				title: 'Ошибка',
				message: 'Для недельной периодичности необходимо указать количество раз в неделю (от 1 до 7)',
			});
			return;
		}

		if (durationType === 'until_date' && !endDate) {
			NotificationStore.addNotification({
				type: 'error',
				title: 'Ошибка',
				message: 'Для типа "до даты" необходимо указать дату окончания',
			});
			return;
		}

		if ((durationType === 'days' || durationType === 'weeks') && (!durationValue || durationValue < 1)) {
			NotificationStore.addNotification({
				type: 'error',
				title: 'Ошибка',
				message: 'Для указанного типа длительности необходимо задать положительное значение',
			});
			return;
		}

		const settings: RegularSettings = {
			frequency,
			weeklyFrequency: frequency === 'weekly' ? weeklyFrequency : undefined,
			customSchedule: frequency === 'custom' ? {} : undefined,
			durationType,
			durationValue: durationType === 'days' || durationType === 'weeks' ? durationValue : undefined,
			endDate: durationType === 'until_date' ? endDate : undefined,
			allowSkipDays,
			resetOnSkip,
		};

		onSave(settings);
	};

	const handleReset = () => {
		setFrequency(originalSettings.frequency);
		setWeeklyFrequency(originalSettings.weeklyFrequency || 3);
		setDurationType(originalSettings.durationType);
		setDurationValue(originalSettings.durationValue || 30);
		setEndDate(originalSettings.endDate || '');
		setAllowSkipDays(originalSettings.allowSkipDays || 0);
		setResetOnSkip(originalSettings.resetOnSkip);
	};

	if (!isOpen) return null;

	return (
		<Modal isOpen={isOpen} onClose={onClose} className={block()}>
			<div className={element('header')}>
				<div className={element('goal-info')}>
					{goalData.image && <img src={goalData.image} alt={goalData.title} className={element('goal-image')} />}
					<div className={element('goal-details')}>
						<Title tag="h2" className={element('title')}>
							Настройка регулярности
						</Title>
						<p className={element('goal-title')}>{goalData.title}</p>
						{goalData.category && <p className={element('goal-category')}>Категория: {goalData.category.name}</p>}
					</div>
				</div>
				<button type="button" className={element('close-btn')} onClick={onClose} aria-label="Закрыть">
					<Svg icon="cross" />
				</button>
			</div>

			<div className={element('content')}>
				<div className={element('info-message')}>
					<Svg icon="info" className={element('info-icon')} />
					<p>
						Эта цель была создана как регулярная. Вы можете настроить параметры регулярности под себя или оставить оригинальные
						настройки автора.
					</p>
				</div>

				<div className={element('original-settings')}>
					<h3 className={element('section-title')}>Оригинальные настройки автора:</h3>
					<div className={element('settings-info')}>
						<p>
							<strong>Периодичность:</strong>{' '}
							{originalSettings.frequency === 'daily'
								? 'Ежедневно'
								: originalSettings.frequency === 'weekly'
								? `${originalSettings.weeklyFrequency} раз в неделю`
								: 'Пользовательский график'}
						</p>
						<p>
							<strong>Длительность:</strong>{' '}
							{originalSettings.durationType === 'days'
								? `${originalSettings.durationValue} дней`
								: originalSettings.durationType === 'weeks'
								? `${originalSettings.durationValue} недель`
								: originalSettings.durationType === 'until_date'
								? `До ${originalSettings.endDate}`
								: 'Бессрочно'}
						</p>
						<p>
							<strong>Пропуски:</strong> {originalSettings.allowSkipDays} дней,{' '}
							{originalSettings.resetOnSkip ? 'сбрасывать прогресс' : 'не сбрасывать прогресс'}
						</p>
					</div>
				</div>

				<div className={element('form')}>
					<h3 className={element('section-title')}>Ваши настройки:</h3>

					<div className={element('form-group')}>
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
							<div className={element('custom-schedule-info')}>
								<p>Пользовательский график будет доступен в следующих версиях</p>
							</div>
						)}
					</div>

					<div className={element('form-group')}>
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

					<div className={element('form-group')}>
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
			</div>

			<div className={element('footer')}>
				<Button theme="blue-light" className={element('btn')} onClick={handleReset} type="button">
					Сбросить к оригиналу
				</Button>
				<Button theme="blue-light" className={element('btn')} onClick={onClose} type="button">
					Отмена
				</Button>
				<Button theme="blue" className={element('btn')} onClick={handleSave} type="button" active={isLoading}>
					{isLoading ? 'Сохранение...' : 'Добавить цель'}
				</Button>
			</div>
		</Modal>
	);
};
