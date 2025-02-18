import {FC} from 'react';

import {useBem} from '@/hooks/useBem';

import {Svg} from '../Svg/Svg';

import './avatar.scss';

interface AvatarProps {
	avatar: string | null | undefined;
	className?: string;
	size?: 'small' | 'medium' | 'medium-56' | 'large' | 'large-96';
	noBorder?: boolean;
}

export const Avatar: FC<AvatarProps> = (props) => {
	const {className, avatar, size = 'small', noBorder = false} = props;

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
		<div className={block({size, noBorder})}>
			{avatar ? (
				<img className={element('image')} src={avatar || ''} alt="Аватар" />
			) : (
				<Svg icon="avatar" className={element('icon')} width={getSize()} height={getSize()} />
			)}
		</div>
	);
};
