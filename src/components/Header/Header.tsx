import {AnimatePresence, motion} from 'framer-motion';
import Cookies from 'js-cookie';
import {observer} from 'mobx-react-lite';
import {FC, useCallback, useEffect, useRef, useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';

import {Button} from '@/components/Button/Button';
import {NotificationDropdown} from '@/components/NotificationDropdown/NotificationDropdown';
import {useBem} from '@/hooks/useBem';
import useScreenSize from '@/hooks/useScreenSize';
import {CategoriesStore} from '@/store/CategoriesStore';
import {HeaderNotificationsStore} from '@/store/HeaderNotificationsStore';
import {ModalStore} from '@/store/ModalStore';
import {UserStore} from '@/store/UserStore';
import {getAllCategories} from '@/utils/api/get/getCategories';

import {ThemeStore} from '../../store/ThemeStore';
import {Avatar} from '../Avatar/Avatar';
import {GlobalGoalsSearch} from '../GlobalGoalsSearch/GlobalGoalsSearch';
import {Line} from '../Line/Line';
import {ModalPhone} from '../ModalPhone/ModalPhone';
import {Svg} from '../Svg/Svg';

import './header.scss';

interface HeaderProps {
	className?: string;
}

export const Header: FC<HeaderProps> = observer((props) => {
	const {className} = props;

	const {header, page} = ThemeStore;
	const {setIsOpen, setWindow} = ModalStore;
	const {categoriesTree, setCategories} = CategoriesStore;
	const {isScreenDesktop, isScreenSmallTablet, isScreenMobile, isScreenSmallMobile, isScreenTablet} = useScreenSize();
	const {isAuth, name, avatar, setAvatar, setIsAuth, setName, userSelf} = UserStore;
	const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
	const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
	const [hoveredParentId, setHoveredParentId] = useState<number | null>(null);
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [isSearchOpen, setIsSearchOpen] = useState(false);
	const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);

	const [block, element] = useBem('header', className);

	const navigate = useNavigate();

	useEffect(() => {
		if (categoriesTree.length > 0) return;

		const loadCategories = async () => {
			const data = await getAllCategories();
			setCategories(data.data);
		};
		loadCategories();
	}, []);

	// Рефы для обработки кликов вне элементов
	const menuRef = useRef<HTMLElement>(null);
	const profileMenuRef = useRef<HTMLDivElement>(null);
	const notificationsRef = useRef<HTMLDivElement>(null);
	const categoriesRef = useRef<HTMLLIElement>(null);

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
		HeaderNotificationsStore.clearNotifications();
		navigate('/');
	};

	const toggleNotifications = (e: React.MouseEvent) => {
		e.stopPropagation();
		setIsNotificationsOpen(!isNotificationsOpen);
	};

	// Обработчик клика вне элементов для закрытия меню
	const handleClickOutside = useCallback((event: MouseEvent) => {
		// Закрытие меню
		if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
			setIsMenuOpen(false);
		}

		// Закрытие меню категорий
		if (categoriesRef.current && !categoriesRef.current.contains(event.target as Node)) {
			setIsCategoriesOpen(false);
			setHoveredParentId(null);
		}

		// Закрытие уведомлений
		if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
			setIsNotificationsOpen(false);
		}
	}, []);

	// Обработчик клика по аватару на мобильных устройствах
	const handleAvatarClick = () => {
		if (isScreenMobile) {
			setIsMenuOpen(true);
		}
	};

	// Обработчик клика по категориям на планшетах
	const handleCategoriesClick = (e: React.MouseEvent) => {
		if (isScreenTablet && !isScreenMobile) {
			e.preventDefault();
			setIsCategoriesOpen(!isCategoriesOpen);
		}
	};

	// Добавляем обработчик клика вне элементов
	useEffect(() => {
		if (isMenuOpen || isCategoriesOpen || isNotificationsOpen) {
			document.addEventListener('mousedown', handleClickOutside);
		} else {
			document.removeEventListener('mousedown', handleClickOutside);
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [isMenuOpen, isCategoriesOpen, isNotificationsOpen, handleClickOutside]);

	const menuProfile = (
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
			<Link className={element('menu-item')} to="/user/self/friends">
				Друзья
			</Link>
			<Link className={element('menu-item')} to="/user/self/maps">
				Мои карты
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
			{!isScreenMobile && <Line margin="8px 0" />}
			<button type="button" className={element('menu-item')} onClick={handleLogout}>
				Выход
			</button>
		</div>
	);

	const menuList = (
		<ul className={element('list', {open: isMenuOpen, noAuth: !isAuth})}>
			{!isAuth && isScreenSmallTablet && (
				<>
					<Button theme="integrate" size="small" onClick={openLogin}>
						Войти
					</Button>
					<Button theme="integrate" size="small" onClick={openRegistration}>
						Регистрация
					</Button>
					<Line className={element('list-line')} margin="8px 0" />
				</>
			)}

			<li className={element('item')}>
				<Link className={element('item-link', {active: page === 'isMainGoals'})} to="/list/100-goals">
					100 целей
				</Link>
			</li>
			<li className={element('item')}>
				<Link className={element('item-link', {active: page === 'isCategoriesAll'})} to="/categories/all">
					Каталог
				</Link>
			</li>
			<li className={element('item')}>
				<Link className={element('item-link', {active: page === 'isLeaders'})} to="/leaders">
					Лидеры
				</Link>
			</li>
			<li className={element('item')}>
				<Link className={element('item-link', {active: page === 'isNews'})} to="/news">
					Новости
				</Link>
			</li>
		</ul>
	);

	const buttonsAuth = (
		<div className={element('profile')}>
			<Button className={element('sign-in')} theme="blue-light" size={isScreenMobile ? 'medium' : 'small'} onClick={openLogin}>
				Войти
			</Button>
			<Button
				className={element('registration')}
				theme="blue"
				size={isScreenMobile ? 'medium' : 'small'}
				icon="rocket"
				onClick={openRegistration}
			>
				Регистрация
			</Button>
		</div>
	);

	return (
		<header className={block({theme: header})}>
			<div className={element('wrapper')}>
				<Link className={element('logo')} to="/" aria-label="Главная">
					{isScreenMobile ? <Svg icon="icon-logo" className={element('logo-icon')} /> : <Svg icon="delting" />}
				</Link>
				<ul className={element('list-categories')}>
					<li
						ref={categoriesRef}
						className={element('categories-item')}
						onMouseEnter={() => isScreenDesktop && setIsCategoriesOpen(true)}
						onMouseLeave={() => {
							if (isScreenDesktop) {
								setIsCategoriesOpen(false);
								setHoveredParentId(null);
							}
						}}
					>
						{isScreenTablet ? (
							<button type="button" className={element('categories-link')} onClick={handleCategoriesClick}>
								<Svg icon="apps" className={element('categories-icon')} />
								{isScreenDesktop ? 'Категории' : ''}
							</button>
						) : !isScreenDesktop ? (
							<Button className={element('categories-link')} onClick={() => setIsCategoriesModalOpen(true)}>
								<Svg icon="apps" className={element('categories-icon')} />
							</Button>
						) : (
							<Link className={element('categories-link')} to="/categories">
								<Svg icon="apps" className={element('categories-icon')} />
								{isScreenDesktop ? 'Категории' : ''}
							</Link>
						)}
						<AnimatePresence>
							{isCategoriesOpen && (
								<motion.ul
									className={element('categories-list', {open: true})}
									initial={{opacity: 0, y: 8}}
									animate={{opacity: 1, y: 0}}
									exit={{opacity: 0, y: 8}}
									transition={{duration: 0.15, ease: 'easeOut'}}
								>
									{categoriesTree.map((category) => (
										<li
											key={category.id}
											className={element('categories-item-parent')}
											onMouseEnter={() => setHoveredParentId(category.id)}
											onMouseLeave={() => setHoveredParentId(null)}
										>
											<Link className={element('category-link')} to={`/categories/${category.nameEn}`}>
												{category?.icon ? (
													<img
														src={category?.icon}
														alt={category?.name}
														className={element('categories-icon-img')}
													/>
												) : (
													<Svg icon={category?.icon || 'apps'} />
												)}
												{category.name}
												<Svg icon="arrow" className={element('categories-arrow')} />
											</Link>
											<AnimatePresence>
												{category.children.length > 0 && hoveredParentId === category.id && (
													<motion.ul
														className={element('categories-list', {child: true, open: true})}
														initial={{opacity: 0, x: 8}}
														animate={{opacity: 1, x: 0}}
														exit={{opacity: 0, x: 8}}
														transition={{duration: 0.15, ease: 'easeOut'}}
													>
														{category.children.map((child) => (
															<Link
																key={child.id}
																className={element('category-link', {child: true})}
																to={`/categories/${child.nameEn}`}
															>
																{child.name}
															</Link>
														))}
													</motion.ul>
												)}
											</AnimatePresence>
										</li>
									))}
								</motion.ul>
							)}
						</AnimatePresence>
					</li>

					{/* Поиск по целям */}
					<li className={element('search-item')}>
						{isScreenMobile ? (
							<Button className={element('categories-link')} icon="search" onClick={() => setIsSearchOpen(true)}>
								Поиск
							</Button>
						) : (
							<GlobalGoalsSearch className={element('search')} theme={header} />
						)}
					</li>
				</ul>
				<nav className={element('nav')} ref={menuRef}>
					{(isScreenSmallTablet || isScreenMobile) && (
						<Button className={element('categories-link')} onClick={() => setIsMenuOpen(!isMenuOpen)}>
							<>
								<Svg icon="bars" className={element('categories-icon')} />
								{!isScreenSmallMobile ? 'Меню' : ''}
							</>
						</Button>
					)}
					{!isScreenMobile && menuList}
				</nav>
				{isAuth
					? !isScreenSmallMobile && (
							<div className={element('right-menu')}>
								{/* Кнопка уведомлений */}
								<div className={element('notifications-wrapper')} ref={notificationsRef}>
									<button
										type="button"
										className={element('notifications-button')}
										onClick={toggleNotifications}
										aria-label="Уведомления"
									>
										<Svg icon="bell" className={element('notifications-icon', {theme: header})} />
										{HeaderNotificationsStore.hasUnreadNotifications && (
											<span className={element('notifications-badge')}>
												{HeaderNotificationsStore.unreadCount > 99 ? '99+' : HeaderNotificationsStore.unreadCount}
											</span>
										)}
									</button>
									<AnimatePresence>
										{isNotificationsOpen && (
											<motion.div
												initial={{opacity: 0, y: -10}}
												animate={{opacity: 1, y: 0}}
												exit={{opacity: 0, y: -10}}
												transition={{duration: 0.2, ease: 'easeOut'}}
												className={element('notifications-dropdown')}
											>
												<NotificationDropdown
													isOpen={isNotificationsOpen}
													onClose={() => setIsNotificationsOpen(false)}
												/>
											</motion.div>
										)}
									</AnimatePresence>
								</div>

								<div className={element('profile-wrapper')} ref={profileMenuRef}>
									<div
										className={element('profile')}
										role="button"
										tabIndex={0}
										onClick={handleAvatarClick}
										onKeyDown={(e) => {
											if (e.key === 'Enter' || e.key === ' ') {
												e.preventDefault();
												handleAvatarClick();
											}
										}}
									>
										<Avatar avatar={avatar} size="small" noBorder />
										{/* <span className={element('nickname')}>{name}</span> */}
										{!isScreenMobile && <Svg icon="arrow--right" className={element('profile-arrow')} />}
									</div>
									{!isScreenMobile && menuProfile}
								</div>
							</div>
					  )
					: !isScreenSmallTablet && !isScreenMobile && buttonsAuth}
			</div>
			<ModalPhone title="Меню" isOpen={isScreenMobile && isMenuOpen} onClose={() => setIsMenuOpen(false)}>
				<div className={element('menu-wrapper')}>
					{isAuth && (
						<div className={element('profile')}>
							<Avatar avatar={avatar} size="small" noBorder />
							<span className={element('nickname')}>{name}</span>
							{!isScreenMobile && <Svg icon="arrow--right" className={element('profile-arrow')} />}
						</div>
					)}
					{menuList}
					<Line margin="0" />
					{isAuth ? menuProfile : buttonsAuth}
				</div>
			</ModalPhone>
			<ModalPhone title="Поиск" isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)}>
				<GlobalGoalsSearch className={element('search')} isModal />
			</ModalPhone>
			<ModalPhone title="Категории" isOpen={isCategoriesModalOpen} onClose={() => setIsCategoriesModalOpen(false)}>
				<div className={element('categories-modal')}>
					{categoriesTree.map((category) => (
						<div key={category.id} className={element('category-group')}>
							<Link
								className={element('category-main-link')}
								to={`/categories/${category.nameEn}`}
								onClick={() => setIsCategoriesModalOpen(false)}
							>
								{category?.icon ? (
									<img src={category?.icon} alt={category?.name} className={element('categories-icon-img')} />
								) : (
									<Svg icon={category?.icon || 'apps'} />
								)}
								{category.name}
							</Link>
							{category.children.length > 0 && (
								<div className={element('category-children')}>
									{category.children.map((child) => (
										<Link
											key={child.id}
											className={element('category-child-link')}
											to={`/categories/${child.nameEn}`}
											onClick={() => setIsCategoriesModalOpen(false)}
										>
											{child.name}
										</Link>
									))}
								</div>
							)}
						</div>
					))}
				</div>
			</ModalPhone>
		</header>
	);
});
