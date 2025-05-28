import {observer} from 'mobx-react-lite';
import React, {useState} from 'react';

import {useBem} from '@/hooks/useBem';
import {newsStore} from '@/store/NewsStore';

interface CommentFormProps {
	newsId: number;
	parentId?: number;
	onCancel?: () => void;
	onSuccess?: () => void;
}

export const CommentForm = observer(({newsId, parentId, onCancel, onSuccess}: CommentFormProps) => {
	const [content, setContent] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [block, element] = useBem('comment-form');

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!content.trim() || isSubmitting) {
			return;
		}

		setIsSubmitting(true);

		try {
			await newsStore.addComment(newsId, {
				content: content.trim(),
				parent: parentId,
			});

			setContent('');
			onSuccess?.();

			if (parentId && onCancel) {
				onCancel();
			}
		} catch (error) {
			console.error('Ошибка добавления комментария:', error);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleCancel = () => {
		setContent('');
		onCancel?.();
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.ctrlKey && e.key === 'Enter') {
			e.preventDefault();
			if (content.trim() && !isSubmitting) {
				handleSubmit(e as any);
			}
		}
	};

	return (
		<form onSubmit={handleSubmit} className={block()}>
			<div className={element('field')}>
				<textarea
					value={content}
					onChange={(e) => setContent(e.target.value)}
					onKeyDown={handleKeyDown}
					placeholder={parentId ? 'Написать ответ...' : 'Написать комментарий...'}
					rows={4}
					className={element('textarea')}
					disabled={isSubmitting}
				/>
			</div>

			<div className={element('actions')}>
				<button type="submit" disabled={!content.trim() || isSubmitting} className={element('submit-button')}>
					{isSubmitting ? 'Отправка...' : parentId ? 'Ответить' : 'Комментировать'}
				</button>
				{onCancel && (
					<button type="button" onClick={handleCancel} disabled={isSubmitting} className={element('cancel-button')}>
						Отмена
					</button>
				)}
			</div>
			<div className={element('hint')}>
				<small>Ctrl+Enter для быстрой отправки</small>
			</div>
		</form>
	);
});
