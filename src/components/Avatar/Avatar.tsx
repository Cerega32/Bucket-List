import {FC} from 'react';

import {useBem} from '@/hooks/useBem';

import {Svg} from '../Svg/Svg';

import './avatar.scss';

interface AvatarProps {
	avatar: string | null | undefined;
	className?: string;
	size?: 'small' | 'medium' | 'medium-56' | 'large' | 'large-96';
	noBorder?: boolean;
	isPremium?: boolean;
}

export const Avatar: FC<AvatarProps> = (props) => {
	// TODO: isPremium - УДАЛИТЬ true после реализации backend
	const {className, avatar, size = 'small', noBorder = false, isPremium} = props;

	const [block, element] = useBem('avatar', className);

	const getSize = (): string => {
		switch (size) {
			case 'medium':
				return '24px';
			case 'medium-56':
				return '32px';
			case 'large-96':
				return '48px';
			case 'large':
				return '96px';
			default:
				return '16px';
		}
	};

	return (
		<div className={block({size, noBorder, premium: isPremium})}>
			<div className={element('inner')}>
				{avatar && avatar !== 'undefined' ? (
					<img className={element('image')} src={avatar || ''} alt="Аватар" />
				) : (
					<Svg icon="avatar" className={element('icon')} width={getSize()} height={getSize()} />
				)}
			</div>
			{isPremium && (
				<div className={element('premium-badge')}>
					<Svg icon="star-full" className={element('premium-icon')} width="16px" height="16px" />
				</div>
			)}
		</div>
	);
};
