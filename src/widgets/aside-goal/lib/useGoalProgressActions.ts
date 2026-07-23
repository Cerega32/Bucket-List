import {type KeyboardEvent, useEffect, useState} from 'react';

import {IGoalProgress, resetGoalProgress, updateGoalProgress} from '@/entities/goal/api/goals';
import {refreshHeaderGoalCounts} from '@/entities/goal/lib/refreshHeaderGoalCounts';
import {HeaderProgressGoalsStore} from '@/entities/goal/model/HeaderProgressGoalsStore';
import {IGoal, IRegularGoalConfig} from '@/entities/goal/model/types';
import {ModalStore} from '@/shared/model/ModalStore';
import {NotificationStore} from '@/shared/model/NotificationStore';
import {buildDraftGoalProgress} from '@/widgets/aside-goal/lib/asideGoalCalculations';

type UpdateGoalFn = (code: string, operation: string, done?: boolean) => Promise<void | boolean>;

interface UseGoalProgressActionsParams {
	isList: boolean;
	isAdded: boolean;
	goalId: number | undefined;
	goalUserProgress: IGoalProgress | null | undefined;
	canEditProgress: boolean;
	regularConfig: IRegularGoalConfig | undefined;
	title: string;
	code: string;
	image: string | null | undefined;
	done: boolean;
	page: string | undefined;
	updateGoal: UpdateGoalFn;
	onGoalCompleted: (() => void) | undefined;
	onHistoryRefresh: (() => void) | undefined;
	onGoalUpdate: ((updatedGoal?: IGoal | Partial<IGoal>) => void) | undefined;
}

interface UseGoalProgressActionsReturn {
	progress: IGoalProgress | null;
	isCompleted: boolean;
	isProgressGoalComplete: boolean;
	handleOpenProgressModalOrStart: () => void;
	handleProgressBarClick: () => void;
	handleProgressBarKeyDown: (e: KeyboardEvent) => void;
	handleMarkToday: () => Promise<void>;
	handleMarkGoalClick: () => void;
	isDeleteProgressModalOpen: boolean;
	openDeleteProgressModal: () => void;
	closeDeleteProgressModal: () => void;
	handleConfirmDeleteProgress: () => Promise<void>;
	isUncompleteWithProgressModalOpen: boolean;
	closeUncompleteWithProgressModal: () => void;
	handleConfirmUncompleteWithProgress: () => Promise<void>;
}

/** Состояние и обработчики блока прогресса цели (не регулярной, без готовых серий) */
export const useGoalProgressActions = (params: UseGoalProgressActionsParams): UseGoalProgressActionsReturn => {
	const {
		isList,
		isAdded,
		goalId,
		goalUserProgress,
		canEditProgress,
		regularConfig,
		title,
		code,
		image,
		done,
		page,
		updateGoal,
		onGoalCompleted,
		onHistoryRefresh,
		onGoalUpdate,
	} = params;

	const [progress, setProgress] = useState<IGoalProgress | null>(null);
	const [isCompleted, setIsCompleted] = useState(done);
	const [isDeleteProgressModalOpen, setIsDeleteProgressModalOpen] = useState(false);
	const [isUncompleteWithProgressModalOpen, setIsUncompleteWithProgressModalOpen] = useState(false);

	const {setIsOpen, setWindow, setModalProps} = ModalStore;

	useEffect(() => {
		setIsCompleted(done);
	}, [done]);

	// Прогресс только из ответа GET цели (userProgress); отдельных запросов к /progress/ нет
	useEffect(() => {
		if (!isAdded || isList || !goalId) {
			// Иначе после «удалить → снова добавить» остаётся старый локальный progress
			setProgress(null);
			return;
		}
		setProgress(goalUserProgress ?? null);
	}, [isAdded, isList, goalId, goalUserProgress]);

	const patchParentUserProgress = (next: IGoalProgress | null) => {
		if (!onGoalUpdate) return;
		onGoalUpdate({
			userProgress: next,
			progressEntriesCount: next?.progressEntriesCount ?? next?.recentEntries?.length ?? 0,
		});
	};

	const openProgressModal = (progressOverride?: IGoalProgress) => {
		if (!canEditProgress) {
			return;
		}
		const current = progressOverride ?? progress;
		if (!isList && goalId && current) {
			setWindow('progress-update');
			setIsOpen(true);
			setModalProps({
				goalId,
				goalTitle: title,
				currentProgress: current,
				onProgressUpdate: (updatedProgress: IGoalProgress) => {
					setProgress(updatedProgress);
					patchParentUserProgress(updatedProgress);
					// Если прогресс достиг 100%, отмечаем как выполненную
					if (updatedProgress.progressPercentage >= 100) {
						setIsCompleted(true);
					}
					if (page === 'isGoalProgressHistory' && onHistoryRefresh) {
						onHistoryRefresh();
					}
					// Обновляем счётчик прогресса в шапке (counts в профиле + стор)
					refreshHeaderGoalCounts();
				},
				onGoalCompleted: () => {
					setIsCompleted(true);
					if (onGoalCompleted) {
						onGoalCompleted();
					}
					// Обновляем счётчик прогресса в шапке (counts в профиле + стор)
					refreshHeaderGoalCounts();
				},
			});
		}
	};

	const handleOpenProgressModalOrStart = () => {
		if (isList || !goalId || !isAdded || regularConfig || !canEditProgress) return;
		if (!progress) {
			openProgressModal(buildDraftGoalProgress({goalId, title, code, image}));
		} else {
			openProgressModal();
		}
	};

	const handleProgressBarClick = () => {
		if (!canEditProgress) {
			return;
		}
		openProgressModal();
	};

	const handleProgressBarKeyDown = (e: KeyboardEvent) => {
		if (!canEditProgress) {
			return;
		}
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			openProgressModal();
		}
	};

	const handleMarkToday = async () => {
		if (!goalId || !progress || !canEditProgress) return;
		const newWorkingToday = !progress.isWorkingToday;
		try {
			const response = await updateGoalProgress(goalId, {
				progress_percentage: progress.progressPercentage,
				daily_notes: progress.dailyNotes || '',
				is_working_today: newWorkingToday,
			});
			if (response.success && response.data) {
				setProgress(response.data);
				patchParentUserProgress(response.data);
				// Обновляем счётчик прогресса в шапке
				HeaderProgressGoalsStore.loadGoalsInProgress();
			}
		} catch (error) {
			console.error('Ошибка отметки сегодня:', error);
			NotificationStore.addNotification({
				type: 'error',
				title: 'Ошибка',
				message: error instanceof Error ? error.message : 'Не удалось обновить отметку',
			});
		}
	};

	const handleMarkGoal = async (isCurrentlyCompleted: boolean) => {
		// Если цель снимается с выполнения и есть прогресс — сброс только с Premium
		if (isCurrentlyCompleted && progress && goalId && canEditProgress) {
			try {
				await resetGoalProgress(goalId);
				setProgress(null);
				patchParentUserProgress(null);
				onHistoryRefresh?.();
			} catch (error) {
				console.error('Ошибка сброса прогресса:', error);
				NotificationStore.addNotification({
					type: 'error',
					title: 'Ошибка',
					message: error instanceof Error ? error.message : 'Не удалось сбросить прогресс',
				});
				return;
			}
		}

		// Если цель отмечается как выполненная и есть прогресс < 100%, подтягиваем прогресс до 100%
		if (!isCurrentlyCompleted && progress && goalId && progress.progressPercentage < 100) {
			try {
				const response = await updateGoalProgress(goalId, {
					progress_percentage: 100,
					daily_notes: progress.dailyNotes || '',
					is_working_today: progress.isWorkingToday ?? false,
				});
				if (response.success && response.data) {
					setProgress(response.data);
					patchParentUserProgress(response.data);
					onHistoryRefresh?.();
				}
			} catch (error) {
				console.error('Ошибка обновления прогресса до 100%:', error);
			}
		}

		setIsCompleted(!isCurrentlyCompleted);

		if (!isList) {
			await updateGoal(code, 'mark', isCurrentlyCompleted);
		}

		// Обновляем счётчик прогресса в шапке (прогресс мог быть сброшен или цель завершена)
		refreshHeaderGoalCounts();
	};

	/** Отмена выполнения: при активном прогрессе и Premium — подтверждение (прогресс будет удалён) */
	const handleMarkGoalClick = () => {
		if (!isList && isCompleted && progress && goalId && canEditProgress) {
			setIsUncompleteWithProgressModalOpen(true);
			return;
		}
		handleMarkGoal(isCompleted).catch(() => {});
	};

	const handleConfirmDeleteProgress = async () => {
		if (!goalId) return;
		await resetGoalProgress(goalId);
		setProgress(null);
		patchParentUserProgress(null);
		if (onHistoryRefresh) {
			onHistoryRefresh();
		}
		refreshHeaderGoalCounts();
	};

	const handleConfirmUncompleteWithProgress = async () => {
		await handleMarkGoal(true);
	};

	const isProgressGoalComplete = progress != null && progress.progressPercentage >= 100;

	return {
		progress,
		isCompleted,
		isProgressGoalComplete,
		handleOpenProgressModalOrStart,
		handleProgressBarClick,
		handleProgressBarKeyDown,
		handleMarkToday,
		handleMarkGoalClick,
		isDeleteProgressModalOpen,
		openDeleteProgressModal: () => setIsDeleteProgressModalOpen(true),
		closeDeleteProgressModal: () => setIsDeleteProgressModalOpen(false),
		handleConfirmDeleteProgress,
		isUncompleteWithProgressModalOpen,
		closeUncompleteWithProgressModal: () => setIsUncompleteWithProgressModalOpen(false),
		handleConfirmUncompleteWithProgress,
	};
};
