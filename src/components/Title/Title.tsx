import {FC, ReactNode} from 'react';
import {useBem} from '@/hooks/useBem';
import './title.scss';

interface TitleProps {
	className?: string;
	tag: 'h1' | 'h2' | 'h3' | 'h4';
	children: string | ReactNode;
	theme?: 'white' | 'black';
}

export const Title: FC<TitleProps> = (props) => {
	const {className, tag = 'h4', theme, children} = props;

	const [block] = useBem('title', className);

	const getTag = (): ReactNode => {
		switch (tag) {
			case 'h1':
				return <h1 className={block({tag, theme})}>{children}</h1>;
			case 'h2':
				return <h2 className={block({tag, theme})}>{children}</h2>;
			case 'h3':
				return <h3 className={block({tag, theme})}>{children}</h3>;
			case 'h4':
			default:
				return <h4 className={block({tag, theme})}>{children}</h4>;
		}
	};

	return getTag();
};
