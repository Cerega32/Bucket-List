import {FC} from 'react';

import {useBem} from '@/hooks/useBem';
import {IComment} from '@/typings/comments';

import {Button} from '../Button/Button';
import {CommentGoal} from '../CommentGoal/CommentGoal';
import {Title} from '../Title/Title';

import './my-review.scss';

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
