import {FC} from 'react';

import {Svg} from '@/components/Svg/Svg';
import {Title} from '@/components/Title/Title';
import {useBem} from '@/hooks/useBem';
import useScreenSize from '@/hooks/useScreenSize';

import './subscription-plan-card.scss';

interface SubscriptionPlanCardProps {
	type: 'free' | 'premium';
	title: string;
	subtitle: string;
	features: string[];
	isCurrent?: boolean;
	isRecommended?: boolean;
}

export const SubscriptionPlanCard: FC<SubscriptionPlanCardProps> = ({type, title, subtitle, features, isCurrent, isRecommended}) => {
	const [block, element] = useBem('subscription-plan-card');
	const {isScreenSmallMobile} = useScreenSize();

	return (
		<div className={block({type, current: isCurrent})}>
			{isCurrent && (
				<div className={element('badge', {current: true})}>
					<Svg icon="done" className={element('badge-icon')} />
					{isScreenSmallMobile ? '' : 'Текущий тариф'}
				</div>
			)}

			{!isCurrent && isRecommended && (
				<div className={element('badge', {recommended: true})}>
					<Svg icon="star" className={element('badge-icon')} />
					{isScreenSmallMobile ? '' : 'Рекомендуем'}
				</div>
			)}

			<div className={element('header')}>
				<div className={element('icon-wrapper', {premium: type === 'premium'})}>
					<Svg icon={type === 'premium' ? 'award' : 'rocket'} className={element('icon')} />
				</div>
				<Title tag="h3" className={element('title')}>
					{title}
				</Title>
				<p className={element('subtitle')}>{subtitle}</p>
			</div>

			<div className={element('features')}>
				{features.map((feature, index) => (
					<div key={index} className={element('feature')}>
						<Svg icon="done" className={element('feature-icon')} />
						<span>{feature}</span>
					</div>
				))}
			</div>
		</div>
	);
};
