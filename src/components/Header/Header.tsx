import {AnimatePresence, motion} from 'framer-motion';
import Cookies from 'js-cookie';
import {observer} from 'mobx-react-lite';
import {FC, useCallback, useEffect, useRef, useState} from 'react';
import {Link, NavLink, useNavigate} from 'react-router-dom';

import {Button} from '@/components/Button/Button';
import {NotificationDropdown} from '@/components/NotificationDropdown/NotificationDropdown';
import {RegularGoalsDropdown} from '@/components/RegularGoalsDropdown/RegularGoalsDropdown';
import {UserSelfProfile} from '@/containers/UserSelf/UserSelfProfile';
import {useBem} from '@/hooks/useBem';
import useScreenSize from '@/hooks/useScreenSize';
import {CategoriesStore} from '@/store/CategoriesStore';
import {HeaderNotificationsStore} from '@/store/HeaderNotificationsStore';
import {HeaderProgressGoalsStore} from '@/store/HeaderProgressGoalsStore';
import {HeaderRegularGoalsStore} from '@/store/HeaderRegularGoalsStore';
import {ModalStore} from '@/store/ModalStore';
import {UserStore} from '@/store/UserStore';
import {getAllCategories} from '@/utils/api/get/getCategories';
import {getUser} from '@/utils/api/get/getUser';
import {postLogout} from '@/utils/api/post/postLogout';
import {sortMainCategories} from '@/utils/values/categoriesOrder';

import {ThemeStore} from '../../store/ThemeStore';
import {Avatar} from '../Avatar/Avatar';
import {FeedbackModal} from '../FeedbackModal/FeedbackModal';
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
	const isCategoriesLabelVisible = isScreenDesktop || (isScreenTablet && !isScreenSmallTablet);
	const {isAuth, avatar, setAvatar, setIsAuth, setName, userSelf} = UserStore;

	/** Бейдж: общее число из GET /api/user/ (counts.progressGoals); иначе длина первой страницы списка */
	const progressGoalsBadgeCount = userSelf.counts?.progressGoals ?? HeaderProgressGoalsStore.goalsCount;
	const showProgressGoalsBadge = progressGoalsBadgeCount > 0;
	const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
	const [isRegularGoalsOpen, setIsRegularGoalsOpen] = useState(false);
	const [isProgressOpen, setIsProgressOpen] = useState(false);
	const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
	const [isPreHeaderHidden, setIsPreHeaderHidden] = useState(false);
	const [hoveredParentId, setHoveredParentId] = useState<number | null>(null);
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
	const [isSearchOpen, setIsSearchOpen] = useState(false);
	const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
	const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);
	const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

	const [block, element] = useBem('header', className);

	const navigate = useNavigate();
	const homePath = isAuth ? '/categories/all' : '/';

	useEffect(() => {
		if (categoriesTree.length > 0) return;

		const loadCategories = async () => {
			const data = await getAllCategories();
			if (data.success) {
				setCategories(sortMainCategories(data.data));
			}
		};
		loadCategories();
	}, []);

	// Рефы для обработки кликов вне элементов
	const menuRef = useRef<HTMLElement>(null);
	const profileMenuRef = useRef<HTMLDivElement>(null);
	const notificationsRef = useRef<HTMLDivElement>(null);
	const regularGoalsRef = useRef<HTMLButtonElement>(null);
	const progressRef = useRef<HTMLDivElement>(null);
	const categoriesRef = useRef<HTMLLIElement>(null);

	const openLogin = () => {
		setIsOpen(true);
		setWindow('login');
	};

	const openRegistration = () => {
		setIsOpen(true);
		setWindow('registration');
	};

	const handleLogout = async () => {
		// httpOnly cookie 'token' и маркер 'is_authenticated' снимает сервер — JS их не трогает.
		await postLogout();
		// Оставшиеся JS-видимые cookie с отображаемыми данными удаляем на клиенте.
		Cookies.remove('avatar');
		Cookies.remove('name');
		Cookies.remove('user-id');
		Cookies.remove('subscription_type');
		Cookies.remove('user_level');
		Cookies.remove('user_total_completed_goals');
		Cookies.remove('email_confirmed');
		Cookies.remove('email');
		setAvatar('');
		setIsAuth(false);
		setName('');
		HeaderNotificationsStore.clearNotifications();
		HeaderRegularGoalsStore.clear();
		HeaderProgressGoalsStore.clear();
		navigate('/');
	};

	const toggleNotifications = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (!isNotificationsOpen) {
			HeaderNotificationsStore.fetchNotifications();
		}
		setIsNotificationsOpen(!isNotificationsOpen);
	};

	const toggleRegularGoals = (e: React.MouseEvent) => {
		e.stopPropagation();
		setIsRegularGoalsOpen(!isRegularGoalsOpen);
	};

	const toggleProgress = (e: React.MouseEvent) => {
		e.stopPropagation();
		setIsProgressOpen(!isProgressOpen);
	};

	// Обработчик клика вне элементов для закрытия меню
	const handleClickOutside = useCallback((event: MouseEvent) => {
		const target = event.target as Node;
		const modalPhone = (event.target as HTMLElement)?.closest('.modal-phone');
		if (modalPhone) {
			return;
		}

		// Закрытие меню
		if (menuRef.current && !menuRef.current.contains(target)) {
			setIsMenuOpen(false);
		}

		// Закрытие меню категорий
		if (categoriesRef.current && !categoriesRef.current.contains(target)) {
			setIsCategoriesOpen(false);
			setHoveredParentId(null);
		}

		// Закрытие уведомлений
		if (notificationsRef.current && !notificationsRef.current.contains(target)) {
			setIsNotificationsOpen(false);
		}

		// Закрытие регулярных целей
		if (regularGoalsRef.current && !regularGoalsRef.current.contains(target)) {
			setIsRegularGoalsOpen(false);
		}

		// Закрытие всплывашки прогресса
		if (progressRef.current && !progressRef.current.contains(target)) {
			setIsProgressOpen(false);
		}
	}, []);

	const closeCategoriesMenu = useCallback(() => {
		setIsCategoriesOpen(false);
		setHoveredParentId(null);
	}, []);

	// Обработчик клика по аватару на мобильных устройствах
	const handleAvatarClick = () => {
		if (isScreenMobile) {
			setIsUserMenuOpen(true);
		}
	};

	// Обработчик клика по категориям на планшетах
	const handleCategoriesClick = (e: React.MouseEvent) => {
		if (isScreenTablet && !isScreenMobile) {
			e.preventDefault();
			setIsCategoriesOpen(!isCategoriesOpen);
		}
	};

	// Загружаем полный профиль при авторизации, чтобы level и totalCompletedGoals были везде (в т.ч. в хедере)
	useEffect(() => {
		if (isAuth) {
			getUser();
		}
	}, [isAuth]);

	// Скрываем pre-header при прокрутке страницы
	useEffect(() => {
		const handleScroll = () => {
			setIsPreHeaderHidden(window.scrollY > 0);
		};

		handleScroll();
		window.addEventListener('scroll', handleScroll);

		return () => {
			window.removeEventListener('scroll', handleScroll);
		};
	}, []);

	// Загрузка количества регулярных целей на сегодня для бейджа
	useEffect(() => {
		if (isAuth) {
			HeaderRegularGoalsStore.loadTodayCount();
		} else {
			HeaderRegularGoalsStore.clear();
		}
	}, [isAuth]);

	// Загрузка уведомлений при авторизации, очистка при разлогине
	useEffect(() => {
		if (isAuth) {
			HeaderNotificationsStore.startPolling();
		} else {
			HeaderNotificationsStore.clearNotifications();
		}
	}, [isAuth]);

	// Загрузка целей в процессе для бейджа прогресса
	useEffect(() => {
		if (isAuth) {
			HeaderProgressGoalsStore.loadGoalsInProgress();
		} else {
			HeaderProgressGoalsStore.clear();
		}
	}, [isAuth]);

	// Добавляем обработчик клика вне элементов
	useEffect(() => {
		if (isMenuOpen || isCategoriesOpen || isNotificationsOpen || isRegularGoalsOpen || isProgressOpen) {
			document.addEventListener('mousedown', handleClickOutside);
		} else {
			document.removeEventListener('mousedown', handleClickOutside);
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [isMenuOpen, isCategoriesOpen, isNotificationsOpen, isRegularGoalsOpen, isProgressOpen, handleClickOutside]);

	const menuProfile = (
		<div className={element('profile-menu')}>
			<UserSelfProfile hideSubscriptionButton noBorder />
			{isScreenSmallMobile ? (
				<>
					<button
						type="button"
						className={element('menu-item')}
						onClick={() => {
							HeaderNotificationsStore.fetchNotifications();
							setIsNotificationsModalOpen(true);
						}}
					>
						Уведомления
					</button>
					<Line margin="8px 0" />
				</>
			) : (
				<div />
			)}
			<NavLink className={({isActive}: {isActive: boolean}) => element('menu-item', {active: isActive})} to="/user/self" end>
				Дашборд
			</NavLink>
			<NavLink
				className={({isActive}: {isActive: boolean}) => element('menu-item', {active: isActive})}
				to="/user/self/active-goals"
				end
			>
				Активные цели и списки
			</NavLink>
			<NavLink className={({isActive}: {isActive: boolean}) => element('menu-item', {active: isActive})} to="/user/self/progress" end>
				Прогресс целей
			</NavLink>
			<NavLink className={({isActive}: {isActive: boolean}) => element('menu-item', {active: isActive})} to="/user/self/regular" end>
				Регулярные цели
			</NavLink>
			<NavLink className={({isActive}: {isActive: boolean}) => element('menu-item', {active: isActive})} to="/user/self/folders" end>
				Папки целей
			</NavLink>
			<NavLink
				className={({isActive}: {isActive: boolean}) => element('menu-item', {active: isActive})}
				to="/user/self/done-goals"
				end
			>
				Выполненные
			</NavLink>
			<NavLink className={({isActive}: {isActive: boolean}) => element('menu-item', {active: isActive})} to="/user/self/maps" end>
				Мои карты
			</NavLink>
			<NavLink
				className={({isActive}: {isActive: boolean}) => element('menu-item', {active: isActive})}
				to="/user/self/achievements"
				end
			>
				Достижения
			</NavLink>
			<NavLink className={({isActive}: {isActive: boolean}) => element('menu-item', {active: isActive})} to="/user/self/friends" end>
				Друзья
			</NavLink>
			<Line margin="8px 0" />
			<NavLink
				className={({isActive}: {isActive: boolean}) => element('menu-item', {active: isActive})}
				to="/user/self/pending-review"
				end
			>
				Цели на модерации
			</NavLink>
			<NavLink className={({isActive}: {isActive: boolean}) => element('menu-item', {active: isActive})} to="/user/self/subs" end>
				Больше функционала
			</NavLink>
			{isScreenMobile && (
				<NavLink className={({isActive}: {isActive: boolean}) => element('menu-item', {active: isActive})} to="/goals/create" end>
					Создать цель
				</NavLink>
			)}
			<NavLink className={({isActive}: {isActive: boolean}) => element('menu-item', {active: isActive})} to="/user/self/settings" end>
				Настройки
			</NavLink>
			<Button type="button" className={element('menu-item-red')} onClick={handleLogout}>
				Выход
			</Button>
		</div>
	);

	const menuList = (
		<ul className={element('list', {open: isMenuOpen, noAuth: !isAuth})}>
			{!isAuth && isScreenMobile && (
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
				<Link className={element('item-link', {active: page === 'isMainGoals', is100Goals: true})} to="/list/100-goals">
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
			<li className={element('item')}>
				<Link className={element('item-link', {active: page === 'isAbout'})} to="/about">
					О проекте
				</Link>
			</li>
			<li className={element('item')}>
				<Link className={element('item-link', {active: page === 'isHelp'})} to="/help">
					Помощь
				</Link>
			</li>
			<li className={element('item')}>
				<Link className={element('item-link', {active: page === 'isContacts'})} to="/contacts">
					Контакты
				</Link>
			</li>
		</ul>
	);

	const buttonsAuth = (
		<div className={element('profile')}>
			<Button className={element('sign-in')} theme="blue-light" size="medium" onClick={openLogin}>
				Войти
			</Button>
			<Button className={element('registration')} theme="blue" size="medium" onClick={openRegistration}>
				Регистрация
			</Button>
		</div>
	);

	// На desktop/tablet — инлайн-поиск, на md и ниже — кнопка, открывающая модалку
	const searchBlock =
		isScreenDesktop || isScreenTablet ? (
			<GlobalGoalsSearch className={element('search')} theme={header} />
		) : (
			<Button className={element('search-trigger')} onClick={() => setIsSearchOpen(true)} aria-label="Поиск">
				<>
					Поиск целей и списков
					<Svg icon="search" className={element('categories-icon')} width="16px" height="16px" />
				</>
			</Button>
		);

	return (
		<header className={block({theme: header, compact: isPreHeaderHidden})}>
			<div className={element('wrapper-pre-header', {hidden: isPreHeaderHidden})}>
				<nav className={element('nav')} ref={menuRef}>
					{!isScreenMobile && menuList}
				</nav>
				{/* Оставить отзыв о платформе */}
				<button
					type="button"
					className={element('item-link', {active: page === 'isReview'})}
					onClick={() => setIsFeedbackModalOpen(true)}
				>
					{isScreenSmallTablet ? 'Отзыв' : 'Оставить отзыв'}
				</button>
			</div>
			<div className={element('wrapper')}>
				{isScreenSmallMobile ? (
					<>
						{/* Первая строка: меню, логотип, аватар (для ширины < 576px) */}
						<div className={element('row-1')}>
							<div className={element('menu-button-wrap')}>
								<Button className={element('categories-link-menu')} onClick={() => setIsMenuOpen(!isMenuOpen)}>
									<Svg icon="bars" className={element('categories-icon')} width="24px" height="24px" />
								</Button>
							</div>
							<div className={element('logo-wrap')}>
								<Link className={element('logo')} to={homePath} aria-label="Главная">
									<Svg icon="delting" />
								</Link>
							</div>
							{isAuth ? (
								<div className={element('row-1-avatar')}>
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
										aria-label="Открыть меню пользователя"
									>
										<Avatar
											avatar={avatar}
											size="small"
											noBorder
											isPremium={userSelf?.subscriptionType === 'premium'}
										/>
									</div>
								</div>
							) : (
								<div className={element('row-1-avatar')}>
									<button
										type="button"
										className={element('profile')}
										onClick={() => setIsUserMenuOpen(true)}
										aria-label="Открыть меню пользователя"
									>
										<Svg icon="user" width="16px" height="16px" className={element('profile-icon')} />
									</button>
								</div>
							)}
						</div>
						{/* Вторая строка: категории и поиск */}
						<ul className={element('list-categories', {row2: true})}>
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
								<Button className={element('categories-link')} onClick={() => setIsCategoriesModalOpen(true)}>
									<Svg icon="apps" className={element('categories-icon')} />
								</Button>
							</li>
							<li className={element('search-item')}>{searchBlock}</li>
						</ul>
					</>
				) : (
					<>
						<Link className={element('logo')} to={homePath} aria-label="Главная">
							{isScreenMobile ? <Svg icon="icon-logo" className={element('logo-icon')} /> : <Svg icon="delting" />}
						</Link>
						{isScreenMobile && !isScreenSmallMobile && (
							<Button width="auto" className={element('categories-link-menu')} onClick={() => setIsMenuOpen(!isMenuOpen)}>
								<Svg icon="bars" className={element('categories-icon')} width="24px" height="24px" />
							</Button>
						)}
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
										{isCategoriesLabelVisible ? 'Категории' : ''}
									</button>
								) : !isScreenDesktop ? (
									<Button className={element('categories-link')} onClick={() => setIsCategoriesModalOpen(true)}>
										<Svg icon="apps" className={element('categories-icon')} />
									</Button>
								) : (
									<div className={element('categories-link')}>
										<Svg icon="apps" className={element('categories-icon')} />
										{isCategoriesLabelVisible ? 'Категории' : ''}
									</div>
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
													onMouseEnter={() => {
														if (isScreenDesktop) setHoveredParentId(category.id);
													}}
													onMouseLeave={() => {
														if (isScreenDesktop) setHoveredParentId(null);
													}}
												>
													<Link
														className={element('category-link')}
														to={`/categories/${category.nameEn}`}
														onClick={() => closeCategoriesMenu()}
													>
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
														<span
															className={element('categories-arrow')}
															role="button"
															tabIndex={0}
															onClick={(e) => {
																if (isScreenDesktop) return;
																e.preventDefault();
																e.stopPropagation();
																setHoveredParentId((prev) => (prev === category.id ? null : category.id));
															}}
															aria-label="Открыть подкатегории"
															onKeyDown={(e) => {
																if (isScreenDesktop) return;
																if (e.key === 'Enter' || e.key === ' ') {
																	e.preventDefault();
																	e.stopPropagation();
																	setHoveredParentId((prev) =>
																		prev === category.id ? null : category.id
																	);
																}
															}}
														>
															<Svg icon="arrow" />
														</span>
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
																		to={`/categories/${category.nameEn}/${child.nameEn}`}
																		onClick={() => closeCategoriesMenu()}
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
							<li className={element('search-item')}>{searchBlock}</li>
						</ul>

						{isAuth ? (
							!isScreenSmallMobile && (
								<div className={element('right-menu')}>
									{/* создать кнопка */}
									{!isScreenMobile && (
										<Button size="small" type="Link" theme="light" icon="plus" iconSize="24px" href="/goals/create">
											{isScreenSmallTablet ? '' : 'Создать'}
										</Button>
									)}
									<div className={element('notifications-wrapper')} ref={notificationsRef}>
										{/* Кнопка уведомлений */}
										<button
											type="button"
											className={element('notifications-button', {active: isNotificationsOpen})}
											onClick={toggleNotifications}
											aria-label="Уведомления"
										>
											{HeaderNotificationsStore.hasUnreadNotifications ? (
												<span className={element('regular-goals-badge')}>
													<Svg icon="bell" className={element('regular-goals-badge-icon', {theme: header})} />
													<span className={element('regular-goals-badge-count', {theme: header})}>
														{HeaderNotificationsStore.unreadCount > 99
															? '99+'
															: HeaderNotificationsStore.unreadCount}
													</span>
												</span>
											) : (
												<Svg icon="bell" className={element('notifications-icon', {theme: header})} />
											)}
										</button>

										{/* Кнопка прогресса */}
										{!isScreenMobile && (
											<div className={element('progress-wrapper')} ref={progressRef}>
												<button
													type="button"
													className={element('notifications-button', {
														progress: true,
														active: isProgressOpen,
													})}
													onClick={toggleProgress}
													aria-label="Прогресс"
												>
													{showProgressGoalsBadge ? (
														<span
															className={element('regular-goals-badge', {
																allCompleted: isProgressOpen,
															})}
														>
															<Svg
																icon="signal"
																className={element('regular-goals-badge-icon', {theme: header})}
															/>
															<span className={element('regular-goals-badge-count', {theme: header})}>
																{progressGoalsBadgeCount > 99 ? '99+' : progressGoalsBadgeCount}
															</span>
														</span>
													) : (
														<Svg icon="signal" className={element('regular-goals-icon', {theme: header})} />
													)}
												</button>
												<AnimatePresence>
													{isProgressOpen && (
														<motion.div
															initial={{opacity: 0, y: -10}}
															animate={{opacity: 1, y: 0}}
															exit={{opacity: 0, y: -10}}
															transition={{duration: 0.2, ease: 'easeOut'}}
															className={element('progress-dropdown')}
														>
															<RegularGoalsDropdown
																variant="progress"
																isOpen={isProgressOpen}
																onClose={() => setIsProgressOpen(false)}
															/>
														</motion.div>
													)}
												</AnimatePresence>
											</div>
										)}

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
										{/* Кнопка регулярных целей */}
										{!isScreenMobile && (
											<>
												<button
													type="button"
													className={element('notifications-button', {active: isRegularGoalsOpen})}
													onClick={toggleRegularGoals}
													aria-label="Регулярные цели"
												>
													{HeaderRegularGoalsStore.hasRegularGoals ? (
														<span
															className={element('regular-goals-badge', {
																allCompleted: HeaderRegularGoalsStore.allCompletedToday,
															})}
														>
															<Svg
																icon={
																	HeaderRegularGoalsStore.allCompletedToday ? 'regular' : 'regular-empty'
																}
																className={element('regular-goals-badge-icon', {
																	theme: header,
																	completed: HeaderRegularGoalsStore.allCompletedToday,
																})}
															/>
															<span className={element('regular-goals-badge-count', {theme: header})}>
																{HeaderRegularGoalsStore.totalCount}
															</span>
														</span>
													) : (
														<Svg
															icon="regular-empty"
															className={element('regular-goals-icon', {theme: header})}
														/>
													)}
												</button>
												<AnimatePresence>
													{isRegularGoalsOpen && (
														<motion.div
															initial={{opacity: 0, y: -10}}
															animate={{opacity: 1, y: 0}}
															exit={{opacity: 0, y: -10}}
															transition={{duration: 0.2, ease: 'easeOut'}}
															className={element('regular-goals-dropdown')}
														>
															<RegularGoalsDropdown
																isOpen={isRegularGoalsOpen}
																onClose={() => setIsRegularGoalsOpen(false)}
															/>
														</motion.div>
													)}
												</AnimatePresence>
											</>
										)}
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
											<Avatar
												avatar={avatar}
												size="small"
												noBorder
												isPremium={userSelf?.subscriptionType === 'premium'}
											/>
											{!isScreenMobile && <Svg icon="arrow--right" className={element('profile-arrow')} />}
										</div>
										{!isScreenMobile && menuProfile}
									</div>
								</div>
							)
						) : isScreenMobile ? (
							<div className={element('right-menu')}>
								<div className={element('profile-wrapper')}>
									<button
										type="button"
										className={element('profile')}
										onClick={() => setIsUserMenuOpen(true)}
										aria-label="Открыть меню пользователя"
									>
										<Svg icon="user" width="16px" height="16px" className={element('profile-icon')} />
									</button>
								</div>
							</div>
						) : (
							buttonsAuth
						)}
					</>
				)}
			</div>
			<ModalPhone title="Меню" isOpen={isScreenMobile && isMenuOpen} onClose={() => setIsMenuOpen(false)}>
				<div className={element('menu-wrapper')}>
					{menuList}
					<Line margin="0" />
					<button
						type="button"
						className={element('item-link', {active: page === 'isReview'})}
						onClick={() => setIsFeedbackModalOpen(true)}
					>
						Оставить отзыв
					</button>
				</div>
			</ModalPhone>
			<ModalPhone title="Пользователь" isOpen={isScreenMobile && isUserMenuOpen} onClose={() => setIsUserMenuOpen(false)}>
				<div className={element('menu-wrapper')}>{isAuth ? menuProfile : buttonsAuth}</div>
			</ModalPhone>
			<ModalPhone title="Поиск" isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)}>
				<GlobalGoalsSearch className={element('search')} isModal onModalClose={() => setIsSearchOpen(false)} />
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
											to={`/categories/${category.nameEn}/${child.nameEn}`}
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
			<ModalPhone title="Уведомления" isOpen={isNotificationsModalOpen} onClose={() => setIsNotificationsModalOpen(false)}>
				<NotificationDropdown
					isOpen={isNotificationsModalOpen}
					onClose={() => setIsNotificationsModalOpen(false)}
					disableClickOutside
					inModal
				/>
			</ModalPhone>
			<FeedbackModal isOpen={isFeedbackModalOpen} onClose={() => setIsFeedbackModalOpen(false)} />
		</header>
	);
});
