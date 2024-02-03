import {FC} from 'react';

import {Tags} from '../Tags/Tags';

import {useBem} from '@/hooks/useBem';
import {ICategory, ICategoryDetailed, IShortGoal, IShortList} from '@/typings/goal';

import './card-category.scss';
import {Title} from '../Title/Title';
import {Tag} from '../Tag/Tag';
import {Gradient} from '../Gradient/Gradient';
import {Line} from '../Line/Line';
import {Button} from '../Button/Button';
import {Svg} from '../Svg/Svg';
import {Progress} from '../Progress/Progress';

import {Link} from 'react-router-dom';

import {pluralize} from '@/utils/text/pluralize';

interface CardCategoryProps {
	className?: string;
	category: ICategoryDetailed;
}

export const CardCategory: FC<CardCategoryProps> = (props) => {
	const {className, category} = props;

	const [block, element] = useBem('card-category', className);

	return (
		<section className={block()}>
			<Link to={`/categories/${category.nameEn}`} className={element('gradient')}>
				<Gradient img={{src: category.image, alt: category.name}} category={category.nameEn}>
					<div className={element('description')}>
						<Title className={element('title')} theme="white" tag="h3">
							{category.name}
						</Title>
						<p className={element('goals')}>{pluralize(category.goalCount, ['цель', 'цели', 'целей'])}</p>
					</div>
				</Gradient>
			</Link>
		</section>
	);
};
