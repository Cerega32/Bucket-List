import {FC} from 'react';
import {useBem} from '@/hooks/useBem';
import {Tag} from '../Tag/Tag';

import './tags.scss';
import {ICategory, IComplexity} from '@/typings/goal';
import {getComplexity} from '@/utils/values/complexity';

interface TagsProps {
	className?: string;
	theme?: 'light';
	category: ICategory;
	complexity: IComplexity;
	done: number;
	medal?: string;
}

export const Tags: FC<TagsProps> = (props) => {
	const {className, theme, category, complexity, done, medal} = props;

	const [block] = useBem('tags', className);

	return (
		<section className={block()}>
			<Tag text={category.name} theme={theme} />
			{medal && <Tag text={medal} theme={theme} icon="medal" />}
			<Tag
				text={getComplexity[complexity]}
				theme={theme}
				icon="arrow-top"
			/>
			<Tag text={done} theme={theme} icon="done" />
		</section>
	);
};
