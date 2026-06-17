import {motion} from 'framer-motion';
import {observer} from 'mobx-react-lite';
import {FC, useMemo, useState} from 'react';
import {Link} from 'react-router-dom';

import {Svg} from '@/components/Svg/Svg';
import {Title} from '@/components/Title/Title';
import {useBem} from '@/hooks/useBem';
import {UserStore} from '@/store/UserStore';

import {faq, FAQ_LINK_USER_SHOWCASE, quickLinks, resolveFaqLink} from './help-data';
import {HelpFaqItem} from './HelpFaqItem';

import './help-container.scss';

const categories = [
	{label: 'Все', value: 'all'},
	{label: 'Цели', value: 'goals'},
	{label: 'Прогресс', value: 'progress'},
	{label: 'Premium', value: 'premium'},
	{label: 'Профиль', value: 'profile'},
	{label: 'Система', value: 'system'},
	{label: 'Социальные', value: 'social'},
];

export const HelpContainer: FC = observer(() => {
	const [block, element] = useBem('help-container');
	const [openSection, setOpenSection] = useState<string | null>(null);
	const [search, setSearch] = useState('');
	const [activeCategory, setActiveCategory] = useState('all');
	const {userSelf, isAuth} = UserStore;

	const filteredFaq = useMemo(() => {
		return faq
			.filter((item) => {
				const matchesSearch = item.question.toLowerCase().includes(search.toLowerCase());
				const matchesCategory = activeCategory === 'all' || item.category === activeCategory;

				return matchesSearch && matchesCategory;
			})
			.map((item) => ({
				...item,
				link: resolveFaqLink(item.link, userSelf.id),
				linkText:
					item.link === FAQ_LINK_USER_SHOWCASE && !isAuth ? 'Войти, чтобы открыть витрину' : item.linkText,
			}));
	}, [search, activeCategory, userSelf.id, isAuth]);

	return (
		<main className={block()}>
			<div className={element('hero')}>
				<motion.div
					className={element('hero-content')}
					initial={{opacity: 0, y: 20}}
					animate={{opacity: 1, y: 0}}
					transition={{duration: 0.5}}
				>
					<h1 className={element('hero-title')}>
						Нужна <span className={element('hero-title-accent')}>помощь</span>?
					</h1>

					<p className={element('hero-description')}>Ответы на частые вопросы и инструкции по работе с платформой.</p>
				</motion.div>
			</div>

			<div className={element('content')}>
				<section className={element('section')}>
					<Title tag="h2" className={element('section-title')}>
						Быстрые ссылки
					</Title>

					<div className={element('quick-links')}>
						{quickLinks.map((link, index) => (
							<motion.div
								key={link.title}
								className={element('quick-link-card')}
								initial={{opacity: 0, y: 20}}
								whileInView={{opacity: 1, y: 0}}
								transition={{
									duration: 0.5,
									delay: index * 0.1,
								}}
								viewport={{once: true}}
							>
								<Link to={link.href} className={element('quick-link-link')}>
									<div className={element('quick-link-icon')}>
										<Svg icon={link.icon} width="24px" height="24px" />
									</div>

									<h3>{link.title}</h3>
									<p>{link.description}</p>
								</Link>
							</motion.div>
						))}
					</div>
				</section>
				<section className={element('section')}>
					<Title tag="h2" className={element('section-title')}>
						Часто задаваемые вопросы
					</Title>

					<div className={element('search')}>
						<input
							type="text"
							placeholder="Поиск по вопросам..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className={element('search-input')}
						/>
					</div>

					<div className={element('categories')}>
						{categories.map((category) => (
							<button
								key={category.value}
								type="button"
								className={element('category-button', {
									active: activeCategory === category.value,
								})}
								onClick={() => setActiveCategory(category.value)}
							>
								{category.label}
							</button>
						))}
					</div>

					<div className={element('faq')}>
						{filteredFaq.map((item) => (
							<HelpFaqItem
								key={item.id}
								item={item}
								isOpen={openSection === item.id}
								onToggle={() => setOpenSection(openSection === item.id ? null : item.id)}
							/>
						))}
					</div>
				</section>

				<motion.section
					className={element('section', {cta: true})}
					initial={{opacity: 0}}
					whileInView={{opacity: 1}}
					transition={{duration: 0.5}}
				>
					<h2 className={element('cta-title')}>Не нашли ответ?</h2>

					<p className={element('cta-description')}>
						Свяжитесь с нами через{' '}
						<Link to="/contacts" className={element('link')}>
							Контакты
						</Link>
					</p>
				</motion.section>
			</div>
		</main>
	);
});
