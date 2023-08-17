import {FC} from 'react';
import {useBem} from '@/hooks/useBem';
import {ListGoals} from '../ListGoals/ListGoals';
import {TitleWithTags} from '../TitleWithTags/TitleWithTags';
import './content-list-goals.scss';
import {InfoGoal} from '../InfoGoal/InfoGoal';
import {IList} from '@/typings/list';

interface ContentListGoalsProps {
	className?: string;
	list: IList;
}

export const ContentListGoals: FC<ContentListGoalsProps> = (props) => {
	const {className, list} = props;

	const [block, element] = useBem('content-list-goals', className);

	return (
		<article className={block()}>
			<TitleWithTags
				theme="light"
				title={list.title}
				category={list.category}
				complexity={list.complexity}
				className={element('section')}
				totalCompleted={list.completedUsersCount}
			/>
			<InfoGoal
				className={element('info')}
				complexity={list.complexity}
				totalCompleted={list.completedUsersCount}
				totalAdded={list.addedUsersCount}
			/>
			<section className={element('section')}>
				<h2 className={element('title-section')}>
					Цели списка&nbsp;
					<span className={element('title-counter')}>
						{list.goals.length}
					</span>
				</h2>
				<section className={element('list-goals')}>
					{list.goals.map((goal) => (
						<ListGoals
							goal={goal}
							className={element('item-list-goals')}
							vertical
						/>
					))}
				</section>
			</section>
		</article>
	);
};
