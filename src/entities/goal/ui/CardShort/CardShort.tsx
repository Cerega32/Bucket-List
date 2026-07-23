import {FC} from 'react';
import {Link} from 'react-router-dom';

import {IShortGoal, IShortList} from '@/entities/goal/model/types';
import {Tags} from '@/entities/goal/ui/Tags/Tags';
import {useBem} from '@/shared/lib/hooks/useBem';
import useScreenSize from '@/shared/lib/hooks/useScreenSize';
import {Tag} from '@/shared/ui/Tag/Tag';
import {Title} from '@/shared/ui/Title/Title';

import '@/entities/goal/ui/CardShort/card-short.scss';

type CardShortItem = IShortGoal | IShortList;

interface CardShortProps {
	className?: string;
	item: CardShortItem;
	variant: 'goal' | 'list';
	typeLabel?: string;
}

export const CardShort: FC<CardShortProps> = (props) => {
	const {className, item, variant, typeLabel} = props;

	const [block, element] = useBem('card-short', className);
	const isList = variant === 'list';
	const linkTo = isList ? `/list/${item.code}` : `/goals/${item.code}`;
	const added = item.totalAdded ?? (item as {total_added?: number}).total_added ?? 0;
	const {isScreenMobile} = useScreenSize();
	const estimatedTime = 'estimatedTime' in item ? item.estimatedTime : undefined;

	return (
		<section className={block()}>
			<Link to={linkTo} className={element('link')}>
				<img src={item.image} alt={item.title} className={element('img')} />
				<div className={element('info')}>
					<div className={element('title-row')}>
						<Title tag="h3" className={element('title')}>
							{item.title}
						</Title>
						{typeLabel && (
							<Tag
								text={!isScreenMobile ? typeLabel : undefined}
								icon={isList ? 'apps' : 'bullseye'}
								theme="minimal"
								className={element('type-tag')}
							/>
						)}
					</div>
					<div className={element('tags-wrapper')}>
						<Tags
							complexity={item.complexity}
							added={added}
							estimatedTime={estimatedTime}
							theme="integrate"
							className={element('tags')}
							showSeparator
						/>
					</div>
				</div>
			</Link>
		</section>
	);
};
