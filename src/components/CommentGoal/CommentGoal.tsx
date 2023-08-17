import {FC} from 'react';
import {useBem} from '@/hooks/useBem';
import './comment-goal.scss';
import {pluralize} from '@/utils/text/pluralize';
import {Button} from '../Button/Button';
import {Tag} from '../Tag/Tag';

interface IUser {
	avatar: string;
	name: string;
	level: number;
	countGoals: number;
}

interface IComment {
	text: string;
	images: Array<string>;
	likes: number;
	dislikes: number;
	date: string;
	complexity: string;
}

interface CommentGoalProps {
	className?: string;
	user: IUser;
	comment: IComment;
}

export const CommentGoal: FC<CommentGoalProps> = (props) => {
	const {className, user, comment} = props;

	const [block, element] = useBem('comment-goal', className);

	return (
		<article className={block()}>
			<div className={element('info')}>
				<div className={element('user-info')}>
					<img
						src={user.avatar}
						alt={user.name}
						className={element('user-img')}
					/>
					<div className={element('user-wrapper')}>
						<h4>{user.name}</h4>
						<p className={element('user-level')}>
							{user.level} уровень&nbsp;
							{pluralize(user.countGoals, [
								'цель выполнена',
								'цели выполнено',
								'целей выполнено',
							])}
						</p>
					</div>
				</div>
				<div className={element('comment-info')}>
					<span className={element('date')}>{comment.date}</span>
					<div className={element('vertical-line')} />
					<Tag text="hard" theme="integrate" icon="arrow-top" />
				</div>
			</div>
			<hr className={element('horizontal-line')} />
			<p className={element('text')}>{comment.text}</p>
			{!!comment.images.length && (
				<div className={element('comment-images')}>
					{comment.images.map((el) => (
						<img
							src={el}
							alt="Изображения комментария"
							className={element('comment-img')}
						/>
					))}
				</div>
			)}
			<div className={element('score')}>
				<Button icon="like" small theme="blue-light" onClick={() => {}}>
					{comment.likes}
				</Button>
				<Button
					icon="like--bottom"
					small
					theme="blue-light"
					onClick={() => {}}
				>
					{comment.dislikes}
				</Button>
			</div>
		</article>
	);
};
