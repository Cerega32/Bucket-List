import {FC} from 'react';
import {Link, useSearchParams} from 'react-router-dom';

import {useBem} from '@/shared/lib/hooks/useBem';

import '@/shared/ui/Switch/switch.scss';

export interface ISwitch {
	url: string;
	name: string;
	page?: string;
	count?: number;
}

interface SwitchProps {
	className?: string;
	buttons: Array<ISwitch>;
	active: string;
	base?: string;
	preserveQuery?: boolean;
}

/** Собирает to для Link: query всегда до hash (`?page=2#all`), иначе hash ломается (`#all?page=2`). */
const buildSwitchTo = (path: string, searchString: string): string => {
	if (!searchString) {
		return path;
	}

	const hashIndex = path.indexOf('#');
	if (hashIndex !== -1) {
		const before = path.slice(0, hashIndex);
		const hash = path.slice(hashIndex);
		const sep = before.includes('?') ? '&' : '?';
		return `${before}${sep}${searchString}${hash}`;
	}

	return path.includes('?') ? `${path}&${searchString}` : `${path}?${searchString}`;
};

export const Switch: FC<SwitchProps> = (props) => {
	const {className, buttons, active, base = '', preserveQuery = true} = props;
	const [searchParams] = useSearchParams();

	const [block, element] = useBem('switch', className);

	// Сохраняем текущие query-параметры (например search) при переключении вкладок одного домена
	const searchString = preserveQuery ? searchParams.toString() : '';

	return (
		<section className={block()}>
			{buttons.map((tab) => (
				<Link
					key={tab.url}
					to={buildSwitchTo(`${base}${tab.url}`, searchString)}
					className={element('link', {active: active === tab.page})}
				>
					{tab.name}
					{!!tab.count && <span className={element('count')}>{tab.count}</span>}
				</Link>
			))}
		</section>
	);
};
