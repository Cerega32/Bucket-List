import {FC} from 'react';

import {Svg} from '../Svg/Svg';

import {useBem} from '@/hooks/useBem';
import './avatar.scss';

interface AvatarProps {
	avatar: string | null | undefined;
	className?: string;
	size?: 'small' | 'medium' | 'large';
}

export const Avatar: FC<AvatarProps> = (props) => {
	const {className, avatar, size = 'small'} = props;

	const [block, element] = useBem('avatar', className);

	const getSize = (): string => {
		switch (size) {
			case 'medium':
				return '24px';
			case 'large':
				return '96px';
			default:
				return '16px';
		}
	};

	return (
		<div className={block({size})}>
			{avatar ? (
				<img className={element('image')} src={avatar || ''} alt="Аватар" />
			) : (
				<Svg icon="avatar" className={element('icon')} width={getSize()} height={getSize()} />
			)}
		</div>
	);
};
