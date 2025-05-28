import {observer} from 'mobx-react-lite';
import {useState} from 'react';

import {useBem} from '@/hooks/useBem';
import {newsStore} from '@/store/NewsStore';

import {CommentForm} from './CommentForm';
import {CommentItem} from './CommentItem';

import './NewsComments.scss';

interface NewsCommentsProps {
	newsId: number;
}

export const NewsComments = observer(({newsId}: NewsCommentsProps) => {
	const [showForm, setShowForm] = useState(false);
	const [block, element] = useBem('news-comments');

	const handleAddComment = async () => {
		setShowForm(false);
	};

	const handleReply = async (parentId: number, content: string) => {
		try {
			await newsStore.addComment(newsId, {
				content,
				parent: parentId,
			});
		} catch (error) {
			console.error('Ошибка добавления ответа:', error);
			throw error;
		}
	};

	const handleEdit = async (commentId: number, content: string) => {
		try {
			await newsStore.updateComment(newsId, commentId, content);
		} catch (error) {
			console.error('Ошибка редактирования комментария:', error);
			throw error;
		}
	};

	const handleDelete = async (commentId: number) => {
		try {
			await newsStore.deleteComment(newsId, commentId);
		} catch (error) {
			console.error('Ошибка удаления комментария:', error);
			throw error;
		}
	};

	return (
		<section className={block()}>
			<div className={element('header')}>
				<h2 className={element('title')}>Комментарии ({newsStore.totalComments})</h2>
				<button onClick={() => setShowForm(!showForm)} className={element('add-button')} type="button">
					{showForm ? 'Отмена' : 'Добавить комментарий'}
				</button>
			</div>

			{/* Форма добавления комментария */}
			{showForm && (
				<div className={element('form-container')}>
					<CommentForm newsId={newsId} onCancel={() => setShowForm(false)} onSuccess={handleAddComment} />
				</div>
			)}

			{/* Список комментариев */}
			<div className={element('list')}>
				{newsStore.commentsLoading && newsStore.comments.length === 0 ? (
					<div className={element('loading')}>Загрузка комментариев...</div>
				) : newsStore.comments.length === 0 ? (
					<div className={element('empty')}>Комментариев пока нет. Будьте первым!</div>
				) : (
					<>
						{newsStore.comments.map((comment) => (
							<CommentItem
								key={comment.id}
								comment={comment}
								newsId={newsId}
								onReply={handleReply}
								onEdit={handleEdit}
								onDelete={handleDelete}
							/>
						))}

						{/* Кнопка загрузки дополнительных комментариев */}
						{newsStore.hasMoreComments && (
							<div className={element('load-more')}>
								<button
									onClick={() => newsStore.loadMoreComments(newsId)}
									disabled={newsStore.commentsLoading}
									className={element('load-more-button')}
									type="button"
								>
									{newsStore.commentsLoading ? 'Загрузка...' : 'Загрузить еще'}
								</button>
							</div>
						)}
					</>
				)}
			</div>

			{/* Ошибка загрузки */}
			{newsStore.commentsError && (
				<div className={element('error')}>
					<p>Ошибка: {newsStore.commentsError}</p>
					<button onClick={() => newsStore.loadComments(newsId, 1)} className={element('retry-button')} type="button">
						Попробовать снова
					</button>
				</div>
			)}
		</section>
	);
});
