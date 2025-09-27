import {motion} from 'framer-motion';
import {observer} from 'mobx-react-lite';
import {FC} from 'react';
import {Link} from 'react-router-dom';

import {useBem} from '@/hooks/useBem';
import useScreenSize from '@/hooks/useScreenSize';
import {ThemeStore} from '@/store/ThemeStore';

import {Svg} from '../Svg/Svg';

import './footer.scss';

interface FooterProps {
	className?: string;
}

export const Footer: FC<FooterProps> = observer((props) => {
	const {className} = props;

	const {footer} = ThemeStore;
	const {isScreenMobile, isScreenTablet} = useScreenSize();

	const [block, element] = useBem('footer', className);

	const currentYear = new Date().getFullYear();

	const socialLinks = [
		{icon: 'telegram', href: 'https://t.me/delting', label: 'Telegram'},
		{icon: 'vk', href: 'https://vk.com/delting', label: 'VKontakte'},
		{icon: 'youtube', href: 'https://youtube.com/delting', label: 'YouTube'},
		{icon: 'dzen', href: 'https://dzen.ru/delting', label: 'Дзен'},
	];

	const navigationSections = [
		{
			title: 'Платформа',
			links: [
				{to: '/list/100-goals', label: '100 целей'},
				{to: '/categories/all', label: 'Каталог целей'},
				{to: '/leaders', label: 'Лидеры'},
				{to: '/news', label: 'Новости'},
			],
		},
		{
			title: 'Ресурсы',
			links: [
				{to: '/about', label: 'О проекте'},
				{to: '/help', label: 'Помощь'},
				{to: '/blog', label: 'Блог'},
				{to: '/contacts', label: 'Контакты'},
			],
		},
		{
			title: 'Правовая информация',
			links: [
				{to: '/privacy', label: 'Политика конфиденциальности'},
				{to: '/terms', label: 'Условия использования'},
				{to: '/cookies', label: 'Cookie'},
				{to: '/agreement', label: 'Пользовательское соглашение'},
			],
		},
	];

	return (
		<footer className={block({theme: footer})}>
			<div className={element('content')}>
				<motion.div
					className={element('main-section')}
					initial={{opacity: 0, y: 20}}
					whileInView={{opacity: 1, y: 0}}
					transition={{duration: 0.5}}
					viewport={{once: true}}
				>
					<div className={element('brand')}>
						<Link to="/" className={element('logo')}>
							<Svg icon="delting" className={element('logo-icon')} />
						</Link>
						<p className={element('description')}>
							Платформа для достижения целей и саморазвития. Ставьте цели, отслеживайте прогресс и вдохновляйтесь успехами
							других пользователей.
						</p>
						<div className={element('social')}>
							{socialLinks.map((social) => (
								<a
									key={social.icon}
									href={social.href}
									target="_blank"
									rel="noopener noreferrer"
									className={element('social-link')}
									aria-label={social.label}
								>
									<Svg icon={social.icon} className={element('social-icon')} />
								</a>
							))}
						</div>
					</div>

					<nav className={element('navigation')}>
						{navigationSections.map((section, index) => (
							<motion.div
								key={section.title}
								className={element('nav-section')}
								initial={{opacity: 0, y: 20}}
								whileInView={{opacity: 1, y: 0}}
								transition={{duration: 0.5, delay: index * 0.1}}
								viewport={{once: true}}
							>
								<h3 className={element('nav-title')}>{section.title}</h3>
								<ul className={element('nav-list')}>
									{section.links.map((link) => (
										<li key={link.to} className={element('nav-item')}>
											<Link to={link.to} className={element('nav-link')}>
												{link.label}
											</Link>
										</li>
									))}
								</ul>
							</motion.div>
						))}
					</nav>
				</motion.div>

				<motion.div
					className={element('bottom-section')}
					initial={{opacity: 0}}
					whileInView={{opacity: 1}}
					transition={{duration: 0.5, delay: 0.3}}
					viewport={{once: true}}
				>
					<div className={element('divider')} />
					<div className={element('bottom-content')}>
						<div className={element('copyright')}>
							<Svg icon="copyright" className={element('copyright-icon')} />
							<span>{currentYear} Delting. Все права защищены.</span>
						</div>
						{!isScreenMobile && (
							<div className={element('additional-info')}>
								<span>Сделано с ❤️ для вашего развития</span>
							</div>
						)}
					</div>
				</motion.div>
			</div>
		</footer>
	);
});
