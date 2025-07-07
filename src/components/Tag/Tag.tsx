import {FC} from 'react';

import {useBem} from '@/hooks/useBem';
import {IComplexity} from '@/typings/goal';
import {getComplexity} from '@/utils/values/complexity';

import {Svg} from '../Svg/Svg';
import './tag.scss';

interface TagProps {
	icon?: string;
	className?: string;
	text?: string | number;
	category?: string;
	theme?: 'light' | 'integrate';
	classNameIcon?: string;
	complexity?: IComplexity;
	style?: React.CSSProperties;
}

export const Tag: FC<TagProps> = (props) => {
	const {icon, className, text, category, theme, classNameIcon, complexity, style} = props;

	const [block] = useBem('tag', className);

	return (
		<span className={block({category, theme})} style={style}>
			{icon && <Svg className={classNameIcon} icon={icon} />}
			{text && text}
			{complexity && getComplexity[complexity]}
		</span>
	);
};
