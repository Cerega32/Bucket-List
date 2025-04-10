import {format, parseISO} from 'date-fns';
import {ru} from 'date-fns/locale';
import React, {useEffect, useState} from 'react';

import {Button} from '@/components/Button/Button';
import {DatePicker} from '@/components/DatePicker/DatePicker';
import {useBem} from '@/hooks/useBem';
import {NotificationStore} from '@/store/NotificationStore';
import {deleteGoalTimer} from '@/utils/api/delete/deleteGoalTimer';
import {getGoalTimer, TimerInfo} from '@/utils/api/get/getGoalTimer';
import {setGoalTimer} from '@/utils/api/update/setGoalTimer';
import {pluralize} from '@/utils/text/pluralize';
import './goal-timer.scss';

export interface GoalTimerProps {
	goalCode: string;
	timer?: TimerInfo | null;
	onTimerUpdate?: (timer: TimerInfo | null) => void;
}

export const GoalTimer: React.FC<GoalTimerProps> = ({goalCode, timer: initialTimer, onTimerUpdate}) => {
	const [isSettingTimer, setIsSettingTimer] = useState(false);
	const [selectedDate, setSelectedDate] = useState<Date | null>(initialTimer?.deadline ? parseISO(initialTimer.deadline) : null);
	const [timer, setTimer] = useState<TimerInfo | null>(initialTimer || null);
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	const [block, element] = useBem('goal-timer');

	// Определяем функцию fetchTimerData перед ее использованием
	const fetchTimerData = async () => {
		setIsLoading(true);
		try {
			const response = await getGoalTimer(goalCode);

			if (response.success && response.data?.timer) {
				setTimer(response.data.timer);
				setSelectedDate(parseISO(response.data.timer.deadline));
			}
		} catch (err) {
			setError('Не удалось получить информацию о сроке выполнения');
		} finally {
			setIsLoading(false);
		}
	};

	// Получение данных таймера, если initialTimer не предоставлен
	useEffect(() => {
		if (!initialTimer) {
			fetchTimerData();
		}
	}, [initialTimer, goalCode]);

	const formatDate = (date: string): string => {
		return format(parseISO(date), 'd MMMM yyyy', {locale: ru});
	};

	const handleSetTimer = async () => {
		if (!selectedDate) {
			setError('Пожалуйста, выберите дату');
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			// Форматируем дату в формат yyyy-MM-dd для API
			const formattedDate = format(selectedDate, 'yyyy-MM-dd');
			const response = await setGoalTimer(goalCode, formattedDate);

			if (response.success && response.timer) {
				setTimer(response.timer);

				if (onTimerUpdate) {
					onTimerUpdate(response.timer);
				}

				setIsSettingTimer(false);

				NotificationStore.addNotification({
					type: 'success',
					title: 'Успех',
					message: response.message || 'Срок выполнения установлен',
				});
			} else {
				setError(response.message || 'Не удалось установить срок выполнения');
			}
		} catch (err) {
			setError('Произошла ошибка при установке срока выполнения');
		} finally {
			setIsLoading(false);
		}
	};

	const handleDeleteTimer = async () => {
		setIsLoading(true);

		try {
			const response = await deleteGoalTimer(goalCode);

			if (response.success) {
				setTimer(null);
				setSelectedDate(null);

				if (onTimerUpdate) {
					onTimerUpdate(null);
				}

				NotificationStore.addNotification({
					type: 'success',
					title: 'Успех',
					message: response.message || 'Срок выполнения удален',
				});
			} else {
				setError(response.message || 'Не удалось удалить срок выполнения');
			}
		} catch (err) {
			setError('Произошла ошибка при удалении срока выполнения');
		} finally {
			setIsLoading(false);
		}
	};

	const handleCancelTimerSetting = () => {
		setIsSettingTimer(false);
		setError(null);

		// Восстанавливаем предыдущую дату, если она была
		if (timer?.deadline) {
			setSelectedDate(parseISO(timer.deadline));
		} else {
			setSelectedDate(null);
		}
	};

	// Определяем кнопку сохранения в зависимости от статуса загрузки
	const renderSaveButton = () => {
		if (isLoading) {
			return (
				<Button onClick={() => {}} theme="blue" className={element('save-button')}>
					Сохранение...
				</Button>
			);
		}
		return (
			<Button onClick={handleSetTimer} theme="blue" className={element('save-button')}>
				Сохранить
			</Button>
		);
	};

	// Определяем кнопку удаления в зависимости от статуса загрузки
	const renderDeleteButton = () => {
		if (isLoading) {
			return (
				<Button onClick={() => {}} theme="red" className={element('delete-button')}>
					Удаление...
				</Button>
			);
		}
		return (
			<Button onClick={handleDeleteTimer} theme="red" className={element('delete-button')}>
				Удалить
			</Button>
		);
	};

	return (
		<div className={block()}>
			{error && <div className={element('error')}>{error}</div>}

			{isSettingTimer ? (
				<div className={element('setup')}>
					<div className={element('date-picker')}>
						<DatePicker
							className={element('date-input')}
							placeholderText="ДД.ММ.ГГГГ"
							selected={selectedDate}
							onChange={setSelectedDate}
							minDate={new Date(new Date().setDate(new Date().getDate() + 1))} // завтра
						/>
					</div>
					<div className={element('actions')}>
						{renderSaveButton()}
						<Button
							onClick={isLoading ? () => {} : handleCancelTimerSetting}
							theme="blue-light"
							className={element('cancel-button')}
						>
							Отмена
						</Button>
					</div>
				</div>
			) : (
				<div className={element('display')}>
					{timer?.deadline ? (
						<div className={element('info')}>
							<div className={element('deadline')}>
								<span className={element('label')}>Срок выполнения:</span>
								<span className={element('date')}>{formatDate(timer.deadline)}</span>
								{timer.daysLeft !== undefined && (
									<span className={element('days-left', {expired: timer.isExpired})}>
										{timer.isExpired
											? 'Срок истек'
											: `${pluralize(timer.daysLeft, ['Остался', 'Осталось', 'Осталось'], false)}: ${pluralize(
													timer.daysLeft,
													['день', 'дня', 'дней']
											  )}`}
									</span>
								)}
							</div>
							<div className={element('actions')}>
								<Button
									onClick={isLoading ? () => {} : () => setIsSettingTimer(true)}
									theme="blue-light"
									className={element('edit-button')}
								>
									Изменить
								</Button>
								{renderDeleteButton()}
							</div>
						</div>
					) : (
						<Button
							onClick={isLoading ? () => {} : () => setIsSettingTimer(true)}
							theme="blue-light"
							className={element('set-button')}
						>
							Установить срок выполнения
						</Button>
					)}
				</div>
			)}
		</div>
	);
};
