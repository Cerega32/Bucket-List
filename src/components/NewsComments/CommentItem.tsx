import {observer} from 'mobx-react-lite';
import {useState} from 'react';

import {useBem} from '@/hooks/useBem';
import {NewsComment} from '@/typings/news';

import {CommentForm} from './CommentForm';
import {ModalConfirm} from '../ModalConfirm/ModalConfirm';

interface CommentItemProps {
	comment: NewsComment;
	newsId: number;
	level?: number;
	onReply?: (parentId: number, content: string) => Promise<void>;
	onEdit?: (commentId: number, content: string) => Promise<void>;
	onDelete?: (commentId: number) => Promise<void>;
}

const formatDate = (dateString: string): string => {
	const date = new Date(dateString);
	return date.toLocaleDateString('ru-RU', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
};

export const CommentItem = observer(({comment, newsId, level = 0, onReply, onEdit, onDelete}: CommentItemProps) => {
	const [showReplyForm, setShowReplyForm] = useState(false);
	const [showEditForm, setShowEditForm] = useState(false);
	const [editContent, setEditContent] = useState(comment.content);
	const [isEditing, setIsEditing] = useState(false);
	const [isDeleteCommentOpen, setIsDeleteCommentOpen] = useState(false);
	const [isEditCommentOpen, setIsEditCommentOpen] = useState(false);
	const [block, element] = useBem('comment-item');

	const handleEdit = async () => {
		if (!editContent.trim() || isEditing) return;

		setIsEditing(true);
		try {
			await onEdit?.(comment.id, editContent.trim());
			setShowEditForm(false);
		} catch (error) {
			console.error('Ошибка редактирования:', error);
		} finally {
			setIsEditing(false);
		}
	};

	const handleDelete = async () => {
		try {
			await onDelete?.(comment.id);
		} catch (error) {
			console.error('Ошибка удаления:', error);
		}
	};

	const handleEditKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.ctrlKey && e.key === 'Enter') {
			e.preventDefault();
			if (editContent.trim() && !isEditing) {
				handleEdit();
			}
		}
	};

	const {canEdit} = comment;
	const {canDelete} = comment;
	const hasReplies = comment.replies && comment.replies.length > 0;

	return (
		<div className={block({level: level > 0 ? 'reply' : undefined})}>
			<div className={element('content')}>
				{/* Заголовок комментария */}
				<div className={element('header')}>
					<div className={element('author')}>
						{comment.author?.firstName} {comment.author?.lastName}
					</div>
					<div className={element('date')}>{formatDate(comment.createdAt)}</div>
				</div>

				{/* Форма редактирования */}
				{showEditForm ? (
					<div className={element('edit-form')}>
						<div className={element('edit-form-wrapper')}>
							<textarea
								value={editContent}
								onChange={(e) => setEditContent(e.target.value)}
								rows={3}
								disabled={isEditing}
								className={element('edit-textarea')}
								placeholder="Введите текст комментария..."
								onKeyDown={handleEditKeyDown}
							/>
							<div className={element('edit-actions')}>
								<button
									onClick={handleEdit}
									disabled={isEditing || !editContent.trim()}
									type="button"
									className={element('edit-save-button')}
								>
									{isEditing ? 'Сохранение...' : 'Сохранить'}
								</button>
								<button
									onClick={() => {
										setShowEditForm(false);
										setEditContent(comment.content);
									}}
									disabled={isEditing}
									type="button"
									className={element('edit-cancel-button')}
								>
									Отмена
								</button>
							</div>
						</div>
					</div>
				) : (
					<div className={element('text')}>{comment.content}</div>
				)}

				{/* Действия */}
				<div className={element('actions')}>
					{level < 3 && (
						<button onClick={() => setShowReplyForm(!showReplyForm)} className={element('action-button')} type="button">
							{showReplyForm ? 'Отмена' : 'Ответить'}
						</button>
					)}
					{canEdit && !showEditForm && (
						<button onClick={() => setShowEditForm(true)} className={element('action-button')} type="button">
							Редактировать
						</button>
					)}
					{canDelete && (
						<button onClick={handleDelete} className={element('action-button', {delete: true})} type="button">
							Удалить
						</button>
					)}
				</div>

				{/* Форма ответа */}
				{showReplyForm && (
					<div className={element('reply-form')}>
						<CommentForm
							newsId={newsId}
							parentId={comment.id}
							onCancel={() => setShowReplyForm(false)}
							onSuccess={() => setShowReplyForm(false)}
						/>
					</div>
				)}
			</div>

			{/* Ответы - теперь отображаются автоматически, так как загружаются рекурсивно */}
			{hasReplies && (
				<div className={element('replies')}>
					{comment.replies?.map((reply) => (
						<CommentItem
							key={reply.id}
							comment={reply}
							newsId={newsId}
							level={level + 1}
							onReply={onReply}
							onEdit={onEdit}
							onDelete={onDelete}
						/>
					))}
				</div>
			)}
			<ModalConfirm
				title="Удалить комментарий?"
				isOpen={isDeleteCommentOpen}
				onClose={() => setIsDeleteCommentOpen(false)}
				handleBtn={handleDelete}
				textBtn="Удалить комментарий"
				text="Вы уверены, что хотите удалить этот комментарий?"
				themeBtn="red"
			/>
			<ModalConfirm
				title="Редактировать комментарий?"
				isOpen={isEditCommentOpen}
				onClose={() => setIsEditCommentOpen(false)}
				handleBtn={handleEdit}
				textBtn="Редактировать комментарий"
				text="Вы уверены, что хотите изменить комментарий?"
				themeBtn="blue"
			/>
		</div>
	);
});
