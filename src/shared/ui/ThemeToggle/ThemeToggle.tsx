import {observer} from 'mobx-react-lite';
import {FC} from 'react';

import {useBem} from '@/shared/lib/hooks/useBem';
import {ThemeModeStore} from '@/shared/model/ThemeModeStore';
import {Svg} from '@/shared/ui/Svg/Svg';

import '@/shared/ui/ThemeToggle/theme-toggle.scss';

interface ThemeToggleProps {
	className?: string;
	theme?: 'white' | 'transparent';
}

export const ThemeToggle: FC<ThemeToggleProps> = observer((props) => {
	const {className, theme} = props;
	const {mode, toggle} = ThemeModeStore;
	const isDark = mode === 'dark';

	const [block, element] = useBem('theme-toggle', className);

	return (
		<button
			type="button"
			className={block({theme})}
			onClick={toggle}
			aria-label={isDark ? 'Включить светлую тему' : 'Включить тёмную тему'}
			aria-pressed={isDark}
		>
			<span className={element('icons')} aria-hidden="true">
				<span className={element('icon', {active: !isDark, moon: true})}>
					<Svg icon="moon" width="20px" height="20px" />
				</span>
				<span className={element('icon', {active: isDark, sun: true})}>
					<Svg icon="sun" width="20px" height="20px" />
				</span>
			</span>
		</button>
	);
});
