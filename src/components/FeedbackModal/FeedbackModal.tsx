import {FC, FormEvent, useState} from 'react';

import {Button} from '@/components/Button/Button';
import {Modal} from '@/components/Modal/Modal';
import {Svg} from '@/components/Svg/Svg';
import {Title} from '@/components/Title/Title';
import {useBem} from '@/hooks/useBem';
import {NotificationStore} from '@/store/NotificationStore';
import {postFeedback} from '@/utils/api/post/postFeedback';
import './feedback-modal.scss';

interface FeedbackModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export const FeedbackModal: FC<FeedbackModalProps> = ({isOpen, onClose}) => {
	const [block, element] = useBem('feedback-modal');
	const [rating, setRating] = useState<number>(0);
	const [hoverRating, setHoverRating] = useState<number | null>(null);
	const [message, setMessage] = useState<string>('');

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();

		if (!rating && !message.trim()) {
			NotificationStore.addNotification({
				type: 'error',
				title: 'Заполните отзыв',
				message: 'Поставьте оценку или напишите текст отзыва.',
			});
			return;
		}

		const res = await postFeedback({rating, message});

		if (res.success) {
			NotificationStore.addNotification({
				type: 'success',
				title: 'Спасибо за отзыв',
				message: 'Ваш отзыв отправлен команде Delting.',
			});
			onClose();
			setRating(0);
			setHoverRating(null);
			setMessage('');
		}
	};

	const currentRating = hoverRating ?? rating;

	return (
		<Modal isOpen={isOpen} onClose={onClose} className={block()} size="small">
			<form className={element('form')} onSubmit={handleSubmit}>
				<div className={element('header')}>
					<Title tag="h2" className={element('title')}>
						Оставить отзыв
					</Title>
					<p className={element('subtitle')}>Нам важно ваше мнение, чтобы сделать Delting лучше.</p>
				</div>

				<div className={element('rating')}>
					<span className={element('rating-label')}>Ваша оценка:</span>
					<div className={element('stars')}>
						{[1, 2, 3, 4, 5].map((value) => {
							const isActive = value <= currentRating;
							return (
								<button
									key={value}
									type="button"
									className={element('star', {active: isActive})}
									onMouseEnter={() => setHoverRating(value)}
									onMouseLeave={() => setHoverRating(null)}
									onClick={() => setRating((prev) => (prev === value ? 0 : value))}
									aria-label={`Оценка ${value}`}
								>
									<Svg icon={isActive ? 'star-full' : 'star'} />
								</button>
							);
						})}
					</div>
				</div>

				<label className={element('field')}>
					<span className={element('field-label')}>Текст отзыва</span>
					<textarea
						className={element('textarea')}
						placeholder="Напишите, что вам нравится в Delting и что можно улучшить..."
						value={message}
						onChange={(e) => setMessage(e.target.value)}
						rows={5}
					/>
				</label>

				<div className={element('footer')}>
					<Button theme="blue-light" className={element('btn')} typeBtn="button" onClick={onClose}>
						Отмена
					</Button>
					<Button theme="blue" className={element('btn')} typeBtn="submit">
						Отправить отзыв
					</Button>
				</div>
			</form>
		</Modal>
	);
};
