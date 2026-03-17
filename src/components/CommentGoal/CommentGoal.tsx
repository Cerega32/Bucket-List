import {FC} from 'react';
import {Link} from 'react-router-dom';

import {useBem} from '@/hooks/useBem';
import {IComment} from '@/typings/comments';
import {getDate} from '@/utils/date/getDate';
import {pluralize} from '@/utils/text/pluralize';

import {Avatar} from '../Avatar/Avatar';
import {Button} from '../Button/Button';
import {CommentImagesGallery} from '../CommentImagesGallery/CommentImagesGallery';
import {Line} from '../Line/Line';
import {Tag} from '../Tag/Tag';
import {Tags} from '../Tags/Tags';
import {Title} from '../Title/Title';
import './comment-goal.scss';

interface CommentGoalProps {
	className?: string;
	comment: IComment;
	onClickScore?: (id: number, like: boolean) => Promise<void>;
	isUser?: boolean;
	isMain?: boolean;
}

export const CommentGoal: FC<CommentGoalProps> = (props) => {
	const {className, comment, isUser, onClickScore, isMain} = props;
	const [block, element] = useBem('comment-goal', className);

	const photoSlides = comment.photos?.map((p) => ({src: p.image, id: p.id})) ?? [];

	return (
		<article className={block()}>
			<div className={element('info')}>
				<Link to={isUser ? `/goals/${comment.goalInfo.code}` : `/user/${comment.user}/showcase`} className={element('user-info')}>
					{isUser ? (
						<img src={comment.goalInfo.image || ''} alt={comment.goalInfo.title} className={element('goal-img')} />
					) : (
						<Avatar avatar={comment.userAvatar} size="medium" />
					)}
					{isUser ? (
						<div className={element('user-wrapper', {goal: true})}>
							<div className={element('goal-info')}>
								<Title tag="h3">{comment.goalInfo.title}</Title>
								<Tag category={comment.goalCategory.nameEn} text={comment.goalCategory.name} />
							</div>
							<Tags
								complexity={comment.goalInfo.complexity}
								added={comment.goalInfo.totalAdded}
								estimatedTime={comment.goalInfo.estimatedTime}
								theme="integrate"
								className={element('tags')}
								showSeparator
							/>
						</div>
					) : (
						<div className={element('user-wrapper')}>
							<Title tag="h4">{comment.userName || comment.userNickname}</Title>
							<p className={element('user-level')}>
								{/* {comment.level} уровень&nbsp; */}
								{pluralize(comment.userTotalCompletedGoals, ['цель выполнена', 'цели выполнено', 'целей выполнено'])}
							</p>
						</div>
					)}
				</Link>
				{!isMain && (
					<div className={element('comment-info')}>
						{comment.isEdited && (
							<Tag
								text="Изменено"
								theme="light"
								className={element('edited-tag')}
								title={getDate(comment.dateEdited || comment.dateCreated)}
							/>
						)}
						<span className={element('date')}>{getDate(comment.dateEdited || comment.dateCreated)}</span>
						<Line className={element('vertical-line')} />
						<Tag complexity={comment.complexity} theme="integrate" icon={comment.complexity} />
					</div>
				)}
			</div>
			<Line className={element('horizontal-line')} />
			<p className={element('text')}>{comment.text}</p>
			{photoSlides.length > 0 && <CommentImagesGallery images={photoSlides} navSuffix={String(comment.id)} />}
			{!isMain && onClickScore && (
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
			)}
		</article>
	);
};
