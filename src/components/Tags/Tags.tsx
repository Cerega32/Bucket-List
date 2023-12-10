import {FC} from 'react';
import {useBem} from '@/hooks/useBem';
import {Tag} from '../Tag/Tag';

import './tags.scss';
import {ICategory, IComplexity} from '@/typings/goal';
import {getComplexity} from '@/utils/values/complexity';
import {Line} from '../Line/Line';

interface TagsProps {
	className?: string;
	theme?: 'light' | 'integrate';
	category?: ICategory;
	complexity: IComplexity;
	done?: number;
	added?: number;
	medal?: string;
	time?: string;
	separator?: Array<string | boolean>;
}

export const Tags: FC<TagsProps> = (props) => {
	const {
		className,
		theme,
		category,
		complexity,
		done,
		added,
		medal,
		time,
		separator,
	} = props;

	const [block] = useBem('tags', className);

	return (
		<section className={block()}>
			{category && (
				<Tag
					category={category.nameEn}
					text={category.name}
					theme={theme}
				/>
			)}
			{separator?.some((el) => el === 'category') && <Line vertical />}
			{medal && <Tag text={medal} theme={theme} icon="medal" />}
			{separator?.some((el) => el === 'medal') && <Line vertical />}
			<Tag
				text={getComplexity[complexity]}
				theme={theme}
				icon="arrow-top"
			/>
			{separator?.some((el) => el === 'complexity') && <Line vertical />}
			{!!added && <Tag text={added} theme={theme} icon="people" />}
			{separator?.some((el) => el === 'added') && <Line vertical />}
			{!!done && <Tag text={done} theme={theme} icon="done" />}
			{separator?.some((el) => el === 'done') && <Line vertical />}
			{!!time && <Tag text={time} theme={theme} icon="watch" />}
		</section>
	);
};
