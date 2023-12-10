import {FC} from 'react';
import {useBem} from '@/hooks/useBem';
import {TitleWithTags} from '../TitleWithTags/TitleWithTags';
import './content-list-goals.scss';
import {InfoGoal} from '../InfoGoal/InfoGoal';
import {IList} from '@/typings/list';
import {ListGoals} from '../ListGoals/ListGoals';
import {DescriptionWithLinks} from '../DescriptionWithLinks/DescriptionWithLinks';

interface ContentListGoalsProps {
	className?: string;
	list: IList;
	updateGoal: (
		code: string,
		i: number,
		operation: 'add' | 'delete' | 'mark',
		done?: boolean
	) => Promise<void>;
}

export const ContentListGoals: FC<ContentListGoalsProps> = (props) => {
	const {className, list, updateGoal} = props;

	const [block, element] = useBem('content-list-goals', className);

	return (
		<article className={block()}>
			<TitleWithTags
				title={list.title}
				category={list.category}
				complexity={list.complexity}
				className={element('title')}
				totalCompleted={list.totalCompleted}
				isList
				theme="light"
			/>
			<DescriptionWithLinks
				isList
				goal={list}
				className={element('description')}
			/>
			{list.addedByUser && (
				<InfoGoal
					className={element('info')}
					totalAdded={list.goalsCount}
					totalCompleted={list.userCompletedGoals}
					progress
					horizontal
				/>
			)}
			<ListGoals
				list={list.goals}
				updateGoal={updateGoal}
				columns="three"
			/>
		</article>
	);
};
