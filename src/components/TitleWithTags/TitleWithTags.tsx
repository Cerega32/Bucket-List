import {FC} from 'react';
import {useBem} from '@/hooks/useBem';
import './title-with-tags.scss';
import {Tags} from '../Tags/Tags';
import {ICategory, IComplexity} from '@/typings/goal';

interface TitleWithTagsProps {
	className?: string;
	title: string;
	theme?: 'light';
	category: ICategory;
	complexity: IComplexity;
	totalCompleted: number;
}

export const TitleWithTags: FC<TitleWithTagsProps> = (props) => {
	const {className, title, theme, category, complexity, totalCompleted} =
		props;

	const [block, element] = useBem('title-with-tags', className);

	return (
		<div className={block({theme})}>
			<h1 className={element('title')}>{title}</h1>
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
