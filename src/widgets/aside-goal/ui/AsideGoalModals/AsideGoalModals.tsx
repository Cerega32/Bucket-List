import {FC} from 'react';

import {IRegularGoalConfig, IRegularGoalStatistics} from '@/entities/goal/model/types';
import {GoalMergeRequestModal} from '@/features/goal-merge-request/GoalMergeRequestModal';
import {RegularGoalSettings, SetRegularGoalModal} from '@/features/set-regular-goal/SetRegularGoalModal';
import {ShareGoalModal} from '@/features/share-goal/ShareGoalModal';
import {Modal} from '@/shared/ui/Modal/Modal';
import {ModalConfirm} from '@/shared/ui/ModalConfirm/ModalConfirm';

interface AsideGoalModalsProps {
	isList: boolean;
	isAdded: boolean;
	code: string;
	title: string;
	image: string | null | undefined;
	regularConfig?: IRegularGoalConfig;
	localStatistics: IRegularGoalStatistics | null;

	isShareModalOpen: boolean;
	onCloseShareModal: () => void;

	isMergeModalOpen: boolean;
	onCloseMergeModal: () => void;

	isCompleteSeriesModalOpen: boolean;
	onCloseCompleteSeriesModal: () => void;
	onConfirmCompleteSeries: (markAsCompleted?: boolean) => void | Promise<void>;

	isResetCompletedSeriesModalOpen: boolean;
	onCloseResetCompletedSeriesModal: () => void;
	onConfirmResetCompletedSeries: () => void | Promise<void>;

	isDeleteProgressModalOpen: boolean;
	onCloseDeleteProgressModal: () => void;
	onConfirmDeleteProgress: () => void | Promise<void>;

	isUncompleteWithProgressModalOpen: boolean;
	onCloseUncompleteWithProgressModal: () => void;
	onConfirmUncompleteWithProgress: () => void | Promise<void>;

	isEditSettingsModalOpen: boolean;
	onCloseEditSettingsModal: () => void;
	onSaveSettings: (settings: RegularGoalSettings) => void | Promise<void>;

	isConfirmResetSeriesModalOpen: boolean;
	onCloseConfirmResetSeriesModal: () => void;
	onConfirmResetSeries: () => void | Promise<void>;

	isAddRegularGoalModalOpen: boolean;
	onCloseAddRegularGoalModal: () => void;
	onSaveAddSettings: (settings: RegularGoalSettings) => void | Promise<void>;
}

/** Хвостовые модалки AsideGoal: шеринг, мердж дублей, регулярные серии и настройки регулярности. */
export const AsideGoalModals: FC<AsideGoalModalsProps> = (props) => {
	const {
		isList,
		isAdded,
		code,
		title,
		image,
		regularConfig,
		localStatistics,
		isShareModalOpen,
		onCloseShareModal,
		isMergeModalOpen,
		onCloseMergeModal,
		isCompleteSeriesModalOpen,
		onCloseCompleteSeriesModal,
		onConfirmCompleteSeries,
		isResetCompletedSeriesModalOpen,
		onCloseResetCompletedSeriesModal,
		onConfirmResetCompletedSeries,
		isDeleteProgressModalOpen,
		onCloseDeleteProgressModal,
		onConfirmDeleteProgress,
		isUncompleteWithProgressModalOpen,
		onCloseUncompleteWithProgressModal,
		onConfirmUncompleteWithProgress,
		isEditSettingsModalOpen,
		onCloseEditSettingsModal,
		onSaveSettings,
		isConfirmResetSeriesModalOpen,
		onCloseConfirmResetSeriesModal,
		onConfirmResetSeries,
		isAddRegularGoalModalOpen,
		onCloseAddRegularGoalModal,
		onSaveAddSettings,
	} = props;

	return (
		<>
			<ShareGoalModal isOpen={isShareModalOpen} onClose={onCloseShareModal} />
			{!isList && (
				<GoalMergeRequestModal
					isOpen={isMergeModalOpen}
					onClose={onCloseMergeModal}
					sourceGoalCode={code}
					sourceGoalTitle={title}
					sourceGoalImage={image}
					sourceGoalIsRegular={!!regularConfig}
				/>
			)}
			{/* Модалка подтверждения завершения серии */}
			{regularConfig && isAdded && (
				<ModalConfirm
					isOpen={isCompleteSeriesModalOpen}
					onClose={onCloseCompleteSeriesModal}
					title="Завершение серии"
					text={
						regularConfig.durationType === 'indefinite'
							? 'Вы действительно хотите завершить текущую серию выполнения цели? Вы сможете начать новую серию позже.'
							: 'Вы действительно хотите прервать текущую серию выполнения цели?'
					}
					textBtnCancel="Отмена"
					textBtn="Завершить"
					themeBtn="red"
					handleBtn={onConfirmCompleteSeries}
					checkboxText={regularConfig.durationType === 'indefinite' ? 'Отметить серию выполненной' : undefined}
					checkboxId="mark-as-completed"
				/>
			)}
			{/* Модалка подтверждения сброса завершенной серии (отмена выполнения) */}
			{regularConfig && isAdded && (
				<ModalConfirm
					isOpen={isResetCompletedSeriesModalOpen}
					onClose={onCloseResetCompletedSeriesModal}
					title="Сброс выполнения"
					text="Вы действительно хотите отменить выполнение цели и сбросить весь прогресс серии?"
					textBtnCancel="Отмена"
					textBtn="Сбросить"
					themeBtn="red"
					handleBtn={onConfirmResetCompletedSeries}
				/>
			)}
			{/* Модалка подтверждения удаления прогресса цели */}
			<ModalConfirm
				isOpen={isDeleteProgressModalOpen}
				onClose={onCloseDeleteProgressModal}
				title="Удаление прогресса"
				text="Вы действительно хотите удалить весь прогресс цели? Вся история прогресса выполнения будет сброшена."
				textBtnCancel="Отмена"
				textBtn="Удалить"
				themeBtn="red"
				handleBtn={onConfirmDeleteProgress}
			/>
			{/* Отмена выполнения цели с прогрессом — прогресс удаляется вместе с отметкой */}
			{!isList && isAdded && (
				<ModalConfirm
					isOpen={isUncompleteWithProgressModalOpen}
					onClose={onCloseUncompleteWithProgressModal}
					title="Отменить выполнение?"
					text="Прогресс будет удалён. Вы точно хотите начать заново выполнение цели?"
					textBtnCancel="Отмена"
					textBtn="Отменить выполнение"
					themeBtn="red"
					handleBtn={onConfirmUncompleteWithProgress}
				/>
			)}
			{/* Модалка редактирования настроек регулярной цели */}
			{regularConfig &&
				isAdded &&
				!isList &&
				regularConfig.allowCustomSettings &&
				(() => {
					// Используем настройки из статистики (пользовательские), если они есть, иначе из regularConfig
					const stats = localStatistics || regularConfig.statistics;
					const settingsData = stats?.regularGoalData || regularConfig;

					return (
						<Modal
							isOpen={isEditSettingsModalOpen}
							onClose={onCloseEditSettingsModal}
							title="Изменение регулярности цели"
							size="medium"
						>
							<SetRegularGoalModal
								onSave={onSaveSettings}
								onCancel={onCloseEditSettingsModal}
								showResetWarning={!(localStatistics || regularConfig?.statistics)?.isSeriesCompleted}
								initialSettings={{
									frequency: settingsData.frequency,
									weeklyFrequency: settingsData.weeklyFrequency,
									customSchedule: settingsData.customSchedule,
									durationType: settingsData.durationType,
									durationValue: settingsData.durationValue,
									endDate: settingsData.endDate,
									resetOnSkip: settingsData.resetOnSkip,
									allowSkipDays: settingsData.allowSkipDays,
									daysForEarnedSkip: (settingsData as any).daysForEarnedSkip,
									markAsCompletedAfterSeries: false,
								}}
							/>
						</Modal>
					);
				})()}
			{/* Модалка подтверждения сброса серии при изменении настроек */}
			{regularConfig && isAdded && (
				<ModalConfirm
					isOpen={isConfirmResetSeriesModalOpen}
					onClose={onCloseConfirmResetSeriesModal}
					title="Завершение серии"
					text="Вы действительно хотите прервать текущую серию выполнения цели и начать новую с заданными параметрами?"
					textBtnCancel="Отмена"
					textBtn="Завершить"
					themeBtn="red"
					handleBtn={onConfirmResetSeries}
				/>
			)}
			{/* Модалка редактирования настроек при добавлении регулярной цели */}
			{regularConfig && !isAdded && !isList && regularConfig.allowCustomSettings && (
				<Modal isOpen={isAddRegularGoalModalOpen} onClose={onCloseAddRegularGoalModal} title="Задать регулярность цели">
					<SetRegularGoalModal
						onSave={onSaveAddSettings}
						onCancel={onCloseAddRegularGoalModal}
						initialSettings={{
							frequency: regularConfig.frequency,
							weeklyFrequency: regularConfig.weeklyFrequency,
							customSchedule: regularConfig.customSchedule,
							durationType: regularConfig.durationType,
							durationValue: regularConfig.durationValue,
							endDate: regularConfig.endDate,
							resetOnSkip: regularConfig.resetOnSkip,
							allowSkipDays: regularConfig.allowSkipDays,
							markAsCompletedAfterSeries: false,
						}}
					/>
				</Modal>
			)}
		</>
	);
};
