import {FC} from 'react';

import {useBem} from '@/shared/lib/hooks/useBem';
import {Svg} from '@/shared/ui/Svg/Svg';
import '@/shared/ui/Tag/tag.scss';

interface TagProps {
	icon?: string;
	className?: string;
	text?: string | number;
	title?: string;
	category?: string;
	theme?: 'light' | 'integrate' | 'blue' | 'green' | 'gold' | 'gray' | 'minimal' | 'red';
	classNameIcon?: string;
	style?: React.CSSProperties;
}

export const Tag: FC<TagProps> = (props) => {
	const {icon, className, text, title, category, theme, classNameIcon, style} = props;

	const [block, element] = useBem('tag', className);

	return (
		<span className={block({category, theme})} style={style} title={title}>
			{icon && <Svg className={classNameIcon} icon={icon} width="16px" height="16px" />}
			{text && <span className={element('text')}>{text}</span>}
		</span>
	);
};
