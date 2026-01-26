import {FC} from 'react';
import {Link} from 'react-router-dom';

import {useBem} from '@/hooks/useBem';
import {ICategoryDetailed} from '@/typings/goal';
import {pluralize} from '@/utils/text/pluralize';

import {Gradient} from '../Gradient/Gradient';
import {Svg} from '../Svg/Svg';
import {Title} from '../Title/Title';
import './card-category.scss';

interface CardCategoryProps {
	className?: string;
	category: ICategoryDetailed;
	variant?: 'default' | 'minimal';
}

export const CardCategory: FC<CardCategoryProps> = (props) => {
	const {className, category, variant = 'default'} = props;

	const [block, element] = useBem('card-category', className);

	if (variant === 'minimal') {
		return (
			<section className={block({variant: 'minimal'})}>
				<Link to={`/categories/${category.nameEn}`} className={element('link')}>
					{category?.icon ? (
						<img src={category.icon} alt={category.name} className={element('icon-img')} />
					) : (
						<Svg icon={category?.icon || 'apps'} className={element('icon-svg')} />
					)}
					<div className={element('content')}>
						<Title className={element('title')} tag="h3">
							{category.name}
						</Title>
						<p className={element('goals')}>{pluralize(category.goalCount, ['цель', 'цели', 'целей'])}</p>
					</div>
				</Link>
			</section>
		);
	}

	return (
		<section className={block()}>
			<Link to={`/categories/${category.nameEn}`} className={element('gradient')}>
				<Gradient img={{src: category.image, alt: category.name}} category={category.nameEn} withoutBlack>
					<div className={element('description')}>
						<Title className={element('title')} theme="white" tag="h2">
							{category.name}
						</Title>
						<p className={element('goals')}>{pluralize(category.goalCount, ['цель', 'цели', 'целей'])}</p>
					</div>
				</Gradient>
			</Link>
		</section>
	);
};
