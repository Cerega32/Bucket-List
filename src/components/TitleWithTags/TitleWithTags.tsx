import {FC} from 'react';
import {useBem} from '@/hooks/useBem';
import './title-with-tags.scss';
import {Tags} from '../Tags/Tags';
import {ICategory, IComplexity} from '@/typings/goal';
import {Title} from '../Title/Title';

interface TitleWithTagsProps {
	className?: string;
	title: string;
	theme?: 'light' | 'integrate';
	category: ICategory;
	complexity: IComplexity;
	totalCompleted: number;
	isList: boolean;
}

export const TitleWithTags: FC<TitleWithTagsProps> = (props) => {
	const {
		className,
		title,
		theme,
		category,
		complexity,
		totalCompleted,
		isList,
	} = props;

	const [block, element] = useBem('title-with-tags', className);

	return (
		<div className={block({theme})}>
			<Title
				className={element('title')}
				tag="h1"
				theme={isList ? 'black' : 'white'}
			>
				{title}
			</Title>
			<Tags
				category={category}
				medal="Топ 1 в категории"
				complexity={complexity}
				done={totalCompleted}
				theme={theme}
			/>
		</div>
	);
};
