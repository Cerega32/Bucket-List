import {FC} from 'react';

import {IComment} from '@/entities/comment/model/types';
import {CommentGoal} from '@/entities/comment/ui/CommentGoal/CommentGoal';
import {useBem} from '@/shared/lib/hooks/useBem';
import {Button} from '@/shared/ui/Button/Button';
import {Title} from '@/shared/ui/Title/Title';

import '@/entities/comment/ui/MyReview/my-review.scss';

interface MyReviewProps {
	className?: string;
	comment: IComment;
	onEdit?: (comment: IComment) => void;
	onDelete?: (comment: IComment) => void;
	onClickScore?: (id: number, like: boolean) => Promise<void>;
}

export const MyReview: FC<MyReviewProps> = (props) => {
	const {className, comment, onEdit, onDelete, onClickScore} = props;
	const [block, element] = useBem('my-review', className);

	return (
		<div className={block()}>
			<div className={element('header')}>
				<Title tag="h3" className={element('title')}>
					Мое впечатление
				</Title>
				<div className={element('actions')}>
					<Button theme="blue-edit" size="small" icon="edit" onClick={() => onEdit?.(comment)}>
						Редактировать
					</Button>
					<Button theme="red-delete" size="small" icon="trash" onClick={() => onDelete?.(comment)}>
						Удалить
					</Button>
				</div>
			</div>
			<CommentGoal comment={comment} onClickScore={onClickScore} />
		</div>
	);
};
