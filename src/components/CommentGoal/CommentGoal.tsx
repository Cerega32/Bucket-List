import {FC} from 'react';

import './comment-goal.scss';
import {Avatar} from '../Avatar/Avatar';
import {Button} from '../Button/Button';

import {Tag} from '../Tag/Tag';

import {useBem} from '@/hooks/useBem';
import {IComment} from '@/typings/comments';
import {getDate} from '@/utils/date/getDate';
import {pluralize} from '@/utils/text/pluralize';

interface CommentGoalProps {
	className?: string;
	comment: IComment;
	onClickScore: (id: number, like: boolean) => Promise<void>;
	isUser?: boolean;
}

export const CommentGoal: FC<CommentGoalProps> = (props) => {
	const {className, comment, isUser, onClickScore} = props;

	const [block, element] = useBem('comment-goal', className);

	return (
		<article className={block()}>
			<div className={element('info')}>
				<div className={element('user-info')}>
					<Avatar avatar={comment.userAvatar} size="medium" />
					{isUser ? (
						<div className={element('user-wrapper')}>
							{/* <h4>{comment.goalName}</h4> */}
							<Tag category={comment.goalCategory.nameEn} text={comment.goalCategory.name} />
							<p className={element('user-level')}>
								{/* {comment.level} уровень&nbsp; */}
								{pluralize(comment.userTotalCompletedGoals, ['цель выполнена', 'цели выполнено', 'целей выполнено'])}
							</p>
						</div>
					) : (
						<div className={element('user-wrapper')}>
							<h4>{comment.userName}</h4>
							<p className={element('user-level')}>
								{/* {comment.level} уровень&nbsp; */}
								{pluralize(comment.userTotalCompletedGoals, ['цель выполнена', 'цели выполнено', 'целей выполнено'])}
							</p>
						</div>
					)}
				</div>
				<div className={element('comment-info')}>
					<span className={element('date')}>{getDate(comment.dateCreated)}</span>
					<div className={element('vertical-line')} />
					<Tag complexity={comment.complexity} theme="integrate" />
				</div>
			</div>
			<hr className={element('horizontal-line')} />
			<p className={element('text')}>{comment.text}</p>
			{comment.photos && !!comment.photos.length && (
				<div className={element('comment-images')}>
					{comment.photos.map((el) => (
						<img src={el.image} alt="Изображения комментария" className={element('comment-img')} />
					))}
				</div>
			)}
			<div className={element('score')}>
				<Button
					icon="like"
					small
					theme={comment.hasLiked ? 'green' : 'blue-light'}
					onClick={() => onClickScore(comment.id, true)}
					className={element('like')}
				>
					{comment.likesCount}
				</Button>
				<Button
					icon="like--bottom"
					small
					theme={comment.hasDisliked ? 'red' : 'blue-light'}
					onClick={() => onClickScore(comment.id, false)}
				>
					{comment.dislikesCount}
				</Button>
			</div>
		</article>
	);
};
