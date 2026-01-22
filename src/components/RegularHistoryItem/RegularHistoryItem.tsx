import {FC} from 'react';

import {useBem} from '@/hooks/useBem';
import {IRegularGoalHistory} from '@/typings/goal';
import {pluralize} from '@/utils/text/pluralize';
import {formatDateString} from '@/utils/time/formatDate';

import {Line} from '../Line/Line';
import {Svg} from '../Svg/Svg';

import './regular-history-item.scss';

interface RegularHistoryItemProps {
	className?: string;
	history: IRegularGoalHistory;
	allowCustomSettings?: boolean; // Разрешены ли пользовательские настройки
}

export const RegularHistoryItem: FC<RegularHistoryItemProps> = (props) => {
	const {className, history, allowCustomSettings = false} = props;

	const [block, element] = useBem('regular-history-item', className);

	// Определяем иконку и текст в зависимости от статуса
	const iconName = history.status === 'completed' ? 'regular-checked' : 'regular-cancel';
	const statusText = history.status === 'completed' ? 'Серия выполнена' : 'Серия прервана';

	// Определяем единицу измерения (дни или недели) в зависимости от частоты
	const isWeekly = history.regularGoalData.frequency === 'weekly' || history.regularGoalData.frequency === 'custom';
	const streakValue = history.streak;
	const unit = isWeekly ? pluralize(streakValue, ['неделя', 'недели', 'недель']) : pluralize(streakValue, ['день', 'дня', 'дней']);

	// Форматирование периодичности
	const getFrequencyText = () => {
		const {frequency, weeklyFrequency, customSchedule} = history.regularGoalData;
		if (frequency === 'daily') return 'Ежедневно';
		if (frequency === 'weekly') return `${weeklyFrequency || 0} раз в неделю`;
		if (frequency === 'custom') {
			const selectedDays = Object.entries(customSchedule || {})
				.filter(([_, value]) => value)
				.map(([day]) => {
					const dayNames: Record<string, string> = {
						monday: 'Пн',
						tuesday: 'Вт',
						wednesday: 'Ср',
						thursday: 'Чт',
						friday: 'Пт',
						saturday: 'Сб',
						sunday: 'Вс',
					};
					return dayNames[day] || day;
				});
			return selectedDays.length > 0 ? selectedDays.join(', ') : 'Пользовательский график';
		}
		return '';
	};

	// Форматирование длительности
	const getDurationText = () => {
		const {durationType, durationValue, endDate} = history.regularGoalData;
		if (durationType === 'days') return pluralize(durationValue || 0, ['день', 'дня', 'дней']);
		if (durationType === 'weeks') return pluralize(durationValue || 0, ['неделя', 'недели', 'недель']);
		if (durationType === 'until_date') return endDate ? `До ${formatDateString(endDate)}` : 'До даты';
		if (durationType === 'indefinite') return 'Бессрочно';
		return '';
	};

	return (
		<div className={block()}>
			<div className={element('header')}>
				<div className={element('icon-wrapper')}>
					<Svg icon={iconName} />
				</div>
				<div className={element('content')}>
					<p className={element('status')}>{statusText}</p>
					<p className={element('date')}>{formatDateString(history.endDate)}</p>
				</div>
				<div className={element('stats')}>
					<span className={element('streak')}>{unit}</span>
				</div>
			</div>
			{/* Настройки серии - показываем только если разрешены пользовательские настройки */}
			{allowCustomSettings && (
				<>
					<Line className={element('line')} />
					<div className={element('settings')}>
						<div className={element('setting-item')}>
							<span className={element('setting-label')}>Периодичность:</span>
							<span className={element('setting-value')}>{getFrequencyText()}</span>
						</div>
						<div className={element('setting-item')}>
							<span className={element('setting-label')}>Длительность:</span>
							<span className={element('setting-value')}>{getDurationText()}</span>
						</div>
						<div className={element('setting-item')}>
							<span className={element('setting-label')}>Сброс прогресса:</span>
							<span className={element('setting-value')}>{history.regularGoalData.resetOnSkip ? 'Да' : 'Нет'}</span>
						</div>
						{history.regularGoalData.resetOnSkip && (
							<div className={element('setting-item')}>
								<span className={element('setting-label')}>Разрешенные пропуски:</span>
								<span className={element('setting-value')}>
									{history.regularGoalData.allowSkipDays || 0}
									{history.regularGoalData.daysForEarnedSkip && history.regularGoalData.daysForEarnedSkip > 0
										? ` (начисление через ${history.regularGoalData.daysForEarnedSkip} ${isWeekly ? 'недель' : 'дней'})`
										: ''}
								</span>
							</div>
						)}
					</div>
				</>
			)}
		</div>
	);
};
