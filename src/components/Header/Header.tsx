import Cookies from 'js-cookie';
import {observer} from 'mobx-react';
import {FC} from 'react';
import {Link} from 'react-router-dom';
import {ReactSVG} from 'react-svg';

import {ThemeStore} from '../../store/ThemeStore';

import {Avatar} from '../Avatar/Avatar';

import {Svg} from '../Svg/Svg';

import {Button} from '@/components/Button/Button';
import {useBem} from '@/hooks/useBem';
import {ModalStore} from '@/store/ModalStore';
import {UserStore} from '@/store/UserStore';

import './header.scss';

interface HeaderProps {
	className?: string;
}

export const Header: FC<HeaderProps> = observer((props) => {
	const {className} = props;

	const {header, page} = ThemeStore;
	const {setIsOpen, setWindow, isOpen} = ModalStore;
	const {isAuth, name} = UserStore;

	const [block, element] = useBem('header', className);

	const openLogin = () => {
		setIsOpen(true);
		setWindow('login');
	};

	const openRegistration = () => {
		setIsOpen(true);
		setWindow('registration');
	};

	return (
		<header className={block({theme: header})}>
			<div className={element('wrapper')}>
				<Link className={element('logo')} to="/" aria-label="Главная">
					<Svg icon="delting" />
				</Link>
				<nav className={element('nav')}>
					<ul className={element('list')}>
						<li className={element('item')}>
							<Link className={element('item-link')} to="/">
								Моя доска
							</Link>
						</li>
						<li className={element('item')}>
							<Link className={element('item-link', {active: page === 'isMainGoals'})} to="/goals/100-goals">
								100 целей
							</Link>
						</li>
						<li className={element('item')}>
							<Link className={element('item-link', {active: page === 'isCategories'})} to="/categories">
								Категории
							</Link>
						</li>
						<li className={element('item')}>
							<Link className={element('item-link')} to="/">
								Цели и списки
							</Link>
						</li>
						<li className={element('item')}>
							<Link className={element('item-link')} to="/">
								Лидеры
							</Link>
						</li>
					</ul>
				</nav>
				{isAuth ? (
					<Link className={element('profile')} to="/user/self">
						<Avatar avatar={Cookies.get('avatar')} size="small" />
						<span className={element('nickname')}>{name}</span>
					</Link>
				) : (
					<div className={element('profile')}>
						<Button className={element('sign-in')} theme="blue-light" size="small" onClick={openLogin}>
							Войти
						</Button>
						<Button className={element('registration')} theme="blue" size="small" icon="rocket" onClick={openRegistration}>
							Регистрация
						</Button>
					</div>
				)}
			</div>
		</header>
	);
});
