import {FC, useState} from 'react';

import {Button} from '@/components/Button/Button';
import {useBem} from '@/hooks/useBem';
import {NotificationStore} from '@/store/NotificationStore';
import {postReportComment} from '@/utils/api/post/postReportComment';

import {FieldInput} from '../FieldInput/FieldInput';
import Select, {OptionSelect} from '../Select/Select';
import {Title} from '../Title/Title';
import './report-comment.scss';

const REASON_OPTIONS: OptionSelect[] = [
	{value: 'spam', name: 'Спам или реклама'},
	{value: 'offensive', name: 'Оскорбления или токсичное поведение'},
	{value: 'inappropriate', name: 'Неприемлемый контент'},
	{value: 'misleading', name: 'Ложная или вводящая в заблуждение информация'},
	{value: 'rules_violation', name: 'Нарушение правил сервиса'},
	{value: 'other', name: 'Другое'},
];

interface ReportCommentProps {
	commentId: number;
	closeModal: () => void;
}

export const ReportComment: FC<ReportCommentProps> = ({commentId, closeModal}) => {
	const [block, element] = useBem('report-comment');
	const [activeReason, setActiveReason] = useState<number>(0);
	const [text, setText] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async () => {
		if (isSubmitting) return;
		setIsSubmitting(true);

		const reason = REASON_OPTIONS[activeReason].value;
		const res = await postReportComment(commentId, reason, text);

		if (res.success) {
			NotificationStore.addNotification({
				type: 'success',
				title: 'Жалоба отправлена',
				message: 'Мы рассмотрим вашу жалобу в ближайшее время',
			});
			closeModal();
		} else {
			NotificationStore.addNotification({
				type: 'error',
				title: 'Ошибка',
				message: res.error || 'Не удалось отправить жалобу',
			});
		}

		setIsSubmitting(false);
	};

	return (
		<section className={block()}>
			<Title tag="h2" className={element('title')}>
				Пожаловаться
			</Title>
			<div className={element('wrapper')}>
				<Select
					placeholder="Укажите причину обращения"
					options={REASON_OPTIONS}
					activeOption={activeReason}
					onSelect={setActiveReason}
					text="Причина жалобы *"
				/>
				<FieldInput
					placeholder="Опишите подробнее причину жалобы"
					text="Комментарий"
					id="report-comment-text"
					value={text}
					setValue={setText}
					className={element('input')}
				/>
			</div>

			<div className={element('btns-wrapper')}>
				<Button theme="blue-light" className={element('btn')} onClick={closeModal}>
					Отмена
				</Button>
				<Button theme="blue" className={element('btn')} onClick={handleSubmit} disabled={isSubmitting}>
					{isSubmitting ? 'Отправка...' : 'Отправить'}
				</Button>
			</div>
		</section>
	);
};
