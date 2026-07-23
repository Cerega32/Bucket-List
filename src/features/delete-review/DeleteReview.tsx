import {FC} from 'react';

import {useBem} from '@/shared/lib/hooks/useBem';
import {IFuncModal} from '@/shared/model/ModalStore';
import {Button} from '@/shared/ui/Button/Button';
import {Title} from '@/shared/ui/Title/Title';
import '@/features/delete-review/delete-review.scss';

interface DeleteReviewProps {
	className?: string;
	closeModal: () => void;
	funcModal: IFuncModal;
}

export const DeleteReview: FC<DeleteReviewProps> = (props) => {
	const {className, closeModal, funcModal} = props;

	const [block, element] = useBem('delete-review', className);

	const handleDeleteReview = async () => {
		const res = funcModal();
		if (res) {
			closeModal();
		}
	};

	return (
		<section className={block()}>
			<Title tag="h2" className={element('title')}>
				Удаление впечатления
			</Title>
			<p className={element('text')}>Вы действительно хотите удалить своё впечатление?</p>
			<div className={element('btns-wrapper')}>
				<Button theme="blue-light" className={element('btn')} onClick={closeModal}>
					Отмена
				</Button>
				<Button theme="red" className={element('btn')} onClick={handleDeleteReview}>
					Удалить
				</Button>
			</div>
		</section>
	);
};
