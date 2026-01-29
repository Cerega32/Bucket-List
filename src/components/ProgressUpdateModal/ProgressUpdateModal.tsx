import {observer} from 'mobx-react-lite';
import {FC, useState} from 'react';

import {useBem} from '@/hooks/useBem';
import {IGoalProgress, updateGoalProgress} from '@/utils/api/goals';

import {Button} from '../Button/Button';
import {FieldCheckbox} from '../FieldCheckbox/FieldCheckbox';
import {FieldInput} from '../FieldInput/FieldInput';
import {Progress} from '../Progress/Progress';

import './progress-update-modal.scss';

interface ProgressUpdateModalProps {
	goalId: number;
	goalTitle: string;
	currentProgress: IGoalProgress;
	onProgressUpdate: (progress: IGoalProgress) => void;
	onGoalCompleted?: () => void; // Новый колбэк для уведомления о завершении цели
	onClose: () => void;
}

export const ProgressUpdateModal: FC<ProgressUpdateModalProps> = observer(
	({goalId, currentProgress, onProgressUpdate, onGoalCompleted, onClose}) => {
		const [block, element] = useBem('progress-update-modal');

		const [newProgress, setNewProgress] = useState(currentProgress.progressPercentage.toString());
		const [notes, setNotes] = useState(currentProgress.dailyNotes || '');
		const [workedToday, setWorkedToday] = useState(currentProgress.isWorkingToday);
		const [isLoading, setIsLoading] = useState(false);

		const handleSave = async () => {
			setIsLoading(true);

			try {
				const progressValue = Math.min(100, Math.max(0, parseInt(newProgress, 10) || 0));

				// Обновляем прогресс цели
				const updateData = {
					progress_percentage: progressValue,
					daily_notes: notes,
					is_working_today: workedToday,
				};

				const response = await updateGoalProgress(goalId, updateData);
				if (response.success && response.data) {
					// Прогресс заданий обновляется автоматически на бэкенде

					// Если цель выполнена на 100%, уведомляем о завершении
					if (progressValue >= 100 && currentProgress.progressPercentage < 100) {
						// Уведомляем родительский компонент о завершении цели
						if (onGoalCompleted) {
							onGoalCompleted();
						}
					}

					onProgressUpdate(response.data);
					onClose();
				}
			} catch (error) {
				console.error('Ошибка сохранения прогресса:', error);
			} finally {
				setIsLoading(false);
			}
		};

		const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
			setNewProgress(e.target.value);
		};

		const progressValue = Math.min(100, Math.max(0, parseInt(newProgress, 10) || 0));

		return (
			<div className={block()}>
				<div className={element('header')}>
					<h3 className={element('title')}>Прогресс цели</h3>
				</div>

				<div className={element('content')}>
					<div className={element('progress-section')}>
						<div className={element('progress-header')}>
							<span className={element('progress-label')}>Текущий прогресс</span>
							<span className={element('progress-value')}>{progressValue}%</span>
						</div>
						<Progress done={progressValue} all={100} goal className={element('progress-bar')} />
					</div>

					<div className={element('slider-section')}>
						<label htmlFor="progress-slider" className={element('slider-label')}>
							Установить прогресс:
						</label>
						<input
							id="progress-slider"
							type="range"
							min="0"
							max="100"
							value={newProgress}
							onChange={handleSliderChange}
							className={element('slider')}
						/>
						<div className={element('slider-marks')}>
							<span>0%</span>
							<span>25%</span>
							<span>50%</span>
							<span>75%</span>
							<span>100%</span>
						</div>
					</div>

					<FieldInput
						id="progress-input"
						text="Точное значение (%)"
						value={newProgress}
						setValue={setNewProgress}
						placeholder="Введите процент (0-100)"
						type="number"
					/>

					<FieldInput
						id="progress-notes"
						text="Заметки о прогрессе (необязательно)"
						value={notes}
						setValue={setNotes}
						placeholder="Что было сделано сегодня?"
						type="textarea"
					/>

					<FieldCheckbox id="worked-today" text="Работал над целью сегодня" checked={workedToday} setChecked={setWorkedToday} />
				</div>

				<div className={element('actions')}>
					<Button theme="blue" onClick={handleSave} disabled={isLoading} loading={isLoading}>
						Сохранить прогресс
					</Button>
					<Button theme="blue-light" onClick={onClose} disabled={isLoading}>
						Отмена
					</Button>
				</div>
			</div>
		);
	}
);
