import {FC} from 'react';

import {useBem} from '@/hooks/useBem';
import {ICategory, IComplexity, IGoalFolderTag} from '@/typings/goal';
import './title-with-tags.scss';

import {Tags} from '../Tags/Tags';
import {Title} from '../Title/Title';

interface TitleWithTagsProps {
	className?: string;
	title: string;
	theme?: 'light' | 'integrate';
	category: ICategory;
	complexity: IComplexity;
	totalCompleted: number;
	isList?: boolean;
	short?: boolean;
	categoryRank?: number;
	userFolders?: IGoalFolderTag[];
}

export const TitleWithTags: FC<TitleWithTagsProps> = (props) => {
	const {className, title, theme, category, complexity, totalCompleted, isList, short, categoryRank, userFolders} = props;

	const [block, element] = useBem('title-with-tags', className);

	return (
		<div className={block({theme})}>
			<Title className={element('title', {short})} tag="h1" theme={isList ? 'black' : 'white'}>
				{title}
			</Title>
			{!short && (
				<Tags
					category={category}
					medal={categoryRank ? `Топ ${categoryRank} в категории` : undefined}
					complexity={complexity}
					done={totalCompleted}
					theme={theme}
					userFolders={userFolders}
				/>
			)}
		</div>
	);
};
