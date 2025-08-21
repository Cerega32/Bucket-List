import {FC, useState} from 'react';
import {Link} from 'react-router-dom';
import Lightbox from 'yet-another-react-lightbox';

import {useBem} from '@/hooks/useBem';
import {IComment} from '@/typings/comments';
import {getDate} from '@/utils/date/getDate';
import {pluralize} from '@/utils/text/pluralize';

import {Avatar} from '../Avatar/Avatar';
import {Button} from '../Button/Button';
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

	// Состояния для лайтбокса
	const [isOpen, setIsOpen] = useState(false);
	const [photoIndex, setPhotoIndex] = useState(0);

	// Получаем массив URL изображений в формате, необходимом для библиотеки
	const slides = comment.photos ? comment.photos.map((photo) => ({src: photo.image})) : [];

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
							<Title tag="h4">{comment.userName}</Title>
							<p className={element('user-level')}>
								{/* {comment.level} уровень&nbsp; */}
								{pluralize(comment.userTotalCompletedGoals, ['цель выполнена', 'цели выполнено', 'целей выполнено'])}
							</p>
						</div>
					)}
				</Link>
				{!isMain && (
					<div className={element('comment-info')}>
						<span className={element('date')}>{getDate(comment.dateCreated)}</span>
						<div className={element('vertical-line')} />
						<Tag complexity={comment.complexity} theme="integrate" icon={comment.complexity} />
					</div>
				)}
			</div>
			<hr className={element('horizontal-line')} />
			<p className={element('text')}>{comment.text}</p>
			{comment.photos && !!comment.photos.length && (
				<div className={element('comment-images')}>
					{comment.photos.map((el, index) => (
						<img
							key={el.id}
							src={el.image}
							alt="Изображение комментария"
							className={element('comment-img')}
							// eslint-disable-next-line jsx-a11y/no-noninteractive-element-to-interactive-role
							role="button"
							tabIndex={0}
							onClick={() => {
								setPhotoIndex(index);
								setIsOpen(true);
							}}
							onKeyDown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									setPhotoIndex(index);
									setIsOpen(true);
								}
							}}
						/>
					))}
				</div>
			)}
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
			{/* Лайтбокс для просмотра изображений */}
			<Lightbox
				open={isOpen}
				close={() => setIsOpen(false)}
				slides={slides}
				index={photoIndex}
				carousel={{finite: true, padding: '16px'}}
				controller={{closeOnBackdropClick: true}}
				animation={{fade: 300}}
				styles={{container: {backgroundColor: 'rgba(0, 0, 0, .8)'}}}
			/>
		</article>
	);
};
