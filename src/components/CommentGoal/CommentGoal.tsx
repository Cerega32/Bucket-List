import {FC} from 'react';
import {Link} from 'react-router-dom';

import {useBem} from '@/hooks/useBem';
import {ModalStore} from '@/store/ModalStore';
import {UserStore} from '@/store/UserStore';
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
	hideReport?: boolean;
}

export const CommentGoal: FC<CommentGoalProps> = (props) => {
	const {className, comment, isUser, onClickScore, isMain, hideReport} = props;
	const [block, element] = useBem('comment-goal', className);

	const photoSlides = comment.photos?.map((p) => ({src: p.image, id: p.id})) ?? [];
	const isOwnComment = UserStore.userSelf.id === comment.user;
	const isPending = Boolean(comment.hasPendingComplaint);
	/** Чужим блюрим контент; автор видит текст/фото как есть */
	const blurContent = isPending && !isOwnComment;

	const openReport = () => {
		ModalStore.setModalProps({commentId: comment.id});
		ModalStore.setWindow('report-comment');
		ModalStore.setIsOpen(true);
	};

	return (
		<article className={block({'is-main': isMain, pending: isPending})}>
			<div className={element('info')}>
				<Link
					to={
						isUser
							? comment.goalInfo?.isList
								? `/list/${comment.goalInfo.code}`
								: `/goals/${comment.goalInfo.code}`
							: `/user/${comment.user}/showcase`
					}
					className={element('user-info')}
				>
					{isUser ? (
						<img src={comment.goalInfo.image || ''} alt={comment.goalInfo.title} className={element('goal-img')} />
					) : (
						<Avatar avatar={comment.userAvatar} size="medium" />
					)}
					{isUser ? (
						<div className={element('user-wrapper', {goal: true})}>
							<div className={element('goal-info')}>
								<Title tag="h3">{comment.goalInfo.title}</Title>
								{comment.goalCategory && <Tag category={comment.goalCategory.nameEn} text={comment.goalCategory.name} />}
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
							<Title tag="h4">{comment.userNickname}</Title>
							<p className={element('user-level')}>
								{pluralize(comment.userTotalCompletedGoals, ['цель выполнена', 'цели выполнено', 'целей выполнено'])}
							</p>
						</div>
					)}
				</Link>
				{!isMain && (
					<div className={element('comment-info')}>
						{isPending && (
							<Tag
								text="На модерации"
								theme="gold"
								className={element('moderation-tag')}
								title={
									isOwnComment
										? 'Впечатление скрыто из публичных лент до решения модератора'
										: 'Контент временно скрыт до решения модератора'
								}
							/>
						)}
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
			{blurContent ? (
				<div className={element('moderation-content')}>
					<p className={element('text', {blurred: true})} aria-hidden="true">
						{comment.text}
					</p>
					<p className={element('moderation-note')}>На это впечатление поступила жалоба — информация временно скрыта</p>
				</div>
			) : (
				<p className={element('text')}>{comment.text}</p>
			)}
			{photoSlides.length > 0 && <CommentImagesGallery images={photoSlides} navSuffix={String(comment.id)} blurred={blurContent} />}
			{!isMain && (
				<div className={element('footer')}>
					{onClickScore && !blurContent && (
						<div className={element('score')}>
							<Button
								icon="like"
								small
								theme={comment.hasLiked ? 'green' : 'blue-light'}
								onClick={() => onClickScore(comment.id, true)}
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
					{!hideReport && !isOwnComment && !isPending && (
						<Button
							icon="exclamation-triangle"
							width="auto"
							theme="blue-light"
							onClick={openReport}
							className={element('report')}
						/>
					)}
				</div>
			)}
		</article>
	);
};
