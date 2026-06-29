import {FC} from 'react';

import {useBem} from '@/hooks/useBem';
import useScreenSize from '@/hooks/useScreenSize';
import {IList} from '@/typings/list';
import './content-list-goals.scss';

import {DescriptionWithLinks} from '../DescriptionWithLinks/DescriptionWithLinks';
import {InfoGoal} from '../InfoGoal/InfoGoal';
import {ListGoals} from '../ListGoals/ListGoals';
import {ListGoalsFilters} from '../ListGoalsFilters/ListGoalsFilters';
import {TitleWithTags} from '../TitleWithTags/TitleWithTags';

interface ContentListGoalsProps {
	className?: string;
	list: IList;
	search: string;
	onSearchChange: (query: string) => void;
	updateGoal: (code: string, i: number, operation: 'add' | 'delete' | 'mark', done?: boolean) => Promise<void | boolean>;
}

export const ContentListGoals: FC<ContentListGoalsProps> = (props) => {
	const {className, list, search, onSearchChange, updateGoal} = props;

	const {isScreenTablet, isScreenDesktop, isScreenSmallTablet} = useScreenSize();
	const [block, element] = useBem('content-list-goals', className);

	const filteredGoalsCount = list.goalsPagination?.totalGoals ?? list.goals.length;

	return (
		<article className={block()}>
			{(isScreenDesktop || (isScreenTablet && !isScreenSmallTablet)) && (
				<TitleWithTags
					title={list.title}
					category={list.category}
					complexity={list.complexity}
					className={element('title')}
					totalCompleted={list.totalCompleted}
					isList
					theme="light"
					listTotal={list.goalsCount}
				/>
			)}
			<DescriptionWithLinks isList goal={list} className={element('description')} />
			{list.addedByUser && (
				<InfoGoal
					className={element('info')}
					items={[]}
					progress
					horizontal
					progressData={{
						completed: list.userCompletedGoals,
						total: list.goalsCount,
					}}
				/>
			)}

			<ListGoalsFilters
				className={element('filters')}
				search={search}
				onSearchChange={onSearchChange}
				totalCount={filteredGoalsCount}
			/>
			<ListGoals list={list.goals} updateGoal={updateGoal} columns="three" searchQuery={search} />
		</article>
	);
};
