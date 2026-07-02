import {FC, useEffect, useState} from 'react';

import {Svg} from '@/components/Svg/Svg';
import {useBem} from '@/hooks/useBem';
import {getLaunchPromo, ILaunchPromo} from '@/utils/api/get/getLaunchPromo';
import {pluralize} from '@/utils/text/pluralize';

import './launch-promo-banner.scss';

export const LaunchPromoBanner: FC = () => {
	const [block, element] = useBem('launch-promo-banner');
	const [promo, setPromo] = useState<ILaunchPromo | null>(null);

	useEffect(() => {
		let cancelled = false;

		(async () => {
			const response = await getLaunchPromo();
			if (!cancelled && response.success && response.data?.active) {
				setPromo(response.data);
			}
		})();

		return () => {
			cancelled = true;
		};
	}, []);

	if (!promo?.active || promo.spotsRemaining <= 0) {
		return null;
	}

	const spotsWord = pluralize(promo.spotsRemaining, ['место', 'места', 'мест'], false).trim();

	return (
		<section className={block()}>
			<Svg icon="rocket" className={element('bg-icon')} width="120px" height="120px" />
			<div className={element('inner')}>
				<div className={element('main')}>
					<h2 className={element('title')}>Ура, мы запустились!</h2>
					<p className={element('text')}>
						Первым {promo.limit} пользователям — {promo.premiumDays} дней Premium в подарок при регистрации.
					</p>
				</div>
				<div className={element('spots')}>
					<span className={element('spots-label')}>Осталось</span>
					<span className={element('spots-number')}>{promo.spotsRemaining}</span>
					<span className={element('spots-label')}>{spotsWord}</span>
				</div>
			</div>
		</section>
	);
};
