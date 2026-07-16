import {FC, useEffect, useState} from 'react';

import {Button} from '@/components/Button/Button';
import {FieldInput} from '@/components/FieldInput/FieldInput';
import {Modal} from '@/components/Modal/Modal';
import {useBem} from '@/hooks/useBem';
import {NotificationStore} from '@/store/NotificationStore';
import {IGoalProgressEntry, updateGoalProgressEntryNotes} from '@/utils/api/goals';

import './edit-progress-entry-notes-modal.scss';

interface EditProgressEntryNotesModalProps {
	isOpen: boolean;
	goalId: number;
	entry: IGoalProgressEntry | null;
	onClose: () => void;
	onSaved: (entry: IGoalProgressEntry) => void;
}

export const EditProgressEntryNotesModal: FC<EditProgressEntryNotesModalProps> = (props) => {
	const {isOpen, goalId, entry, onClose, onSaved} = props;
	const [block, element] = useBem('edit-progress-entry-notes-modal');
	const [notes, setNotes] = useState('');
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		if (isOpen && entry) {
			setNotes(entry.notes ?? '');
		}
	}, [isOpen, entry]);

	const handleSave = async () => {
		if (!entry) {
			return;
		}

		setIsLoading(true);
		try {
			const response = await updateGoalProgressEntryNotes(goalId, entry.id, notes);
			if (response.success && response.data) {
				NotificationStore.addNotification({
					type: 'success',
					title: 'Сохранено',
					message: 'Текст заметки обновлён',
				});
				onSaved(response.data);
				onClose();
			}
		} finally {
			setIsLoading(false);
		}
	};

	if (!entry) {
		return null;
	}

	return (
		<Modal isOpen={isOpen} onClose={onClose} className={block()} size="small" title="Редактировать заметку">
			<div className={element('content')}>
				<FieldInput
					id="edit-progress-entry-notes"
					text="Заметка изменения прогресса"
					value={notes}
					setValue={setNotes}
					placeholder="Опишите свои впечатления о выполнении"
					type="textarea"
					className={element('field')}
				/>
			</div>
			<div className={element('footer')}>
				<Button theme="blue-light" className={element('btn')} onClick={onClose} disabled={isLoading} type="button">
					Отмена
				</Button>
				<Button theme="blue" className={element('btn')} onClick={handleSave} disabled={isLoading} loading={isLoading} type="button">
					Сохранить
				</Button>
			</div>
		</Modal>
	);
};
