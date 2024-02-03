import {FC} from 'react';

import {Svg} from '../Svg/Svg';

import {useBem} from '@/hooks/useBem';
import './tag.scss';
import {IComplexity} from '@/typings/goal';
import {getComplexity} from '@/utils/values/complexity';

interface TagProps {
	icon?: string;
	className?: string;
	text?: string | number;
	category?: string;
	theme?: 'light' | 'integrate';
	classNameIcon?: string;
	complexity?: IComplexity;
}

export const Tag: FC<TagProps> = (props) => {
	const {icon, className, text, category, theme, classNameIcon, complexity} = props;

	const [block] = useBem('tag', className);

	return (
		<span className={block({category, theme})}>
			{icon && <Svg className={classNameIcon} icon={icon} />}
			{text && text}
			{complexity && getComplexity[complexity]}
		</span>
	);
};
