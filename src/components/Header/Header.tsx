import Cookies from 'js-cookie';
import {observer} from 'mobx-react-lite';
import {FC, useEffect} from 'react';
import {Link, useNavigate} from 'react-router-dom';

import {Button} from '@/components/Button/Button';
import {useBem} from '@/hooks/useBem';
import {ModalStore} from '@/store/ModalStore';
import {UserStore} from '@/store/UserStore';
import {getUser} from '@/utils/api/get/getUser';

import {ThemeStore} from '../../store/ThemeStore';
import {Avatar} from '../Avatar/Avatar';
import {Line} from '../Line/Line';
import {Svg} from '../Svg/Svg';

import './header.scss';

interface HeaderProps {
	className?: string;
}

export const Header: FC<HeaderProps> = observer((props) => {
	const {className} = props;

	const {header, page} = ThemeStore;
	const {setIsOpen, setWindow} = ModalStore;
	const {isAuth, name, avatar, setAvatar, setIsAuth, setName, userSelf} = UserStore;

	const [block, element] = useBem('header', className);

	const navigate = useNavigate();

	useEffect(() => {
		(async () => {
			if (isAuth) {
				await getUser();
			}
		})();
	}, []);

	const openLogin = () => {
		setIsOpen(true);
		setWindow('login');
	};

	const openRegistration = () => {
		setIsOpen(true);
		setWindow('registration');
	};

	const handleLogout = () => {
		Cookies.remove('token');
		Cookies.remove('avatar');
		Cookies.remove('name');
		Cookies.remove('user-id');
		setAvatar('');
		setIsAuth(false);
		setName('');
		navigate('/');
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
							<Link className={element('item-link', {active: page === 'isUserSelf'})} to="/user/self">
								Моя доска
							</Link>
						</li>
						<li className={element('item')}>
							<Link className={element('item-link', {active: page === 'isMainGoals'})} to="/list/100-goals">
								100 целей
							</Link>
						</li>
						<li className={element('item')}>
							<Link className={element('item-link', {active: page === 'isCategories'})} to="/categories">
								Категории
							</Link>
						</li>
						<li className={element('item')}>
							<Link className={element('item-link', {active: page === 'isCategoriesAll'})} to="/categories/all">
								Цели и списки
							</Link>
						</li>
						<li className={element('item')}>
							<Link className={element('item-link', {active: page === 'isLeaders'})} to="/leaders">
								Лидеры
							</Link>
						</li>
					</ul>
				</nav>
				{isAuth ? (
					<div className={element('profile-wrapper')}>
						<div className={element('profile')}>
							<Avatar avatar={avatar} size="small" noBorder />
							<span className={element('nickname')}>{name}</span>
						</div>
						<div className={element('profile-menu')}>
							<Link className={element('menu-item')} to={`/user/${userSelf?.id}/showcase/`}>
								Мой профиль
							</Link>
							<Link className={element('menu-item')} to="/user/self">
								Дашборд
							</Link>
							<Link className={element('menu-item')} to="/user/self/achievements">
								Достижения
							</Link>
							<Link className={element('menu-item')} to="/user/self/active-goals">
								Активные цели и списки
							</Link>
							<Link className={element('menu-item')} to="/user/self/done-goals">
								Выполненные
							</Link>
							<Link className={element('menu-item')} to="/user/self/settings">
								Настройки
							</Link>
							<Line margin="8px 0" />
							<button type="button" className={element('menu-item')} onClick={handleLogout}>
								Выход
							</button>
						</div>
					</div>
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
