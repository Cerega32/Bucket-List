import {FC} from 'react';
import {useBem} from '@/hooks/useBem';
import {Svg} from '../Svg/Svg';
import './tag.scss';

interface TagProps {
	icon?: string;
	className?: string;
	text: string | number;
	category?: string;
	theme?: 'light' | 'integrate';
}

export const Tag: FC<TagProps> = (props) => {
	const {icon, className, text, category, theme} = props;

	const [block] = useBem('tag', className);

	return (
		<span className={block({category, theme})}>
			{icon && <Svg icon={icon} />}
			{text}
		</span>
	);
};
