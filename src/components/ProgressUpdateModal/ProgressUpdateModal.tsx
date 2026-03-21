import {observer} from 'mobx-react-lite';
import {FC, useEffect, useState} from 'react';

import {useBem} from '@/hooks/useBem';
import {IGoalProgress, updateGoalProgress} from '@/utils/api/goals';

import {Button} from '../Button/Button';
import {FieldCheckbox} from '../FieldCheckbox/FieldCheckbox';
import {FieldInput} from '../FieldInput/FieldInput';
import {Progress} from '../Progress/Progress';

import './progress-update-modal.scss';

/** Черновик (id=0) или 0% без истории — первое сохранение может быть с нулём */
function isProgressNotStartedYet(cp: IGoalProgress): boolean {
	return cp.id === 0 || (cp.progressPercentage === 0 && (cp.progressEntriesCount ?? 0) === 0);
}

interface ProgressUpdateModalProps {
	goalId: number;
	goalTitle: string;
	currentProgress: IGoalProgress;
	onProgressUpdate: (progress: IGoalProgress) => void;
	onGoalCompleted?: () => void;
	onClose: () => void;
}

export const ProgressUpdateModal: FC<ProgressUpdateModalProps> = observer(
	({goalId, currentProgress, onProgressUpdate, onGoalCompleted, onClose}) => {
		const [block, element] = useBem('progress-update-modal');

		const [newProgress, setNewProgress] = useState(currentProgress.progressPercentage.toString());
		const [notes, setNotes] = useState(currentProgress.dailyNotes || '');
		const [workedToday, setWorkedToday] = useState(false);
		const [isLoading, setIsLoading] = useState(false);
		const [isSliderDragging, setIsSliderDragging] = useState(false);

		useEffect(() => {
			if (!isSliderDragging) return;

			const clearDragging = () => setIsSliderDragging(false);
			window.addEventListener('pointerup', clearDragging);
			window.addEventListener('pointercancel', clearDragging);

			return () => {
				window.removeEventListener('pointerup', clearDragging);
				window.removeEventListener('pointercancel', clearDragging);
			};
		}, [isSliderDragging]);

		const handleSave = async () => {
			setIsLoading(true);

			try {
				const progressValue = Math.min(100, Math.max(0, parseInt(newProgress, 10) || 0));
				if (progressValue === currentProgress.progressPercentage && !isProgressNotStartedYet(currentProgress)) {
					return;
				}

				// Уже отмечено кнопкой «Отметить сегодня» — остаётся true; иначе — галочка в модалке
				const updateData = {
					progress_percentage: progressValue,
					daily_notes: notes,
					is_working_today: currentProgress.isWorkingToday ? true : workedToday,
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

		const handleInputChange = (value: string) => {
			if (value === '') {
				setNewProgress('');
				return;
			}

			const numeric = parseInt(value, 10);

			if (Number.isNaN(numeric)) {
				return;
			}

			const clamped = Math.min(100, Math.max(0, numeric));
			setNewProgress(clamped.toString());
		};

		const progressValue = Math.min(100, Math.max(0, parseInt(newProgress, 10) || 0));
		const percentChanged = progressValue !== currentProgress.progressPercentage;
		const isProgressNotStarted = isProgressNotStartedYet(currentProgress);
		const canSave = percentChanged || isProgressNotStarted;
		const isAtStart = progressValue <= 4;
		const isAtEnd = progressValue >= 95;

		return (
			<div className={block()}>
				<div className={element('header')}>
					<h3 className={element('title')}>Прогресс цели</h3>
				</div>

				<div className={element('content')}>
					<div className={element('slider-section')}>
						<div className={element('progress-header')}>
							<label htmlFor="progress-slider" className={element('slider-label')}>
								Текущий прогресс (в процентах %)
							</label>
							<Progress variant="numbers" done={progressValue} all={100} goal className={element('progress-bar')} />
						</div>
						<div className={element('slider-wrap')}>
							<div
								className={element('slider-tooltip', {
									visible: isSliderDragging,
									'align-left': isAtStart,
									'align-right': isAtEnd,
								})}
								style={!isAtStart && !isAtEnd ? {left: `${progressValue}%`} : undefined}
								aria-hidden
							>
								{progressValue}%
							</div>
							<input
								id="progress-slider"
								type="range"
								min="0"
								max="100"
								value={newProgress}
								onChange={handleSliderChange}
								onPointerDown={() => setIsSliderDragging(true)}
								className={element('slider')}
								style={{'--progress-percent': `${progressValue}%`} as React.CSSProperties}
							/>
						</div>
					</div>

					<FieldInput
						id="progress-input"
						text="Точное значение"
						max={100}
						min={0}
						value={newProgress}
						setValue={handleInputChange}
						placeholder="Введите процент (0-100)"
						type="number"
						suffix="%"
						className={element('field')}
					/>

					<FieldInput
						id="progress-notes"
						text="Заметка изменения прогресса"
						value={notes}
						setValue={setNotes}
						placeholder="Опишите свои впечатления о выполнении"
						type="textarea"
						className={element('field')}
					/>

					{!currentProgress.isWorkingToday && (
						<div className={element('pre-footer')}>
							<FieldCheckbox
								id="worked-today-modal"
								text="Работал над целью сегодня"
								checked={workedToday}
								setChecked={setWorkedToday}
								className={element('field')}
							/>
						</div>
					)}
				</div>

				<p className={element('hint')}>
					Сохранение доступно только при изменении процента. Без смены процента отметьте день кнопкой «Отметить сегодня» на
					карточке.
				</p>

				<div className={element('footer')}>
					<Button theme="blue-light" className={element('btn')} onClick={onClose} disabled={isLoading} type="button">
						Отмена
					</Button>
					<Button
						theme="blue"
						className={element('btn')}
						onClick={handleSave}
						disabled={isLoading || !canSave}
						loading={isLoading}
						type="button"
					>
						Сохранить
					</Button>
				</div>
			</div>
		);
	}
);
