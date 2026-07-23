import {format, parseISO} from 'date-fns';
import {ru} from 'date-fns/locale';
import {observer} from 'mobx-react-lite';
import React, {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';

import {deleteGoalTimer} from '@/entities/goal/api/deleteGoalTimer';
import {getGoalTimer, TimerInfo} from '@/entities/goal/api/getGoalTimer';
import {setGoalTimer} from '@/entities/goal/api/setGoalTimer';
import {isPremiumSubscriptionActive} from '@/entities/regular-goal/lib/checkRegularGoalsAddLimit';
import {UserStore} from '@/entities/user/model/UserStore';
import {useBem} from '@/shared/lib/hooks/useBem';
import {pluralize} from '@/shared/lib/text/pluralize';
import {NotificationStore} from '@/shared/model/NotificationStore';
import {Button} from '@/shared/ui/Button/Button';
import {DatePicker} from '@/shared/ui/DatePicker/DatePicker';
import {Tag} from '@/shared/ui/Tag/Tag';
import '@/entities/goal/ui/GoalTimer/goal-timer.scss';

export interface GoalTimerProps {
	goalCode: string;
	timer?: TimerInfo | null;
	onTimerUpdate?: (timer: TimerInfo | null) => void;
}

export const GoalTimer: React.FC<GoalTimerProps> = observer(({goalCode, timer: initialTimer, onTimerUpdate}) => {
	const isPremium = isPremiumSubscriptionActive(UserStore.userSelf);
	const canManageTimer = isPremium;
	const [isSettingTimer, setIsSettingTimer] = useState(false);
	const [selectedDate, setSelectedDate] = useState<Date | null>(initialTimer?.deadline ? parseISO(initialTimer.deadline) : null);
	const [timer, setTimer] = useState<TimerInfo | null>(initialTimer || null);
	const [serverError, setServerError] = useState<string | null>(null);
	const [dateError, setDateError] = useState<string[]>([]);
	const [isLoading, setIsLoading] = useState(false);

	const [block, element] = useBem('goal-timer');

	const fetchTimerData = async () => {
		setIsLoading(true);
		try {
			const response = await getGoalTimer(goalCode);

			if (response.success && response.data?.timer) {
				setTimer(response.data.timer);
				setSelectedDate(parseISO(response.data.timer.deadline));
			}
		} catch (err) {
			setServerError('Не удалось получить информацию о сроке выполнения');
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		if (!initialTimer) {
			fetchTimerData();
		}
	}, [initialTimer, goalCode]);

	const formatDate = (date: string): string => {
		return format(parseISO(date), 'd MMMM yyyy', {locale: ru});
	};

	const handleSetTimer = async () => {
		if (!canManageTimer) {
			return;
		}

		if (!selectedDate) {
			setDateError(['Пожалуйста, выберите дату']);
			return;
		}

		const formattedDate = format(selectedDate, 'yyyy-MM-dd');

		if (timer?.deadline) {
			const existingDate = timer.deadline.length >= 10 ? timer.deadline.slice(0, 10) : format(parseISO(timer.deadline), 'yyyy-MM-dd');
			if (existingDate === formattedDate) {
				setIsSettingTimer(false);
				setDateError([]);
				setServerError(null);
				return;
			}
		}

		setIsLoading(true);
		setDateError([]);
		setServerError(null);

		try {
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
				setServerError(response.message || 'Не удалось установить срок выполнения');
			}
		} catch (err) {
			setServerError('Произошла ошибка при установке срока выполнения');
		} finally {
			setIsLoading(false);
		}
	};

	const handleDeleteTimer = async () => {
		if (!canManageTimer) {
			return;
		}

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
				setServerError(response.message || 'Не удалось удалить срок выполнения');
			}
		} catch (err) {
			setServerError('Произошла ошибка при удалении срока выполнения');
		} finally {
			setIsLoading(false);
		}
	};

	const handleCancelTimerSetting = () => {
		setIsSettingTimer(false);
		setDateError([]);
		setServerError(null);

		if (timer?.deadline) {
			setSelectedDate(parseISO(timer.deadline));
		} else {
			setSelectedDate(null);
		}
	};

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

	const renderDeleteButton = () => (
		<Button
			icon="trash"
			onClick={handleDeleteTimer}
			theme="red-delete"
			size="small"
			width="auto"
			className={element('delete-button')}
			loading={isLoading}
		/>
	);

	const openTimerSetup = () => {
		if (!canManageTimer) {
			return;
		}

		setDateError([]);
		setServerError(null);
		setIsSettingTimer(true);
	};

	const renderPremiumSetButton = () => (
		<Button type="Link" href="/premium" theme="blue-light" className={element('set-button')} icon="lock">
			<span className={element('set-button-content')} title="Доступно с Premium">
				Установить срок
				<Tag text="Premium" theme="gold" className={element('premium-tag')} />
			</span>
		</Button>
	);

	return (
		<div className={block()}>
			{serverError && <div className={element('error')}>{serverError}</div>}

			{isSettingTimer && canManageTimer ? (
				<div className={element('setup')}>
					<div className={element('date-picker')}>
						<DatePicker
							className={element('date-input')}
							placeholderText="ДД.ММ.ГГГГ"
							selected={selectedDate}
							onChange={(d) => {
								setSelectedDate(d);
								setDateError([]);
							}}
							error={dateError}
							minDate={new Date(new Date().setDate(new Date().getDate() + 1))}
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
								<div className={element('row')}>
									<span className={element('label')}>Срок выполнения:</span>
									<span className={element('date')}>{formatDate(timer.deadline)}</span>
								</div>
								{timer.daysLeft !== undefined && (
									<div className={element('row')}>
										<span className={element('label')}>Осталось:</span>
										<span className={element('days-left', {expired: timer.isExpired})}>
											{timer.isExpired ? 'Срок истек' : pluralize(timer.daysLeft, ['день', 'дня', 'дней'])}
										</span>
									</div>
								)}
							</div>
							{canManageTimer && (
								<div className={element('actions')}>
									<Button
										onClick={isLoading ? () => {} : openTimerSetup}
										theme="blue-edit"
										className={element('edit-button')}
										size="small"
										width="auto"
										icon="edit"
									/>
									{renderDeleteButton()}
								</div>
							)}
							{!canManageTimer && (
								<p className={element('premium-hint')}>
									Редактирование срока доступно с{' '}
									<Link to="/premium" className={element('premium-link')}>
										Premium
									</Link>
								</p>
							)}
						</div>
					) : canManageTimer ? (
						<Button
							onClick={isLoading ? () => {} : openTimerSetup}
							theme="blue-light"
							className={element('set-button')}
							icon="stopwatch"
						>
							Установить срок
						</Button>
					) : (
						renderPremiumSetButton()
					)}
				</div>
			)}
		</div>
	);
});
